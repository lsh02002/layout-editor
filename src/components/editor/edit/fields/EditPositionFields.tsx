import type { Dispatch, SetStateAction } from "react";

import type { ComponentLayout } from "../../../../types/types";

type PositionParentOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  editLayout: ComponentLayout;
  setEditLayout: Dispatch<SetStateAction<ComponentLayout>>;
  onLayoutChange: (layout: Partial<ComponentLayout>) => void;
  hideResizeMessage: () => void;
  positionParentOptions: PositionParentOption[];
  onPositionParentChange: (parentId: string | null) => void;
};

function EditPositionFields({
  editLayout,
  setEditLayout,
  onLayoutChange,
  hideResizeMessage,
  positionParentOptions,
  onPositionParentChange,
}: Props) {
  return (
    <>
      <div className="col-md-6">
        <label className="form-label fw-semibold">위치 방식</label>

        <select
          className="form-select form-select-sm"
          value={editLayout.position ?? "relative"}
          onChange={(event) => {
            hideResizeMessage();

            const position = event.target.value as "relative" | "absolute";

            const nextLayout: Partial<ComponentLayout> =
              position === "absolute"
                ? {
                    position: "absolute",
                    x: editLayout.x ?? 0,
                    y: editLayout.y ?? 0,
                  }
                : {
                    position: "relative",
                    x: undefined,
                    y: undefined,
                  };

            setEditLayout((prev) => ({
              ...prev,
              ...nextLayout,
            }));

            onLayoutChange(nextLayout);
          }}
        >
          <option value="relative">일반 배치</option>
          <option value="absolute">자유 배치</option>
        </select>

        <div className="form-text">
          자유 배치를 선택하면 캔버스에서 원하는 위치로 이동할 수 있습니다.
        </div>
      </div>

      {editLayout.position === "absolute" && (
        <div className="col-6">
          <label className="form-label">기준 컴포넌트</label>

          <select
            className="form-select form-select-sm"
            value={editLayout.positionParentId ?? ""}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onChange={(event) => {
              hideResizeMessage();

              const value = event.target.value || null;

              setEditLayout((prev) => ({
                ...prev,
                positionParentId: value,
              }));

              onPositionParentChange(value);
            }}
          >
            {positionParentOptions.map((component) => {
              const maxLength = 18;

              const label =
                component.label.length > maxLength
                  ? `${component.label.slice(0, maxLength)}...`
                  : component.label;

              return (
                <option
                  key={component.id}
                  value={component.id}
                  title={component.label}
                  disabled={component.disabled}
                >
                  {label}
                </option>
              );
            })}
          </select>

          <div className="row-md-2">
            <label className="form-label">X</label>

            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control"
                value={editLayout.x ?? 0}
                onChange={(event) => {
                  hideResizeMessage();

                  const x = Number(event.target.value) || 0;

                  setEditLayout((prev) => ({
                    ...prev,
                    x,
                  }));

                  onLayoutChange({
                    x,
                  });
                }}
              />

              <span className="input-group-text">px</span>
            </div>
          </div>

          <div className="row-md-2">
            <label className="form-label">Y</label>

            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control"
                value={editLayout.y ?? 0}
                onChange={(event) => {
                  hideResizeMessage();

                  const y = Number(event.target.value) || 0;

                  setEditLayout((prev) => ({
                    ...prev,
                    y,
                  }));

                  onLayoutChange({
                    y,
                  });
                }}
              />

              <span className="input-group-text">px</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EditPositionFields;
