import CodeMirror from "@uiw/react-codemirror";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

import {
  HighlightStyle,
  syntaxHighlighting,
  type LanguageSupport,
} from "@codemirror/language";

import { EditorView } from "@codemirror/view";

import { tags } from "@lezer/highlight";

type CodeLanguage = "css" | "html" | "javascript" | "typescript" | "json";

type Props = {
  data: string;
  setData: (value: string) => void;
  language?: CodeLanguage;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
};

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#1f2329",
    color: "#c9d1d9",
    fontSize: "14px",
  },

  ".cm-content": {
    caretColor: "#c9d1d9",
    padding: "12px 0",
  },

  ".cm-scroller": {
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  },

  "&.cm-focused": {
    outline: "none",
  },

  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#c9d1d9",
  },

  ".cm-gutters": {
    backgroundColor: "#1f2329",
    color: "#636e7b",
    border: "none",
  },

  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 10px 0 8px",
  },

  ".cm-activeLine": {
    backgroundColor: "#ffffff08",
  },

  ".cm-activeLineGutter": {
    backgroundColor: "#ffffff08",
    color: "#8b949e",
  },

  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "#33415580",
    },

  ".cm-placeholder": {
    color: "#636e7b",
  },
});

const codeHighlight = HighlightStyle.define([
  {
    tag: tags.name,
    color: "#dee2e6",
  },

  {
    tag: tags.className,
    color: "#3d8bfd",
  },

  {
    tag: [tags.tagName, tags.typeName],
    color: "#a370f7",
  },

  {
    tag: tags.propertyName,
    color: "#3dd5f3",
  },

  {
    tag: tags.keyword,
    color: "#20c997",
  },

  {
    tag: tags.atom,
    color: "#20c997",
  },

  {
    tag: tags.number,
    color: "#fd9843",
  },

  {
    tag: tags.string,
    color: "#ffda6a",
  },

  {
    tag: tags.literal,
    color: "#ff922b",
  },

  {
    tag: tags.comment,
    color: "#75b798",
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
    color: "#adb5bd",
  },

  {
    tag: tags.modifier,
    color: "#ea868f",
    fontWeight: "600",
  },

  {
    tag: tags.function(tags.variableName),
    color: "#6ea8fe",
  },

  {
    tag: tags.variableName,
    color: "#6ea8fe",
  },
]);

const getLanguageExtension = (language: CodeLanguage): LanguageSupport => {
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
};

function CodeEditor({
  data,
  setData,
  language = "css",
  height = "220px",
  placeholder,
  readOnly = false,
}: Props) {
  return (
    <CodeMirror
      value={data}
      height={height}
      extensions={[
        getLanguageExtension(language),
        editorTheme,
        syntaxHighlighting(codeHighlight),
      ]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
      }}
      readOnly={readOnly}
      onChange={setData}
      placeholder={placeholder}
    />
  );
}

export default CodeEditor;
