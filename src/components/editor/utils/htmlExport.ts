import type { CSSProperties } from "react";

import type { LayoutComponent } from "../../../types/types";

import { getLinkHref } from "./linkUtils";
import { compressImageUrl } from "./projectUtils";
import { collectComponentCustomCss } from "./customCssUtils";

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
            style="${escapeAttribute(contentStyle)}"
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
            class="builder-text"
            style="${escapeAttribute(
              ["white-space:pre-wrap", "word-break:break-word", contentStyle]
                .filter(Boolean)
                .join(";"),
            )}"
          >
            ${escapeHtml(text)}
          </div>
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
