import type { Dispatch, SetStateAction } from "react";

import type { ComponentLayout } from "../../../../types/types";

type Props = {
  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  onLayoutChange: (layout: Partial<ComponentLayout>) => void;
  hideResizeMessage: () => void;
  heightApplied: boolean;
  setHeightApplied: Dispatch<SetStateAction<boolean>>;
};

function EditHeightFields({
  editLayout,
  setEditLayout,
  onLayoutChange,
  hideResizeMessage,
  heightApplied,
  setHeightApplied,
}: Props) {
  return (
    <div className="col-md-6">
      <label className="form-label">Height</label>

      <div className="input-group input-group-sm">
        <select
          className="form-select"
          value={editLayout.heightMode ?? "auto"}
          onChange={(event) => {
            hideResizeMessage();

            const heightMode = event.target.value as "auto" | "fill" | "fixed";

            const height =
              heightMode === "fixed"
                ? (editLayout.height ?? 100)
                : editLayout.height;

            setEditLayout((prev) => ({
              ...prev,
              heightMode,
              height,
            }));

            onLayoutChange({
              heightMode,
              height: heightMode === "fixed" ? height : undefined,
            });

            setHeightApplied(heightMode === "fixed");
          }}
        >
          <option value="auto">Auto</option>
          <option value="fill">Fill</option>
          <option value="fixed">Fixed</option>
        </select>

        {editLayout.heightMode === "fixed" && (
          <input
            type="number"
            className="form-control"
            value={Number(editLayout.height ?? 100)}
            onChange={(event) => {
              const height = Number(event.target.value);

              setEditLayout((prev) => ({
                ...prev,
                height,
              }));

              onLayoutChange({
                heightMode: "fixed",
                height,
              });
            }}
          />
        )}
      </div>

      {heightApplied && (
        <div className="form-text">
          지금 박스 위아래 부분 드래그해서 높이 변경할 수 있음!
        </div>
      )}
    </div>
  );
}

export default EditHeightFields;
