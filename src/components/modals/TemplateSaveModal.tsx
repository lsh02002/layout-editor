type TemplateSaveType = "project" | "component";

type Props = {
  open: boolean;
  type: TemplateSaveType;
  fileName: string;
  sanitizedFileName: string;
  onFileNameChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

function TemplateSaveModal({
  open,
  type,
  fileName,
  sanitizedFileName,
  onFileNameChange,
  onClose,
  onSave,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1060 }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {type === "project"
                  ? "프로젝트 템플릿 저장"
                  : "컴포넌트 템플릿 저장"}
              </h5>

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <label className="form-label">템플릿 이름</label>

              <input
                type="text"
                className="form-control"
                value={fileName}
                onChange={(event) => onFileNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSave();
                  }
                }}
                autoFocus
              />

              <div className="form-text">
                {sanitizedFileName}.pbtpl 로 저장됩니다.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                취소
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={!fileName.trim()}
                onClick={onSave}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1055 }}
        onClick={onClose}
      />
    </>
  );
}

export default TemplateSaveModal;
