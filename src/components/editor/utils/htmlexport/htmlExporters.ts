import type { CSSProperties } from "react";
import type {
  ContainerDirection,
  LayoutComponent,
} from "../../../../types/types";
import type { HtmlExporter } from "./htmlExportTypes";
import { compressImageUrl } from "../projectUtils";
import { highlightCode, normalizeCodeLanguage } from "../codeHighlight";
import { getLinkHref } from "../linkUtils";

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

const layoutToCss = (component: LayoutComponent) => {
  const layout = component.layout;

  if (!layout) return "";

  const width =
    layout.widthMode === "fixed"
      ? layout.width
      : layout.widthMode === "auto"
        ? "auto"
        : "100%";

  const height =
    layout.heightMode === "fixed"
      ? layout.height
      : layout.heightMode === "auto"
        ? "auto"
        : layout.heightMode === "fill"
          ? "100%"
          : undefined;

  return styleToCss({
    width,
    height,
    boxSizing: "border-box",
    maxWidth: layout.position === "absolute" ? "none" : "100%",

    ...(layout.position === "absolute"
      ? {
          position: "absolute",
          left: layout.x ?? 0,
          top: layout.y ?? 0,
          zIndex: layout.zIndex ?? 100,
        }
      : {}),
  });
};

const getExportMeta = (component: LayoutComponent) => {
  const componentStyle = styleToCss(component.style);
  const layoutStyle = layoutToCss(component);
  const wrapperStyle = [componentStyle, layoutStyle].filter(Boolean).join(";");
  const contentStyle = styleToCss(component.contentStyle);
  const componentId = escapeAttribute(component.id);
  const componentName = escapeAttribute(component.name ?? component.type);

  const wrapperClass = [
    "builder-component",
    `builder-component-${component.type}`,
    component.layout?.position === "absolute"
      ? "builder-position-absolute"
      : "builder-position-normal",
  ].join(" ");

  // ★ 추가
  const positionParentId =
    component.layout?.position === "absolute"
      ? component.layout.positionParentId
      : undefined;

  const positionParentAttr = positionParentId
    ? ` data-position-parent-id="${escapeAttribute(positionParentId)}"`
    : "";

  return {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,

    // ★ 추가
    positionParentAttr,
  };
};

const exportDropZoneSpacer = (direction: ContainerDirection) => {
  const isRow = direction === "row";

  return `<div
      class="builder-drop-zone-spacer ${isRow ? "is-row" : "is-column"}"
      aria-hidden="true"
      style="${escapeAttribute(
        [
          "visibility:hidden",
          "display:flex",
          "align-items:center",
          "justify-content:center",
          isRow ? "min-width:24px" : "min-height:24px",
          "flex-shrink:0",
          "margin:0",
          "position:relative",
        ].join(";"),
      )}"></div>`;
};

const renderContainerChildren = async (
  component: Extract<LayoutComponent, { type: "container" | "flex" }>,
  context: Parameters<HtmlExporter>[1],
  direction: ContainerDirection,
) => {
  const isRow = direction === "row";
  const dropZone = exportDropZoneSpacer(direction);

  const children = [...component.children].sort((a, b) => a.order - b.order);

  const rendered = await Promise.all(
    children.map(async (child) => {
      const childHtml = await context.renderComponent(child);

      // ★ absolute 자식은 부모에 직접 붙인다.
      if (child.layout?.position === "absolute") {
        return childHtml;
      }

      const widthMode =
        child.layout?.widthMode ??
        (child.type === "image" || child.type === "imageSlider"
          ? "fill"
          : undefined);

      const childWidth = child.layout?.width;

      const wrapperStyle = isRow
        ? {
            width:
              widthMode === "fixed"
                ? childWidth
                : widthMode === "fill"
                  ? 0
                  : "auto",

            flex:
              widthMode === "fixed"
                ? "0 0 auto"
                : widthMode === "fill"
                  ? "1 1 0"
                  : "0 1 auto",

            minWidth: 0,
            maxWidth: "100%",
          }
        : {
            width:
              widthMode === "fixed"
                ? childWidth
                : widthMode === "auto"
                  ? "auto"
                  : "100%",

            minWidth: 0,
            maxWidth: "100%",
          };

      return `
        <div class="builder-container-child" style="${styleToCss(wrapperStyle)}">
          ${childHtml}
          ${!isRow && child.type !== "scrollToTopButton" ? dropZone : ""}
        </div>
      `;
    }),
  );

  if (isRow) {
    return `${dropZone}${rendered.join("")}${dropZone}`;
  }

  return `${dropZone}${rendered.join("")}`;
};

