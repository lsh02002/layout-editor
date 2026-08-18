import React, { useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const QuillEditorSimpleInput = ({
  disabled,
  data,
  setData,
  placeholder,
  style,
  rows = 2,
}: {
  disabled?: boolean;
  data: string;
  setData: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  rows?: number;
}) => {
  const quillRef = useRef<ReactQuill | null>(null);

  const isDataEmpty =
    !data ||
    data === "<p><br></p>" ||
    data === "<p></p>" ||
    data.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  const [isEmpty, setIsEmpty] = useState(isDataEmpty);

  return (
    <div className="w-100 mb-3">
      <style>{quillStyles}</style>

      <div
        className={`w-100 quill-editor-bootstrap ${
          disabled ? "is-disabled" : ""
        }`}
        style={
          {
            ["--quill-min-height"]: `${Math.max(rows, 1) * 24 + 24}px`,

            ["--quill-min-height-mobile"]: `${Math.max(rows, 1) * 24 + 32}px`,

            ["--quill-color"]: style?.color ?? "var(--bs-body-color, #212529)",

            ["--quill-font-size"]: style?.fontSize ?? "0.95rem",

            ["--quill-text-align"]: style?.textAlign ?? "left",

            ["--quill-font-weight"]: style?.fontWeight ?? "normal",

            ["--quill-line-height"]: style?.lineHeight ?? "1.5",

            position: "relative",
            width: "100%",
          } as React.CSSProperties
        }
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={data}
          onChange={(value, _delta, _source, editor) => {
            const text = editor.getText().trim();

            const isReallyEmpty =
              text.length === 0 ||
              value === "<p><br></p>" ||
              value === "<p></p>";

            setData(value);
            setIsEmpty(isReallyEmpty);
          }}
          readOnly={disabled}
          placeholder={isEmpty ? placeholder || "내용을 입력하세요" : ""}
          modules={{
            toolbar: disabled
              ? false
              : [
                  ["bold", "italic", "underline", "strike"],
                  [{ color: [] }, { background: [] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["blockquote", "link"],
                  ["clean"],
                ],
          }}
        />
      </div>
    </div>
  );
};

export default QuillEditorSimpleInput;

const quillStyles = `
.quill-editor-bootstrap {
  width: 100%;
  min-width: 0;
}

.quill-editor-bootstrap .ql-toolbar {
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-bottom: none;
  border-radius: 0.375rem 0.375rem 0 0;
  background: #ffffff;
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
  column-gap: 4px;
  padding: 8px 10px;
  white-space: normal;
}

.quill-editor-bootstrap.is-disabled .ql-toolbar {
  background: var(--bs-tertiary-bg, #f8f9fa);
}

.quill-editor-bootstrap .ql-toolbar .ql-formats {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  margin-right: 8px;
  margin-bottom: 0;
}

.quill-editor-bootstrap .ql-container {
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 0 0 0.375rem 0.375rem;
  background: #ffffff;
  line-height: var(--quill-line-height);
}

.quill-editor-bootstrap.is-disabled .ql-container {
  border-radius: 0.375rem;
  background: var(--bs-tertiary-bg, #f8f9fa);
}

.quill-editor-bootstrap .ql-editor {
  min-height: var(--quill-min-height, 216px);

  padding: 12px 14px;

  word-break: break-word;
  overflow-wrap: anywhere;

  color: var(--quill-color);
  font-size: var(--quill-font-size);
  text-align: var(--quill-text-align);
  font-weight: var(--quill-font-weight);
  line-height: var(--quill-line-height);
}

.quill-editor-bootstrap .ql-editor.ql-blank::before {
  color: var(--bs-secondary-color, #6c757d);
  font-style: normal;
}

.quill-editor-bootstrap .ql-container:focus-within,
.quill-editor-bootstrap .ql-toolbar:focus-within {
  border-color: #86b7fe;
}

.quill-editor-bootstrap .ql-container:focus-within {
  box-shadow:
    0 0 0 0.25rem
    rgba(13, 110, 253, 0.25);
}

.quill-editor-bootstrap .ql-disabled .ql-editor {
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .quill-editor-bootstrap .ql-toolbar {
    padding: 6px 8px;
    row-gap: 6px;
  }

  .quill-editor-bootstrap .ql-toolbar button,
  .quill-editor-bootstrap .ql-toolbar .ql-picker {
    flex-shrink: 0;
  }

  .quill-editor-bootstrap .ql-editor {
    font-size: var(--quill-font-size);
    min-height:
      var(--quill-min-height-mobile, 224px);
  }
}
`;
