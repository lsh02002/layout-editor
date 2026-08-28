import EditComponentNameField from "./EditComponentNameField";

type Props = {
  componentName: string;
  height: number;

  onComponentNameChange: (value: string) => void;
  onHeightChange: (value: number) => void;
};

function EditSpacerFields({
  componentName,
  height,
  onComponentNameChange,
  onHeightChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">높이</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={1}
            max={1000}
            value={height}
            onChange={(event) => {
              const value = Number(event.target.value);

              onHeightChange(Number.isFinite(value) ? Math.max(1, value) : 1);
            }}
          />

          <span className="input-group-text">px</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">미리보기</label>

        <div
          className="border rounded bg-light d-flex align-items-center justify-content-center"
          style={{
            height: Math.min(Math.max(height, 24), 200),
            fontSize: 12,
          }}
        >
          {height}px
        </div>
      </div>
    </>
  );
}

export default EditSpacerFields;