export const exportButtonHtml: HtmlExporter = (component) => {
  if (component.type !== "button") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const disabled = component.props.disabled ? " disabled" : "";

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="button"
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportScrollToTopHtml: HtmlExporter = (component) => {
  if (component.type !== "scrollToTopButton") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const disabled = component.props.disabled ? " disabled" : "";

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="scrollToTopButton"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(wrapperStyle)}"
    >
      <button
        type="button"
        class="builder-scroll-to-top-button"
        aria-label="${escapeAttribute(component.props.title || "맨 위로 이동")}"
        onclick="window.scrollTo({ top: 0, behavior: 'smooth' })"
        style="${escapeAttribute(
          [
            contentStyle,
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "width:100%",
            "height:100%",
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
    </div>
  `;
};

export const exportHeadingHtml: HtmlExporter = (component) => {
  if (component.type !== "heading") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

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
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportTextareaHtml: HtmlExporter = (component) => {
  if (component.type !== "textarea") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="textarea"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(wrapperStyle)}"
    >
      <textarea
        class="builder-textarea"
        placeholder="${escapeAttribute(component.props.placeholder || "")}"
        ${component.props.disabled ? "disabled" : ""}
        rows="1"
        readonly
        tabindex="-1"
        style="${escapeAttribute(
          [
            "display:block",
            "box-sizing:border-box",
            "width:100%",
            "max-width:100%",
            "overflow:hidden",
            "resize:none",

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

            "pointer-events:none",
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >${escapeHtml(component.props.value || "")}</textarea>
    </div>
  `;
};

export const exportQuillHtml: HtmlExporter = (component) => {
  if (component.type !== "quill") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

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
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportImageHtml: HtmlExporter = async (component) => {
  if (component.type !== "image") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const originalUrl = component.props.urls?.[0] ?? "";

  if (!originalUrl) {
    return `
      <div
        class="${wrapperClass}"
        data-component-id="${componentId}"
        data-component-type="image"
        data-component-name="${componentName}"${positionParentAttr}
        style="${escapeAttribute(wrapperStyle)}"
      ></div>`;
  }

  let imageUrl = originalUrl;

  try {
    imageUrl = await compressImageUrl(originalUrl, 1600, 1600, 0.8);
  } catch (error) {
    console.error("HTML 이미지 압축 실패:", error);
  }

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="image"
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportImageGalleryHtml: HtmlExporter = (component) => {
  if (component.type !== "imageGallery") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const urls = component.props.urls?.filter(Boolean) ?? [];

  const columns = component.props.columns ?? 3;

  const gap = component.props.gap ?? 8;

  const objectFit = component.props.objectFit ?? "cover";

  const borderRadius = component.props.borderRadius ?? 8;

  const images = urls
    .map(
      (url, index) => `
      <div
        style="${escapeAttribute(
          [
            "width:100%",
            "aspect-ratio:1 / 1",
            "overflow:hidden",
            `border-radius:${borderRadius}px`,
          ].join(";"),
        )}"
      >
        <img
          src="${escapeAttribute(url)}"
          alt="${escapeAttribute(
            `${component.name ?? "Gallery"} ${index + 1}`,
          )}"
          loading="lazy"
          style="${escapeAttribute(
            [
              "display:block",
              "width:100%",
              "height:100%",
              `object-fit:${objectFit}`,
            ].join(";"),
          )}"
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
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(wrapperStyle)}"
    >
      <div
        class="builder-image-gallery"
        style="${escapeAttribute(
          [
            "display:grid",
            `grid-template-columns:repeat(${columns}, minmax(0, 1fr))`,
            `gap:${gap}px`,
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >
        ${images}
      </div>
    </div>
  `;
};

export const exportImageSliderHtml: HtmlExporter = (component) => {
  if (component.type !== "imageSlider") {
    return "";
  }

  const {
    wrapperStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const urls = component.props.urls?.filter(Boolean) ?? [];

  if (!urls.length) {
    return `
      <div
        class="${wrapperClass}"
        data-component-id="${componentId}"
        data-component-type="imageSlider"
        data-component-name="${componentName}"${positionParentAttr}
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

  /**
   * loop=true일 때
   *
   * [마지막 clone, 실제 slides..., 첫 번째 clone]
   *
   * 구조를 만든다.
   */
  const slideUrls =
    loop && urls.length > 1 ? [urls[urls.length - 1], ...urls, urls[0]] : urls;

  /**
   * clone slide가 앞에 있으면
   * 실제 첫 번째 slide의 index는 1
   */
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

  const sliderPositionStyle =
    component.layout?.position === "absolute" ? "" : "position:relative";

  return `
    <div
      id="${sliderId}"
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="imageSlider"
      data-component-name="${componentName}"${positionParentAttr}
      data-slider-loop="${loop}"
      data-slider-autoplay="${autoplay}"
      data-slider-interval="${interval}"
      data-slider-count="${urls.length}"
      data-slider-index="${startIndex}"
      style="${escapeAttribute(
        [wrapperStyle, sliderPositionStyle, "overflow:hidden"]
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

          if (!root) {
            return;
          }

          const track =
            root.querySelector(
              ".builder-slider-track"
            );

          if (!track) {
            return;
          }

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
                root.dataset.sliderInterval ||
                  3000
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

          /**
           * clone index를
           * 실제 slide index로 변환
           */
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
            if (count <= 1) {
              return;
            }

            transitionEnabled =
              true;

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
            if (count <= 1) {
              return;
            }

            transitionEnabled =
              true;

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

          /**
           * clone slide까지 이동한 뒤
           * transition 없이 실제 slide 위치로 순간 이동
           */
          track.addEventListener(
            "transitionend",
            () => {
              if (!canLoop) {
                return;
              }

              /**
               * 마지막 actual slide 다음의
               * 첫 번째 clone에 도착
               */
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

              /**
               * 첫 actual slide 이전의
               * 마지막 clone에 도착
               */
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
};

export const exportVideoHtml: HtmlExporter = (component) => {
  if (component.type !== "video") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

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
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportDividerHtml: HtmlExporter = (component) => {
  if (component.type !== "divider") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const thickness = component.props.thickness ?? 3;

  const color = component.props.color ?? "#dee2e6";

  const lineStyle = component.props.lineStyle ?? "solid";

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="divider"
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportSpacerHtml: HtmlExporter = (component) => {
  if (component.type !== "spacer") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const height = component.props.height ?? 32;

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="spacer"
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportCodeEditorHtml: HtmlExporter = (component) => {
  if (component.type !== "codeEditor") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const code = String(component.props.value ?? "");

  const language = normalizeCodeLanguage(component.props.language);

  const highlightedCode = highlightCode(code, language);

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="codeEditor"
      data-component-name="${componentName}"${positionParentAttr}
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
    </div>`;
};

export const exportContainerHtml: HtmlExporter = async (component, context) => {
  if (component.type !== "container") {
    return "";
  }

  const {
    wrapperStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const direction = component.props.direction ?? "row";
  const gap = component.props.gap ?? 8;
  const justifyContent = component.props.justifyContent ?? "space-between";
  const alignItems = component.props.alignItems ?? "stretch";

  const maxWidth = component.props.maxWidth;

  const children = await renderContainerChildren(component, context, direction);

  const maxWidthCss =
    typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth || "100%";

  const directionCss =
    direction === "row" ? "builder-direction-row" : "builder-direction-column";

  return `
    <div
      class="${wrapperClass} ${directionCss} builder-position-context"
      data-component-id="${componentId}"
      data-component-type="container"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(
        [
          "display:flex",
          `flex-direction:${direction}`,
          `gap:${gap}px`,
          `justify-content:${justifyContent}`,
          `align-items:${alignItems}`,

          // absolute 자식의 기준 부모
          "position:relative",

          `max-width:${maxWidthCss}`,
          maxWidth ? "margin-left:auto" : "",
          maxWidth ? "margin-right:auto" : "",

          "width:100%",
          "min-width:0",
          "min-height:20px",
          "box-sizing:border-box",

          // 중요:
          // 부모 자체가 absolute라면 여기의
          // position:absolute가 위 relative를 덮어씀.
          // absolute 역시 자식의 containing block이 되므로 정상.
          wrapperStyle,
        ]
          .filter(Boolean)
          .join(";"),
      )}"
    >
      ${children}
    </div>
  `;
};

export const exportLinkHtml: HtmlExporter = (component) => {
  if (component.type !== "link") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

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
      data-component-name="${componentName}"${positionParentAttr}
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
};

export const exportGridHtml: HtmlExporter = async (component, context) => {
  if (component.type !== "grid") {
    return "";
  }

  const {
    wrapperStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const columns = Math.max(1, component.props.columns ?? 2);
  const gap = component.props.gap ?? 8;

  const dropZoneSpacer = `
    <div
      aria-hidden="true"
      style="${escapeAttribute(
        [
          "visibility:hidden",
          "display:flex",
          "flex-direction:row",
          "align-items:center",
          "justify-content:center",
          "min-height:24px",
          "flex-shrink:0",
          "margin:0",
          "position:relative",
        ].join(";"),
      )}"
    ></div>
  `;

  const children = (
    await Promise.all(
      [...component.children]
        .sort((a, b) => a.order - b.order)
        .map(async (child) => {
          const childHtml = await context.renderComponent(child);

          if (child.layout?.position === "absolute") {
            return childHtml;
          }

          return `
            <div
              style="${escapeAttribute(
                ["min-width:0", "max-width:100%", "width:100%"].join(";"),
              )}"
            >
              ${childHtml}

              ${child.type !== "scrollToTopButton" ? dropZoneSpacer : ""}
            </div>
          `;
        }),
    )
  ).join("\n");

  return `
  <div
  class="${wrapperClass} builder-position-context"
  data-component-id="${componentId}"
  data-component-type="grid"
  data-component-name="${componentName}"${positionParentAttr}
  style="${escapeAttribute(
    [
      "position:relative",
      "width:100%",
      "min-width:0",
      "box-sizing:border-box",
      wrapperStyle,
    ]
      .filter(Boolean)
      .join(";"),
  )}"
>
    ${
      children?.length === 0
        ? `
          <div
            style="${escapeAttribute(
              [
                "display:flex",
                "flex-direction:column",
                `gap:${gap}px`,
                "width:100%",
                "min-width:0",
              ].join(";"),
            )}"
          >
            ${dropZoneSpacer}
          </div>
        `
        : ""
    }

    <div
      style="${escapeAttribute(
        [
          "display:grid",
          `grid-template-columns:repeat(${columns}, minmax(0, 1fr))`,
          `gap:${gap}px`,
          "width:100%",
          "min-width:0",
        ].join(";"),
      )}"
    >
      ${children ?? ""}
    </div>
  </div>
`;
};

export const exportFlexHtml: HtmlExporter = async (component, context) => {
  if (component.type !== "flex") {
    return "";
  }

  const {
    wrapperStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const direction = component.props.direction ?? "row";
  const gap = component.props.gap ?? 8;
  const justifyContent = component.props.justifyContent ?? "flex-start";
  const alignItems = component.props.alignItems ?? "stretch";

  const children = await renderContainerChildren(component, context, direction);

  const directionCss =
    direction === "row" ? "builder-direction-row" : "builder-direction-column";

  return `
    <div
      class="${wrapperClass} ${directionCss} builder-position-context"
      data-component-id="${componentId}"
      data-component-type="flex"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(
        [
          "display:flex",
          `flex-direction:${direction}`,
          `gap:${gap}px`,
          `justify-content:${justifyContent}`,
          `align-items:${alignItems}`,

          // absolute 자식 기준
          "position:relative",

          "width:100%",
          "max-width:100%",
          "min-width:0",
          "min-height:20px",
          "box-sizing:border-box",

          // 부모 자체 absolute인 경우 마지막에 덮어씀
          wrapperStyle,
        ]
          .filter(Boolean)
          .join(";"),
      )}"
    >
      ${children}
    </div>
  `;
};

export const exportCardHtml: HtmlExporter = (component) => {
  if (component.type !== "card") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const title = component.props.title ?? "";
  const content = component.props.content ?? "";

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="card"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(wrapperStyle)}"
    >
      <div
        class="builder-card"
        style="${escapeAttribute(
          [
            "width:100%",
            "box-sizing:border-box",
            "border:1px solid #dee2e6",
            "border-radius:8px",
            "background-color:#fff",
            "overflow:hidden",
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >
        ${
          title
            ? `
          <div
            class="builder-card-title"
            style="${escapeAttribute(
              [
                "font-size:1.25rem",
                "font-weight:600",
                "margin-bottom:8px",
              ].join(";"),
            )}"
          >
            ${escapeHtml(title)}
          </div>`
            : ""
        }

        ${
          content
            ? `
          <div
            class="builder-card-text"
            style="${escapeAttribute(
              ["font-size:1rem", "line-height:1.5"].join(";"),
            )}"
          >
            ${escapeHtml(content)}
          </div>`
            : ""
        }
      </div>
    </div>`;
};

