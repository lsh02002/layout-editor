// codeHighlight.ts

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

import { HighlightStyle, type LanguageSupport } from "@codemirror/language";

import { highlightTree, tags, type Highlighter } from "@lezer/highlight";

export type CodeLanguage =
  | "css"
  | "html"
  | "javascript"
  | "typescript"
  | "json";

export const CODE_HIGHLIGHT_COLORS = {
  text: "#c9d1d9",
  name: "#dee2e6",
  className: "#3d8bfd",
  tagName: "#a370f7",
  typeName: "#a370f7",
  propertyName: "#3dd5f3",
  keyword: "#20c997",
  atom: "#20c997",
  number: "#fd9843",
  string: "#ffda6a",
  literal: "#ff922b",
  comment: "#75b798",
  punctuation: "#adb5bd",
  modifier: "#ea868f",
  function: "#6ea8fe",
  variable: "#6ea8fe",
} as const;

/**
 * CodeMirror 화면용 HighlightStyle
 */
export const codeHighlight = HighlightStyle.define([
  {
    tag: tags.name,
    color: CODE_HIGHLIGHT_COLORS.name,
  },

  {
    tag: tags.className,
    color: CODE_HIGHLIGHT_COLORS.className,
  },

  {
    tag: [tags.tagName, tags.typeName],
    color: CODE_HIGHLIGHT_COLORS.tagName,
  },

  {
    tag: tags.propertyName,
    color: CODE_HIGHLIGHT_COLORS.propertyName,
  },

  {
    tag: tags.keyword,
    color: CODE_HIGHLIGHT_COLORS.keyword,
  },

  {
    tag: tags.atom,
    color: CODE_HIGHLIGHT_COLORS.atom,
  },

  {
    tag: tags.number,
    color: CODE_HIGHLIGHT_COLORS.number,
  },

  {
    tag: tags.string,
    color: CODE_HIGHLIGHT_COLORS.string,
  },

  {
    tag: tags.literal,
    color: CODE_HIGHLIGHT_COLORS.literal,
  },

  {
    tag: tags.comment,
    color: CODE_HIGHLIGHT_COLORS.comment,
    fontStyle: "italic",
  },

  {
    tag: [
      tags.punctuation,
      tags.separator,
      tags.bracket,
      tags.squareBracket,
      tags.paren,
    ],
    color: CODE_HIGHLIGHT_COLORS.punctuation,
  },

  {
    tag: tags.modifier,
    color: CODE_HIGHLIGHT_COLORS.modifier,
    fontWeight: "600",
  },

  {
    tag: tags.function(tags.variableName),
    color: CODE_HIGHLIGHT_COLORS.function,
  },

  {
    tag: tags.variableName,
    color: CODE_HIGHLIGHT_COLORS.variable,
  },
]);

/**
 * 언어명 정규화
 */
export function normalizeCodeLanguage(language?: string | null): CodeLanguage {
  switch (
    String(language ?? "")
      .trim()
      .toLowerCase()
  ) {
    case "html":
    case "xml":
      return "html";

    case "js":
    case "jsx":
    case "javascript":
      return "javascript";

    case "ts":
    case "tsx":
    case "typescript":
      return "typescript";

    case "json":
      return "json";

    case "css":
    default:
      return "css";
  }
}

/**
 * Lezer parser용 언어 extension
 */
export function getLanguageExtension(language: CodeLanguage): LanguageSupport {
  switch (language) {
    case "html":
      return html();

    case "javascript":
      return javascript();

    case "typescript":
      return javascript({
        typescript: true,
      });

    case "json":
      return json();

    case "css":
    default:
      return css();
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * HTML export용 highlighter.
 *
 * CodeMirror와 동일한 색상을 inline style로 생성함.
 */
const exportHighlighter: Highlighter = {
  style(tagSet) {
    if (tagSet.includes(tags.comment)) {
      return [
        `color:${CODE_HIGHLIGHT_COLORS.comment}`,
        "font-style:italic",
      ].join(";");
    }

    if (tagSet.includes(tags.modifier)) {
      return [
        `color:${CODE_HIGHLIGHT_COLORS.modifier}`,
        "font-weight:600",
      ].join(";");
    }

    if (tagSet.includes(tags.className)) {
      return `color:${CODE_HIGHLIGHT_COLORS.className}`;
    }

    if (tagSet.includes(tags.tagName)) {
      return `color:${CODE_HIGHLIGHT_COLORS.tagName}`;
    }

    if (tagSet.includes(tags.typeName)) {
      return `color:${CODE_HIGHLIGHT_COLORS.typeName}`;
    }

    if (tagSet.includes(tags.propertyName)) {
      return `color:${CODE_HIGHLIGHT_COLORS.propertyName}`;
    }

    if (tagSet.includes(tags.keyword)) {
      return `color:${CODE_HIGHLIGHT_COLORS.keyword}`;
    }

    if (tagSet.includes(tags.atom)) {
      return `color:${CODE_HIGHLIGHT_COLORS.atom}`;
    }

    if (tagSet.includes(tags.number)) {
      return `color:${CODE_HIGHLIGHT_COLORS.number}`;
    }

    if (tagSet.includes(tags.string)) {
      return `color:${CODE_HIGHLIGHT_COLORS.string}`;
    }

    if (tagSet.includes(tags.literal)) {
      return `color:${CODE_HIGHLIGHT_COLORS.literal}`;
    }

    if (tagSet.includes(tags.variableName)) {
      return `color:${CODE_HIGHLIGHT_COLORS.variable}`;
    }

    if (tagSet.includes(tags.name)) {
      return `color:${CODE_HIGHLIGHT_COLORS.name}`;
    }

    if (
      tagSet.includes(tags.punctuation) ||
      tagSet.includes(tags.separator) ||
      tagSet.includes(tags.bracket) ||
      tagSet.includes(tags.squareBracket) ||
      tagSet.includes(tags.paren)
    ) {
      return `color:${CODE_HIGHLIGHT_COLORS.punctuation}`;
    }

    return null;
  },
};

/**
 * 정적 HTML용 syntax highlight
 */
export function highlightCode(code: unknown, language?: string | null): string {
  const source = String(code ?? "");

  if (!source) {
    return "";
  }

  const normalizedLanguage = normalizeCodeLanguage(language);

  const languageExtension = getLanguageExtension(normalizedLanguage);

  const tree = languageExtension.language.parser.parse(source);

  let result = "";
  let position = 0;

  highlightTree(tree, exportHighlighter, (from, to, style) => {
    if (from > position) {
      result += escapeHtml(source.slice(position, from));
    }

    const token = escapeHtml(source.slice(from, to));

    if (style) {
      result += `<span style="${style}">${token}</span>`;
    } else {
      result += token;
    }

    position = to;
  });

  if (position < source.length) {
    result += escapeHtml(source.slice(position));
  }

  return result;
}

/**
 * Export된 <pre> 기본 스타일.
 *
 * 필요하면 componentToHtml에서 사용.
 */
export const CODE_EDITOR_EXPORT_STYLE = [
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
  `color:${CODE_HIGHLIGHT_COLORS.text}`,
].join(";");
