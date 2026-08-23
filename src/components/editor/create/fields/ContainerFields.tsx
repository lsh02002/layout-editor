import type { ContainerDirection } from "../../../../types/types";

import ComponentNameField from "./ComponentNameField";

type Props = {
  componentName: string;
  direction: ContainerDirection;
  onComponentNameChange: (value: string) => void;
  onDirectionChange: (value: ContainerDirection) => void;
};

function ContainerFields({
  componentName,
  direction,
  onComponentNameChange,
  onDirectionChange,
}: Props) {
  return (
    <>
      <ComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
        placeholder="예: 메인 배너, 소개 영역"
      />

      <div className="mb-3">
        <label className="form-label">배치 방향</label>

        <div className="d-flex gap-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="containerDirection"
              id="directionColumn"
              value="column"
              checked={direction === "column"}
              onChange={() => onDirectionChange("column")}
            />

            <label className="form-check-label" htmlFor="directionColumn">
              세로
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="containerDirection"
              id="directionRow"
              value="row"
              checked={direction === "row"}
              onChange={() => onDirectionChange("row")}
            />

            <label className="form-check-label" htmlFor="directionRow">
              가로
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContainerFields;
