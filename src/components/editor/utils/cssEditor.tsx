import CodeMirror from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

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

const cssHighlight = HighlightStyle.define([
  // 기본 이름
  {
    tag: tags.name,
    color: "#dee2e6",
  },

  // .container, .button
  // Bootstrap primary 계열
  {
    tag: tags.className,
    color: "#3d8bfd",
  },

  // div, button, input
  // Bootstrap purple 계열
  {
    tag: [tags.tagName, tags.typeName],
    color: "#a370f7",
  },

  // display, color, background
  // Cyan 계열
  {
    tag: tags.propertyName,
    color: "#3dd5f3",
  },

  // flex, block, absolute 등
  // Green 계열
  {
    tag: tags.keyword,
    color: "#20c997",
  },

  // red, auto, none 등
  {
    tag: tags.atom,
    color: "#20c997",
  },

  // 10, 100, 0.5
  // Orange 계열
  {
    tag: tags.number,
    color: "#fd9843",
  },

  // "hello", "Arial"
  // Yellow 계열
  {
    tag: tags.string,
    color: "#ffda6a",
  },

  // #fff, #0d6efd 등
  {
    tag: tags.literal,
    color: "#ff922b",
  },

  // /* comment */
  {
    tag: tags.comment,
    color: "#75b798",
    fontStyle: "italic",
  },

  // :, ;, { }, (, )
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

  // !important
  // Danger 계열
  {
    tag: tags.modifier,
    color: "#ea868f",
    fontWeight: "600",
  },

  // calc(), var()
  {
    tag: tags.function(tags.variableName),
    color: "#6ea8fe",
  },

  // --bs-primary, --background
  {
    tag: tags.variableName,
    color: "#6ea8fe",
  },
]);

export default function CssEditor({
  data,
  setData,
  height = "220px",
  placeholder,
}: {
  data: string;
  setData: (value: string) => void;
  height?: string;
  placeholder?: string;
}) {
  return (
    <CodeMirror
      value={data}
      height={height}
      extensions={[css(), editorTheme, syntaxHighlighting(cssHighlight)]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
      }}
      onChange={(value) => setData(value)}
      placeholder={placeholder}
    />
  );
}
