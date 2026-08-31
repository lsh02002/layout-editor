import type { Dispatch, SetStateAction } from "react";

import type { ComponentLayout } from "../../../../types/types";

type Props = {
  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  onLayoutChange: (layout: Partial<ComponentLayout>) => void;
  hideResizeMessage: () => void;
  widthApplied: boolean;
  setWidthApplied: Dispatch<SetStateAction<boolean>>;
};

function EditWidthFields({
  editLayout,
  setEditLayout,
  onLayoutChange,
  hideResizeMessage,
  widthApplied,
  setWidthApplied,
}: Props) {
  return (
    <div className="col-md-6">
      <label className="form-label">Width</label>

      <div className="input-group input-group-sm">
        <select
          className="form-select"
          value={editLayout.widthMode ?? "auto"}
          onChange={(event) => {
            hideResizeMessage();

            const widthMode = event.target.value as "auto" | "fill" | "fixed";

            const width =
              widthMode === "fixed"
                ? (editLayout.width ?? 300)
                : editLayout.width;

            setEditLayout((prev) => ({
              ...prev,
              widthMode,
              width,
            }));

            onLayoutChange({
              widthMode,
              width: widthMode === "fixed" ? width : undefined,
            });

            setWidthApplied(widthMode === "fixed");
          }}
        >
          <option value="auto">Auto</option>
          <option value="fill">Fill</option>
          <option value="fixed">Fixed</option>
        </select>

        {editLayout.widthMode === "fixed" && (
          <input
            type="number"
            className="form-control"
            value={Number(editLayout.width ?? 300)}
            onChange={(event) => {
              const width = Number(event.target.value);

              setEditLayout((prev) => ({
                ...prev,
                width,
              }));

              onLayoutChange({
                widthMode: "fixed",
                width,
              });
            }}
          />
        )}
      </div>

      {widthApplied && (
        <div className="form-text">
          지금 박스 왼쪽 오른쪽 드래그해서 너비 변경할 수 있음!
        </div>
      )}
    </div>
  );
}

export default EditWidthFields;
