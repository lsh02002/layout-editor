import ApplyButton from "./ApplyButton";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  colClassName?: string;
};

function EditColorStyleFields({
  label,
  value,
  onChange,
  onApply,
  colClassName = "col-md-6",
}: Props) {
  return (
    <div className={colClassName}>
      <label className="form-label">{label}</label>
      <div className="input-group input-group-sm">
        <input
          type="color"
          className="form-control form-control-color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <ApplyButton onClick={onApply} />
      </div>
    </div>
  );
}

export default EditColorStyleFields;
