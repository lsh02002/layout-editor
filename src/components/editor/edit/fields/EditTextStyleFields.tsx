import ApplyButton from "./ApplyButton";

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onApply: () => void;
  colClassName?: string;
};

function EditTextStyleFields({
  label,
  value,
  placeholder,
  onChange,
  onApply,
  colClassName = "col-md-6",
}: Props) {
  return (
    <div className={colClassName}>
      {" "}
      <label className="form-label">{label}</label>
      <div className="input-group input-group-sm">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <ApplyButton onClick={onApply} />
      </div>
    </div>
  );
}

export default EditTextStyleFields;
