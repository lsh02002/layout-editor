type Props = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

function ProjectCssModal({ open, value, onChange, onClose, onSave }: Props) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1060 }}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">프로젝트 Custom CSS</h5>

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <textarea
                className="form-control font-monospace"
                rows={20}
                spellCheck={false}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={`.builder-preview {
  background: #f8f9fa;
}

.builder-preview button {
  border-radius: 20px;
}`}
              />
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
                onClick={onSave}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
    </>
  );
}

export default ProjectCssModal;
