import ApplyButton from "./ApplyButton";
import EditComponentNameField from "./EditComponentNameField";

type DividerLineStyle = "solid" | "dashed" | "dotted";

type Props = {
  componentName: string;
  thickness: number;
  color: string;
  lineStyle: DividerLineStyle;

  onComponentNameChange: (value: string) => void;
  onThicknessChange: (value: number) => void;
  onColorChange: (value: string) => void;
  onColorCommit: () => void;
  onLineStyleChange: (value: DividerLineStyle) => void;
};

function EditDividerFields({
  componentName,
  thickness,
  color,
  lineStyle,
  onComponentNameChange,
  onThicknessChange,
  onColorChange,
  onColorCommit,
  onLineStyleChange,
}: Props) {
  return (
    <>
      <EditComponentNameField
        value={componentName}
        onChange={onComponentNameChange}
      />

      <div className="mb-3">
        <label className="form-label">두께</label>

        <div className="input-group">
          <input
            type="number"
            className="form-control"
            min={1}
            max={50}
            value={thickness}
            onChange={(event) => {
              const value = Number(event.target.value);

              onThicknessChange(
                Number.isFinite(value) ? Math.max(1, value) : 1,
              );
            }}
          />

          <span className="input-group-text">px</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">색상</label>

        <div className="input-group input-group-sm">
          <input
            type="color"
            className="form-control form-control-color"
            style={{
              width: "56px",
              minWidth: "56px",
              flex: "0 0 56px",
            }}
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
          />

          <input
            type="text"
            className="form-control"
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
          />

          <ApplyButton onClick={onColorCommit} />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">선 스타일</label>

        <select
          className="form-select"
          value={lineStyle}
          onChange={(event) =>
            onLineStyleChange(event.target.value as DividerLineStyle)
          }
        >
          <option value="solid">실선</option>
          <option value="dashed">대시</option>
          <option value="dotted">점선</option>
        </select>
      </div>

      {/* 미리보기 */}
      <div className="mb-3">
        <label className="form-label">미리보기</label>

        <div
          style={{
            padding: "16px 0",
          }}
        >
          <div
            style={{
              width: "100%",
              borderTop: `${thickness}px ${lineStyle} ${color}`,
            }}
          />
        </div>
      </div>
    </>
  );
}

export default EditDividerFields;
