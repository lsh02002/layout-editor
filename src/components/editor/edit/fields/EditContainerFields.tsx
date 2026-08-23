import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  direction: "row" | "column";
  onComponentNameChange: (value: string) => void;
  onDirectionChange: (value: "row" | "column") => void;
};

function EditContainerFields({
  componentName,
  direction,
  onComponentNameChange,
  onDirectionChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">배치 방향</label>

        <div className="d-flex gap-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="editContainerDirection"
              id="editDirectionColumn"
              checked={direction === "column"}
              onChange={() => onDirectionChange("column")}
            />

            <label className="form-check-label" htmlFor="editDirectionColumn">
              세로
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="editContainerDirection"
              id="editDirectionRow"
              checked={direction === "row"}
              onChange={() => onDirectionChange("row")}
            />

            <label className="form-check-label" htmlFor="editDirectionRow">
              가로
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditContainerFields;
