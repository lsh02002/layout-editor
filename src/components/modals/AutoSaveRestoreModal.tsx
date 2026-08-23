import type { AutoSaveData } from "../../types/types";

type Props = {
  data: AutoSaveData | null;
  onRestore: () => void;
  onDiscard: () => void;
};

function AutoSaveRestoreModal({ data, onRestore, onDiscard }: Props) {
  if (!data) {
    return null;
  }

  const savedAt = new Date(data.savedAt).toLocaleString();

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1060 }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">자동 저장본 복구</h5>
            </div>

            <div className="modal-body">
              <p className="mb-2">이전 작업의 자동 저장본이 있습니다.</p>
              <small className="text-secondary">저장 시간: {savedAt}</small>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={onDiscard}
              >
                버리기
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onRestore}
              >
                복구
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
    </>
  );
}

export default AutoSaveRestoreModal;