export const exportAlertHtml: HtmlExporter = (component) => {
  if (component.type !== "alert") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const message = component.props.message ?? "";
  const variant = component.props.variant ?? "primary";

  const variantStyle: Record<string, string> = {
    primary: [
      "color:#084298",
      "background-color:#cfe2ff",
      "border-color:#b6d4fe",
    ].join(";"),

    secondary: [
      "color:#41464b",
      "background-color:#e2e3e5",
      "border-color:#d3d6d8",
    ].join(";"),

    success: [
      "color:#0f5132",
      "background-color:#d1e7dd",
      "border-color:#badbcc",
    ].join(";"),

    danger: [
      "color:#842029",
      "background-color:#f8d7da",
      "border-color:#f5c2c7",
    ].join(";"),

    warning: [
      "color:#664d03",
      "background-color:#fff3cd",
      "border-color:#ffecb5",
    ].join(";"),

    info: [
      "color:#055160",
      "background-color:#cff4fc",
      "border-color:#b6effb",
    ].join(";"),

    light: [
      "color:#636464",
      "background-color:#fefefe",
      "border-color:#fdfdfe",
    ].join(";"),

    dark: [
      "color:#141619",
      "background-color:#d3d3d4",
      "border-color:#bcbebf",
    ].join(";"),
  };

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="alert"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(wrapperStyle)}"
    >
      <div
        class="builder-alert builder-alert-${escapeAttribute(variant)}"
        role="alert"
        style="${escapeAttribute(
          [
            "position:relative",
            "width:100%",
            "box-sizing:border-box",
            "padding:1rem",
            "border:1px solid transparent",
            "border-radius:6px",
            variantStyle[variant] ?? variantStyle.primary,
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >
        ${escapeHtml(message)}
      </div>
    </div>`;
};

export const exportBadgeHtml: HtmlExporter = (component) => {
  if (component.type !== "badge") {
    return "";
  }

  const {
    wrapperStyle,
    contentStyle,
    componentId,
    componentName,
    wrapperClass,
    positionParentAttr,
  } = getExportMeta(component);

  const text = component.props.text ?? "";
  const variant = component.props.variant ?? "primary";

  const variantStyle: Record<string, string> = {
    primary: "color:#fff;background-color:#0d6efd",
    secondary: "color:#fff;background-color:#6c757d",
    success: "color:#fff;background-color:#198754",
    danger: "color:#fff;background-color:#dc3545",
    warning: "color:#000;background-color:#ffc107",
    info: "color:#000;background-color:#0dcaf0",
    light: "color:#000;background-color:#f8f9fa",
    dark: "color:#fff;background-color:#212529",
  };

  return `
    <div
      class="${wrapperClass}"
      data-component-id="${componentId}"
      data-component-type="badge"
      data-component-name="${componentName}"${positionParentAttr}
      style="${escapeAttribute(wrapperStyle)}"
    >
      <span
        class="builder-badge builder-badge-${escapeAttribute(variant)}"
        style="${escapeAttribute(
          [
            "display:inline-block",
            "padding:0.35em 0.65em",
            "font-size:0.75em",
            "font-weight:700",
            "line-height:1",
            "text-align:center",
            "white-space:nowrap",
            "vertical-align:baseline",
            "border-radius:0.375rem",
            variantStyle[variant] ?? variantStyle.primary,
            contentStyle,
          ]
            .filter(Boolean)
            .join(";"),
        )}"
      >
        ${escapeHtml(text)}
      </span>
    </div>`;
};
