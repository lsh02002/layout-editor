import { useState } from "react";
import { useModalManager } from "../../usehooks/usehooks";

interface TextAreaInputProps {
  disabled?: boolean;
  name: string;
  data: string;
  setData: (v: string) => void;
  rows?: number;
}

const TextAreaInput = ({
  disabled,
  name,
  data,
  setData,
  rows = 6,
}: TextAreaInputProps) => {
  const { openModal, closeModal, isOpen } = useModalManager();

  const [tempData, setTempData] = useState(data);

  const isModalOpen = isOpen(name);

  const openEditor = () => {
    if (disabled) return;

    setTempData(data);
    openModal(name);
  };

  const closeEditor = () => {
    closeModal(name);
  };

  const handleApply = () => {
    setData(tempData);
    closeEditor();
  };

  return (
    <>
      <div
        className="form-control w-100 mb-3"
        onClick={openEditor}
        style={{
          cursor: disabled ? "default" : "pointer",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word",
          minHeight: "58px",
          whiteSpace: "pre-wrap",
        }}
      >
        {data || <span className="text-secondary">내용을 입력하세요</span>}
      </div>

      {isModalOpen && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 9998,
            }}
            onClick={closeEditor}
          />

          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded shadow p-4"
            style={{
              width: "min(90vw, 700px)",
              zIndex: 9999,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">내용 편집</h5>

              <button
                type="button"
                className="btn-close"
                onClick={closeEditor}
              />
            </div>

            <textarea
              value={tempData}
              rows={rows}
              autoFocus
              className="form-control"
              placeholder="내용을 입력하세요"
              onChange={(e) => setTempData(e.target.value)}
            />

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeEditor}
              >
                취소
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApply}
              >
                적용
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TextAreaInput;
