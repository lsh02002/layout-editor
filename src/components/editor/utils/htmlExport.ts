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

  switch (component.type) {
    case "button":
      return `<div data-component-id="${escapeAttribute(component.id)}" style="${escapeAttribute(wrapperStyle)}"><button type="button" style="${escapeAttribute(contentStyle)}">${escapeHtml(component.props.title)}</button></div>`;

    case "scrollToTopButton":
      return `<button data-component-id="${escapeAttribute(component.id)}" type="button" onclick="window.scrollTo({top:0,behavior:'smooth'})" style="${escapeAttribute(`${wrapperStyle};${contentStyle};display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;background-color:#6c757d;border:1px solid #6c757d;padding:0.375rem 0.75rem;font-size:1rem;line-height:1.5;text-align:center;cursor:pointer;user-select:none;`)}">${escapeHtml(component.props.title)}</button>`;

    case "heading": {
      const tag = `h${component.props.level}`;

      return `
<div
  data-component-id="${escapeAttribute(component.id)}"
  style="${escapeAttribute(wrapperStyle)}"
>
  <${tag} style="${escapeAttribute(contentStyle)}">
    ${escapeHtml(component.props.text)}
  </${tag}>
</div>`;
    }

    case "textarea": {
      const text =
        component.props.value ||
        component.props.placeholder ||
        "내용을 입력하세요.";

      return `<div data-component-id="${escapeAttribute(component.id)}" style="${escapeAttribute(wrapperStyle)}"><div style="${escapeAttribute(`white-space:pre-wrap;word-break:break-word;${contentStyle}`)}">${escapeHtml(text)}</div></div>`;
    }

    case "quill": {
      const html =
        component.props.value ||
        `<span style="color:#6c757d">${escapeHtml(component.props.placeholder || "본문을 입력하세요.")}</span>`;

      return `<div data-component-id="${escapeAttribute(component.id)}" style="${escapeAttribute(wrapperStyle)}"><div style="${escapeAttribute(`word-break:break-word;${contentStyle}`)}">${html}</div></div>`;
    }

    case "image": {
      const originalUrl = component.props.urls?.[0] ?? "";

      if (!originalUrl) {
        return `<div style="${escapeAttribute(wrapperStyle)}"></div>`;
      }

      let imageUrl = originalUrl;

      try {
        imageUrl = await compressImageUrl(originalUrl, 1600, 1600, 0.8);
      } catch (error) {
        console.error("HTML 이미지 압축 실패:", error);
      }

      return `
<div
  data-component-id="${escapeAttribute(component.id)}"
  style="${escapeAttribute(wrapperStyle)}"
>
  <img
    src="${escapeAttribute(imageUrl)}"
    alt=""
    style="${escapeAttribute(`display:block;width:100%;height:auto;${contentStyle}`)}"
  />
</div>`;
    }

    case "container": {
      const direction = component.props.direction ?? "column";

      const gap = component.props.gap ?? 8;

      const children = (
        await Promise.all(
          [...component.children]
            .sort((a, b) => a.order - b.order)
            .map(componentToHtml),
        )
      ).join("");

      return `
<div
  data-component-id="${escapeAttribute(component.id)}"
  style="${escapeAttribute(`display:flex;flex-direction:${direction};gap:${gap}px;${wrapperStyle}`)}"
>
  ${children}
</div>`;
    }

    case "link": {
      const href = getLinkHref(component);

      const title = component.props.title || component.props.value || "링크";

      const target =
        component.props.linkType === "url" && component.props.newWindow
          ? ' target="_blank"'
          : "";

      const rel =
        component.props.linkType === "url" && component.props.newWindow
          ? ' rel="noopener noreferrer"'
          : "";

      return `
<div
  data-component-id="${escapeAttribute(component.id)}"
  style="${escapeAttribute(wrapperStyle)}"
>
  <a
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
    <div class="builder-preview">
      ${body}
    </div>
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
