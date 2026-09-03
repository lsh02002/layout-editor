import type { CSSProperties } from "react";

import type { LayoutComponent } from "../../../types/types";

import { getLinkHref } from "./linkUtils";
import { compressImageUrl } from "./projectUtils";
import { collectComponentCustomCss } from "./customCssUtils";
import {
  codeHighlight,
  highlightCode,
  normalizeCodeLanguage,
} from "./codeHighlight";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const escapeAttribute = (value: string) => escapeHtml(value);

const UNITLESS_PROPERTIES = new Set([
  "animationIterationCount",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridArea",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
]);

const styleToCss = (style?: CSSProperties) => {
  if (!style) {
    return "";
  }

  return Object.entries(style)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => {
      const cssKey = key
        .replace(/^ms-/, "-ms-")
        .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

      const cssValue =
        typeof value === "number" &&
        value !== 0 &&
        !UNITLESS_PROPERTIES.has(key)
          ? `${value}px`
          : String(value);

      return `${cssKey}:${cssValue}`;
    })
    .join(";");
};

const componentToHtml = async (component: LayoutComponent): Promise<string> => {
  const wrapperStyle = styleToCss(component.style);
  const contentStyle = styleToCss(component.contentStyle);
  const componentId = escapeAttribute(component.id);
  const componentName = escapeAttribute(component.name ?? component.type);

  const wrapperClass = [
    "builder-component",
    `builder-component-${component.type}`,
  ].join(" ");

  switch (component.type) {
    case "button": {
      const disabled = component.props.disabled ? " disabled" : "";

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="button"
          data-component-name="${componentName}"
          style="${escapeAttribute(wrapperStyle)}"
        >
          <button
            type="button"
            class="builder-button"
            style="${escapeAttribute(contentStyle)}"${disabled}
          >
            ${escapeHtml(component.props.title)}
          </button>
        </div>`;
    }

    case "scrollToTopButton": {
      const disabled = component.props.disabled ? " disabled" : "";

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="scrollToTopButton"
          data-component-name="${componentName}"
        >
          <button
            type="button"
            class="builder-scroll-to-top-button"
            aria-label="${escapeAttribute(component.props.title || "맨 위로 이동")}"
            onclick="window.scrollTo({ top: 0, behavior: 'smooth' })"
            style="${escapeAttribute(
              [
                wrapperStyle,
                contentStyle,
                "display:flex",
                "align-items:center",
                "justify-content:center",
                "border-radius:50%",
                "color:#fff",
                "background-color:#6c757d",
                "border:1px solid #6c757d",
                "padding:0.375rem 0.75rem",
                "font-size:1rem",
                "line-height:1.5",
                "text-align:center",
                "cursor:pointer",
                "user-select:none",
              ]
                .filter(Boolean)
                .join(";"),
            )}"${disabled}
          >
            ${escapeHtml(component.props.title)}
          </button>
        </div>`;
    }

    case "heading": {
      const tag = `h${component.props.level}`;

      const defaultFontSize =
        {
          1: "2.5rem",
          2: "2rem",
          3: "1.75rem",
          4: "1.5rem",
          5: "1.25rem",
          6: "1rem",
        }[component.props.level] ?? "1rem";

      return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="heading"
      data-component-name="${componentName}"
      style="${escapeAttribute(wrapperStyle)}"
    >
      <${tag}
        class="builder-heading"
        style="${escapeAttribute(
          [
            "margin:0",
            "padding:0",
            `font-size:${defaultFontSize}`,
            "font-family:inherit",
            "font-weight:700",
            "line-height:1.2",
            "word-break:break-word",
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >
        ${escapeHtml(component.props.text)}
      </${tag}>
    </div>`;
    }

    case "textarea": {
      const text = component.props.value || component.props.placeholder || "";

      return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="textarea"
      data-component-name="${componentName}"
      style="${escapeAttribute(wrapperStyle)}"
    >
      <div
        class="builder-textarea"
        style="${escapeAttribute(
          [
            "display:block",
            "box-sizing:border-box",
            "width:100%",
            "max-width:100%",
            "overflow:visible",
            "font-family:inherit",
            "font-size:inherit",
            "font-weight:inherit",
            "font-style:inherit",
            "line-height:inherit",
            "letter-spacing:inherit",
            "color:inherit",
            "border:none",
            "word-break:break-word",
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >${escapeHtml(text)}</div>
    </div>`;
    }

    case "quill": {
      const html =
        component.props.value ||
        (component.props.placeholder
          ? `<p>${escapeHtml(component.props.placeholder)}</p>`
          : "");

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="quill"
          data-component-name="${componentName}"
          style="${escapeAttribute(wrapperStyle)}"
        >
          <div
            class="builder-rich-text"
            style="${escapeAttribute(
              ["word-break:break-word", contentStyle].filter(Boolean).join(";"),
            )}"
          >
            ${html}
          </div>
        </div>`;
    }

    case "image": {
      const originalUrl = component.props.urls?.[0] ?? "";

      if (!originalUrl) {
        return `
          <div
            class="${wrapperClass}"
            data-component-id="${componentId}"
            data-component-type="image"
            data-component-name="${componentName}"
            style="${escapeAttribute(wrapperStyle)}"
          ></div>`;
      }

      let imageUrl = originalUrl;
      try {
        imageUrl = await compressImageUrl(originalUrl, 1600, 1600, 0.8);
      } catch (error) {
        console.error("HTML 이미지 압축 실패:", error);
      }

      return `<div 
        class="${wrapperClass}" 
        data-component-id="${componentId}" 
        data-component-type="image" 
        data-component-name="${componentName}" 
        style="${escapeAttribute(wrapperStyle)}" 
      > 
        <img 
          class="builder-image" 
          src="${escapeAttribute(imageUrl)}" 
          alt="${componentName}" 
          loading="lazy" 
          decoding="async" 
          style="${escapeAttribute(
            [
              "display:block",
              "width:100%",
              "height:100%",
              "object-fit:fill",
              contentStyle,
            ]
              .filter(Boolean)
              .join(";"),
          )}" 
        /> 
      </div>`;
    }

    case "imageGallery": {
      const urls = component.props.urls?.filter(Boolean) ?? [];
      const columns = Math.max(component.props.columns ?? 3, 1);
      const gap = Math.max(component.props.gap ?? 8, 0);
      const objectFit = component.props.objectFit ?? "cover";
      const borderRadius = Math.max(component.props.borderRadius ?? 8, 0);

      const images = urls
        .map(
          (url, index) => `
        <div
          style="
            width:100%;
            aspect-ratio:1/1;
            overflow:hidden;
            border-radius:${borderRadius}px;
          "
        >
          <img
            src="${escapeAttribute(url)}"
            alt="${escapeAttribute(`${componentName} ${index + 1}`)}"
            loading="lazy"
            decoding="async"
            style="
              display:block;
              width:100%;
              height:100%;
              object-fit:${objectFit};
            "
          />
        </div>
      `,
        )
        .join("");

      return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="imageGallery"
      data-component-name="${componentName}"
      style="${escapeAttribute(wrapperStyle)}"
    >
      <div
        style="
          display:grid;
          width:100%;
          grid-template-columns:repeat(${columns}, minmax(0, 1fr));
          gap:${gap}px;
          ${contentStyle}
        "
      >
        ${images}
      </div>
    </div>
  `;
    }

    case "imageSlider": {
      const urls = component.props.urls?.filter(Boolean) ?? [];

      if (!urls.length) {
        return `
      <div
        class="${wrapperClass}"
        data-component-id="${componentId}"
        data-component-type="imageSlider"
        data-component-name="${componentName}"
        style="${escapeAttribute(wrapperStyle)}"
      ></div>
    `;
      }

      const autoplay = component.props.autoplay ?? false;
      const interval = Math.max(component.props.interval ?? 3000, 500);
      const showArrows = component.props.showArrows ?? true;
      const showDots = component.props.showDots ?? true;
      const loop = component.props.loop ?? true;
      const sliderId = `slider-${componentId}`;
      const slideUrls =
        loop && urls.length > 1
          ? [urls[urls.length - 1], ...urls, urls[0]]
          : urls;
      const startIndex = loop && urls.length > 1 ? 1 : 0;
      const slides = slideUrls
        .map(
          (url, index) => `
        <div
          class="builder-slider-slide"
          data-slide-index="${index}"
          style="
            flex:0 0 100%;
            width:100%;
            height:100%;
            min-width:0;
          "
        >
          <img
            src="${escapeAttribute(url)}"
            alt="${escapeAttribute(`${componentName} ${index + 1}`)}"
            draggable="false"
            style="
              display:block;
              width:100%;
              height:100%;
              object-fit:fill;
              user-select:none;
              pointer-events:none;
            "
          />
        </div>
      `,
        )
        .join("");

      const arrows =
        showArrows && urls.length > 1
          ? `
        <button
          type="button"
          class="builder-slider-prev"
          aria-label="이전 슬라이드"
          style="
            position:absolute;
            left:12px;
            top:50%;
            z-index:5;
            width:36px;
            height:36px;
            padding:0;
            border:0;
            border-radius:50%;
            transform:translateY(-50%);
            cursor:pointer;
            background:rgba(0,0,0,.65);
            color:#fff;
            font-size:24px;
            line-height:36px;
          "
        >
          ‹
        </button>

        <button
          type="button"
          class="builder-slider-next"
          aria-label="다음 슬라이드"
          style="
            position:absolute;
            right:12px;
            top:50%;
            z-index:5;
            width:36px;
            height:36px;
            padding:0;
            border:0;
            border-radius:50%;
            transform:translateY(-50%);
            cursor:pointer;
            background:rgba(0,0,0,.65);
            color:#fff;
            font-size:24px;
            line-height:36px;
          "
        >
          ›
        </button>
      `
          : "";

      const dots =
        showDots && urls.length > 1
          ? `
        <div
          class="builder-slider-dots"
          style="
            position:absolute;
            left:50%;
            bottom:12px;
            z-index:5;
            display:flex;
            gap:7px;
            transform:translateX(-50%);
          "
        >
          ${urls
            .map(
              (_, index) => `
                <button
                  type="button"
                  class="builder-slider-dot"
                  data-real-index="${index}"
                  aria-label="슬라이드 ${index + 1}"
                  style="
                    width:10px;
                    height:10px;
                    padding:0;
                    border:0;
                    border-radius:50%;
                    background:#fff;
                    opacity:${index === 0 ? 1 : 0.45};
                    cursor:pointer;
                  "
                ></button>
              `,
            )
            .join("")}
        </div>
      `
          : "";

      return `
    <div
      id="${sliderId}"
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="imageSlider"
      data-component-name="${componentName}"
      data-slider-loop="${loop}"
      data-slider-autoplay="${autoplay}"
      data-slider-interval="${interval}"
      data-slider-count="${urls.length}"
      data-slider-index="${startIndex}"
      style="${escapeAttribute(
        [wrapperStyle, "position:relative", "overflow:hidden"]
          .filter(Boolean)
          .join(";"),
      )}"
    >
      <div
        class="builder-slider-track"
        style="
          display:flex;
          width:100%;
          height:100%;
          transform:translateX(-${startIndex * 100}%);
          transition:transform 350ms ease;
        "
      >
        ${slides}
      </div>

      ${arrows}
      ${dots}

      <script>
        (() => {
          const root =
            document.getElementById(
              ${JSON.stringify(sliderId)}
            );
          if (!root) return;
          const track =
            root.querySelector(
              ".builder-slider-track"
            );
          const prevButton =
            root.querySelector(
              ".builder-slider-prev"
            );
          const nextButton =
            root.querySelector(
              ".builder-slider-next"
            );
          const dots =
            Array.from(
              root.querySelectorAll(
                ".builder-slider-dot"
              )
            );
          const count =
            Number(
              root.dataset.sliderCount || 0
            );
          const loop =
            root.dataset.sliderLoop === "true";
          const autoplay =
            root.dataset.sliderAutoplay === "true";
          const interval =
            Math.max(
              Number(
                root.dataset.sliderInterval || 3000
              ),
              500
            );
          const canLoop =
            loop && count > 1;
          let currentIndex =
            Number(
              root.dataset.sliderIndex || 0
            );
          let transitionEnabled =
            true;
          const getRealIndex = () => {
            if (count <= 0) {
              return 0;
            }
            if (!canLoop) {
              return Math.min(
                currentIndex,
                count - 1
              );
            }
            return (
              currentIndex -
              1 +
              count
            ) % count;
          };
          const updateDots = () => {
            const realIndex =
              getRealIndex();
            dots.forEach(
              (dot, index) => {
                dot.style.opacity =
                  index === realIndex
                    ? "1"
                    : "0.45";
              }
            );
          };
          const render = () => {
            track.style.transition =
              transitionEnabled
                ? "transform 350ms ease"
                : "none";
            track.style.transform =
              "translateX(-" +
              currentIndex * 100 +
              "%)";
            updateDots();
          };
          const goPrev = () => {
            if (count <= 1) return;
            transitionEnabled = true;
            if (canLoop) {
              currentIndex -= 1;
            } else {
              currentIndex =
                Math.max(
                  currentIndex - 1,
                  0
                );
            }
            render();
          };
          const goNext = () => {
            if (count <= 1) return;
            transitionEnabled = true;
            if (canLoop) {
              currentIndex += 1;
            } else {
              currentIndex =
                Math.min(
                  currentIndex + 1,
                  count - 1
                );
            }
            render();
          };
          prevButton?.addEventListener(
            "click",
            goPrev
          );
          nextButton?.addEventListener(
            "click",
            goNext
          );
          dots.forEach(
            (dot, index) => {
              dot.addEventListener(
                "click",
                () => {
                  transitionEnabled =
                    true;
                  currentIndex =
                    canLoop
                      ? index + 1
                      : index;
                  render();
                }
              );
            }
          );
          track.addEventListener(
            "transitionend",
            () => {
              if (!canLoop) {
                return;
              }
              if (
                currentIndex ===
                count + 1
              ) {
                transitionEnabled =
                  false;
                currentIndex = 1;
                render();
                requestAnimationFrame(
                  () => {
                    transitionEnabled =
                      true;
                  }
                );
                return;
              }
              if (
                currentIndex === 0
              ) {
                transitionEnabled =
                  false;
                currentIndex =
                  count;
                render();
                requestAnimationFrame(
                  () => {
                    transitionEnabled =
                      true;
                  }
                );
              }
            }
          );
          if (
            autoplay &&
            count > 1
          ) {
            window.setInterval(
              () => {
                if (canLoop) {
                  goNext();
                  return;
                }
                transitionEnabled =
                  true;
                currentIndex =
                  currentIndex >=
                  count - 1
                    ? 0
                    : currentIndex + 1;
                render();
              },
              interval
            );
          }
          render();
        })();
      </script>
    </div>
  `;
    }

    case "video": {
      const src = component.props.src ?? "";
      if (!src) {
        return "";
      }
      const controls = component.props.controls ?? true;
      const autoplay = component.props.autoplay ?? false;
      const muted = component.props.muted ?? false;
      const loop = component.props.loop ?? false;
      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="video"
          data-component-name="${componentName}"
          style="${escapeAttribute(wrapperStyle)}"
        >
          <video
            class="builder-video"
            src="${escapeAttribute(src)}"
            ${controls ? "controls" : ""}
            ${autoplay ? "autoplay" : ""}
            ${muted ? "muted" : ""}
            ${loop ? "loop" : ""}
            playsinline
            preload="metadata"
            style="${escapeAttribute(
              ["display:block", "width:100%", "height:auto", contentStyle]
                .filter(Boolean)
                .join(";"),
            )}"
          ></video>
        </div>`;
    }

    case "divider": {
      const thickness = component.props.thickness ?? 3;
      const color = component.props.color ?? "#dee2e6";
      const lineStyle = component.props.lineStyle ?? "solid";

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="divider"
          data-component-name="${componentName}"
          style="${escapeAttribute(wrapperStyle)}"
        >
          <hr
            style="${escapeAttribute(
              [
                "width:100%",
                "margin:0",
                "border:0",
                `border-top:${thickness}px ${lineStyle} ${color}`,
                contentStyle,
              ]
                .filter(Boolean)
                .join(";"),
            )}"
          />
        </div>`;
    }

    case "spacer": {
      const height = component.props.height ?? 32;

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="spacer"
          data-component-name="${componentName}"
          style="${escapeAttribute(
            [
              wrapperStyle,
              `height:${height}px`,
              `min-height:${height}px`,
              "width:100%",
              contentStyle,
            ]
              .filter(Boolean)
              .join(";"),
          )}"
        ></div>`;
    }

    case "codeEditor": {
      const code = String(component.props.value ?? "");

      const language = normalizeCodeLanguage(component.props.language);

      const highlightedCode = highlightCode(code, language);

      return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="codeEditor"
      data-component-name="${componentName}"
      style="${escapeAttribute(wrapperStyle)}"
    >
      <pre
        class="builder-code-editor"
        data-language="${escapeAttribute(language)}"
        style="${escapeAttribute(
          [
            "margin:0",
            "width:100%",
            "height:100%",
            "overflow:auto",
            "box-sizing:border-box",
            "padding:12px 16px",
            'font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace',
            "font-size:14px",
            "line-height:1.5",
            "white-space:pre",
            "tab-size:4",
            "background-color:#1f2329",
            "color:#c9d1d9",
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      ><code>${highlightedCode}</code></pre>
    </div>
  `;
    }

    case "container": {
      const direction = component.props.direction ?? "column";
      const gap = component.props.gap ?? 8;
      const justifyContent = component.props.justifyContent ?? "space-between";
      const alignItems = component.props.alignItems ?? "stretch";
      const maxWidth = component.props.maxWidth;
      const children = (
        await Promise.all(
          [...component.children]
            .sort((a, b) => a.order - b.order)
            .map(componentToHtml),
        )
      ).join("\n");

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="container"
          data-component-name="${componentName}"
          style="${escapeAttribute(
            [
              "display:flex",
              `flex-direction:${direction}`,
              `gap:${gap}px`,
              `justify-content:${justifyContent}`,
              `align-items:${alignItems}`,
              maxWidth ? `max-width:${maxWidth}px` : "",
              maxWidth ? "margin-left:auto" : "",
              maxWidth ? "margin-right:auto" : "",
              wrapperStyle,
            ]
              .filter(Boolean)
              .join(";"),
          )}"
        >
          ${children}
        </div>`;
    }

    case "link": {
      const href = getLinkHref(component);
      const title = component.props.title || component.props.value || "링크";
      const isExternal =
        component.props.linkType === "url" && component.props.newWindow;
      const target = isExternal ? ' target="_blank"' : "";
      const rel = isExternal ? ' rel="noopener noreferrer"' : "";

      return `
        <div
          class="${wrapperClass}"
          data-component-id="${componentId}"
          data-component-type="link"
          data-component-name="${componentName}"
          style="${escapeAttribute(wrapperStyle)}"
        >
          <a
            class="builder-link"
            href="${escapeAttribute(href)}"${target}${rel}
            style="${escapeAttribute(contentStyle)}"
          >
            ${escapeHtml(title)}
          </a>
        </div>`;
    }
  }
};

export const buildHtmlDocument = async (
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  const body = (
    await Promise.all(
      [...components].sort((a, b) => a.order - b.order).map(componentToHtml),
    )
  ).join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Exported Page</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 16px;
      font-family: Arial, Helvetica, sans-serif;
    }

    img {
      max-width: 100%;
    }

    ${codeHighlight}

    ${projectCustomCss}

    ${collectComponentCustomCss(components)}
  </style>
  </head>
  <body>
    <main
      id="page-root"
      class="builder-preview"
    >
      ${body}
    </main>
  </body>
  </html>`;
};

export const downloadHtmlFile = async (
  components: LayoutComponent[],
  projectCustomCss: string,
) => {
  try {
    const html = await buildHtmlDocument(components, projectCustomCss);

    const blob = new Blob([html], {
      type: "text/html;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "page.html";

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("HTML 저장 실패:", error);

    alert("HTML 저장 중 오류가 발생했습니다.");
  }
};
