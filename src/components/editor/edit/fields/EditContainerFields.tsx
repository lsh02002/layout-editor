import type {
  ContainerAlignItems,
  ContainerDirection,
  ContainerJustifyContent,
} from "../../../../types/types";

import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  direction: ContainerDirection;
  gap: number;
  justifyContent: ContainerJustifyContent;
  alignItems: ContainerAlignItems;
  maxWidth?: number;
  onComponentNameChange: (value: string) => void;
  onDirectionChange: (value: ContainerDirection) => void;
  onGapChange: (value: number) => void;
  onJustifyContentChange: (value: ContainerJustifyContent) => void;
  onAlignItemsChange: (value: ContainerAlignItems) => void;
  onMaxWidthChange: (value: number | undefined) => void;
};

function EditContainerFields({
  componentName,
  direction,
  gap,
  justifyContent,
  alignItems,
  maxWidth,
  onComponentNameChange,
  onDirectionChange,
  onGapChange,
  onJustifyContentChange,
  onAlignItemsChange,
  onMaxWidthChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label d-block">배치 방향</label>

        <div className="d-flex gap-2">
          <div className="form-check">
            <input
              type="radio"
              className="btn-check-input"
              name="container-direction"
              id="container-direction-column"
              value="column"
              checked={direction === "column"}
              onChange={() => onDirectionChange("column")}
            />

            <label
              className="form-check-label"
              htmlFor="container-direction-column"
            >
              세로
            </label>
          </div>

          <div className="form-check">
            <input
              type="radio"
              className="btn-check-input"
              name="container-direction"
              id="container-direction-row"
              value="row"
              checked={direction === "row"}
              onChange={() => onDirectionChange("row")}
            />

            <label
              className="form-check-label"
              htmlFor="container-direction-row"
            >
              가로
            </label>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">간격</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={0}
            max={200}
            value={gap}
            onChange={(event) =>
              onGapChange(Math.max(0, Number(event.target.value) || 0))
            }
          />

          <span className="input-group-text">px</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">
          {direction === "row" ? "가로 정렬" : "세로 정렬"}
        </label>

        <select
          className="form-select"
          value={justifyContent}
          onChange={(event) =>
            onJustifyContentChange(
              event.target.value as ContainerJustifyContent,
            )
          }
        >
          <option value="flex-start">시작</option>
          <option value="center">가운데</option>
          <option value="flex-end">끝</option>
          <option value="space-between">양쪽 정렬</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          {direction === "row" ? "세로 정렬" : "가로 정렬"}
        </label>

        <select
          className="form-select"
          value={alignItems}
          onChange={(event) =>
            onAlignItemsChange(event.target.value as ContainerAlignItems)
          }
        >
          <option value="stretch">늘리기</option>
          <option value="flex-start">시작</option>
          <option value="center">가운데</option>
          <option value="flex-end">끝</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">최대 너비</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={0}
            placeholder="제한 없음"
            value={maxWidth ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              onMaxWidthChange(
                value === "" ? undefined : Math.max(0, Number(value)),
              );
            }}
          />

          <span className="input-group-text">px</span>
        </div>

        <div className="form-text">비워두면 최대 너비 제한이 없습니다.</div>
      </div>
    </>
  );
}

export default EditContainerFields;
