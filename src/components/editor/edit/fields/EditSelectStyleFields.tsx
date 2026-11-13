type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: Option[];
  onApply: (value: string) => void;
  colClassName?: string;
};

function EditSelectStyleFields({
  label,
  value,
  options,
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
          onChange={(event) => {
            event.stopPropagation();
            onApply(event.target.value);
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default EditSelectStyleFields;
