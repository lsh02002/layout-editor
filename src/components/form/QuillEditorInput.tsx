import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useModalManager } from "../../usehooks/usehooks";

const QuillEditorInput = ({
  disabled,
  name,
  data,
  setData,
  placeholder,
  style,
  rows = 8,
}: {
  disabled?: boolean;
  name: string;
  data: string;
  setData: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  rows?: number;
}) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const { openModal, closeModal, isOpen } = useModalManager();
  const isEditorOpen = isOpen(name);

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    const root = editor?.root;
    if (!root) return;

    const handleCompositionStart = () => {
      setIsEmpty(false);
    };

    const handleCompositionEnd = () => {
      const text = editor.getText().trim();
      setIsEmpty(text.length === 0);
    };

    root.addEventListener("compositionstart", handleCompositionStart);
    root.addEventListener("compositionend", handleCompositionEnd);

    return () => {
      root.removeEventListener("compositionstart", handleCompositionStart);
      root.removeEventListener("compositionend", handleCompositionEnd);
    };
  }, [isEditorOpen]);

  const isDataEmpty =
    !data ||
    data === "<p><br></p>" ||
    data === "<p></p>" ||
    data.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  return (
    <div className="w-100 mb-3">
      <style>{quillStyles}</style>

      {/* <label htmlFor={name} className="form-label fw-semibold">
        {title}
      </label> */}

      <div
        onClick={() => {
          if (!disabled) openModal(name);
        }}
        className={`form-control ${isDataEmpty ? "text-secondary" : ""}`}
        style={{
          paddingTop: 32,
          minHeight: 3 * 24 + 32,
          cursor: disabled ? "not-allowed" : "pointer",
          overflow: "hidden",
        }}
      >
        {!isDataEmpty ? (
          <div
            dangerouslySetInnerHTML={{ __html: data }}
            style={{
              ...style,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2, // 원하는 줄 수
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
          />
        ) : (
          `내용을(를) 입력하세요`
        )}
      </div>

      <div
        role="presentation"
        className="position-fixed start-0 w-100 h-100"
        onClick={() => closeModal(name)}
        aria-hidden={!isEditorOpen}
        style={{
          top: 0,
          bottom: 55,
          background: "rgba(0, 0, 0, 0.32)",
          opacity: isEditorOpen ? 1 : 0,
          pointerEvents: isEditorOpen ? "auto" : "none",
          transition: "opacity 160ms ease",
          zIndex: 100,
        }}
      />

      <aside
        aria-hidden={!isEditorOpen}
        className="w-100 start-0 position-fixed bg-white shadow d-flex flex-column"
        style={{
          bottom: 0,
          zIndex: 100,
          height: "70%",
          borderRadius: "20px 20px 0 0",
          transform: isEditorOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms ease",
        }}
      >
        <div className="w-100 d-flex align-items-center justify-content-between border-bottom px-3">
          <h2 className="m-0 fs-6 fw-bold">내용</h2>
          <button
            className="btn border-0 bg-transparent fs-3 text-secondary px-1 py-0"
            onClick={() => closeModal(name)}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="w-100 p-4 d-flex justify-content-center overflow-auto">
          <div
            className={`w-100 quill-editor-bootstrap ${
              disabled ? "is-disabled" : ""
            }`}
            style={
              {
                ["--quill-min-height"]: `${Math.max(rows, 1) * 24 + 24}px`,
                ["--quill-min-height-mobile"]: `${
                  Math.max(rows, 1) * 24 + 32
                }px`,

                ["--quill-color"]:
                  style?.color ?? "var(--bs-body-color, #212529)",

                ["--quill-font-size"]: style?.fontSize ?? "0.95rem",

                ["--quill-text-align"]: style?.textAlign ?? "left",

                position: "relative",
                paddingBottom: 100,
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
      </aside>
    </div>
  );
};

export default QuillEditorInput;

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
  line-height: 1.5;
}

.quill-editor-bootstrap.is-disabled .ql-container {
  border-radius: 0.375rem;
  background: var(--bs-tertiary-bg, #f8f9fa);
}

.quill-editor-bootstrap .ql-editor {
  min-height: var(--quill-min-height-mobile, 224px);
  padding: 12px 14px;
  word-break: break-word;
  overflow-wrap: anywhere;

  color: var(--quill-color);
  font-size: var(--quill-font-size);
  text-align: var(--quill-text-align);
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
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.quill-editor-bootstrap .ql-disabled .ql-editor {
  color: var(--bs-secondary-color, #6c757d);
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
    font-size: 16px;
    min-height: var(--quill-min-height-mobile, 224px);
  }
}
`;
