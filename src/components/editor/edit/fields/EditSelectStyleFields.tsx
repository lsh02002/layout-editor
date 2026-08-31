import ApplyButton from "./ApplyButton";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  onApply: () => void;
  colClassName?: string;
};

function EditSelectStyleFields({
  label,
  value,
  options,
  onChange,
  onApply,
  colClassName = "col-md-6",
}: Props) {
  return (
    <div className={colClassName}>
      <label className="form-label">{label}</label>
      <div className="input-group input-group-sm">
        <select
          className="form-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ApplyButton onClick={onApply} />
      </div>
    </div>
  );
}

export default EditSelectStyleFields;
