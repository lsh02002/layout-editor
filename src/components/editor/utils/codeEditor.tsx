// codeEditor.tsx

import CodeMirror from "@uiw/react-codemirror";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

import { syntaxHighlighting, type LanguageSupport } from "@codemirror/language";

import { EditorView } from "@codemirror/view";

import { codeHighlight, type CodeLanguage } from "./codeHighlight";

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
