import ApplyButton from "./ApplyButton";

type Props = {
  label: string;
  value: string;
  savedValue: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onApply: () => void;
  colClassName?: string;
};

function EditTextStyleFields({
  label,
  value,
  savedValue,
  placeholder,
  onChange,
  onApply,
  colClassName = "col-md-6",
}: Props) {
  const isDirty = value !== savedValue;

  return (
    <div className={colClassName}>
      <label className="form-label">{label}</label>

      <div className="input-group input-group-sm position-relative">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <ApplyButton onClick={onApply} />

        {isDirty && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 9,
              height: 9,
              backgroundColor: "var(--bs-primary)",
              borderRadius: "50%",
              border: "2px solid white",
              pointerEvents: "none",
            }}
            title="저장되지 않은 변경사항"
            aria-label="저장되지 않은 변경사항"
          />
        )}
      </div>
    </div>
  );
}

export default EditTextStyleFields;
