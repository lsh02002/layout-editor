import type { MouseEventHandler } from "react";
import { memo } from "react";
interface EditMenuBoxProps {
  onEdit?: MouseEventHandler<HTMLButtonElement>;
  onCopy?: MouseEventHandler<HTMLButtonElement>;
  onDelete?: MouseEventHandler<HTMLButtonElement>;
}

function EditMenuBox({ onEdit, onCopy, onDelete }: EditMenuBoxProps) {
  return (
    <div className="d-flex align-items-center gap-1">
      <button
        type="button"
        className="btn btn-sm border-0 bg-transparent p-1"
        title="편집"
        onClick={onEdit}
      >
        <i className="bi bi-pencil" />
      </button>

      <button
        type="button"
        className="btn btn-sm border-0 bg-transparent p-1"
        title="복사"
        onClick={onCopy}
      >
        <i className="bi bi-copy" />
      </button>

      <button
        type="button"
        className="btn btn-sm border-0 bg-transparent p-1 text-danger"
        title="삭제"
        onClick={onDelete}
      >
        <i className="bi bi-trash" />
      </button>
    </div>
  );
}

export default memo(EditMenuBox);
