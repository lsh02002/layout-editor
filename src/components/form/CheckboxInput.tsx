const CheckboxInput = ({
  disabled,
  name,
  title,
  checked,
  setChecked,
}: {
  disabled?: boolean;
  name: string;
  title: string;
  checked: boolean;
  setChecked: (v: boolean) => void;
}) => {
  return (
    <div className="w-100 mb-3">
      <label htmlFor={name} className="form-label fw-semibold">
        {title}
      </label>
      <div className="form-check">
        <input
          type="checkbox"
          id={name}
          name={name}
          className="form-check-input"
          checked={checked}
          disabled={disabled}
          onChange={(e) => setChecked(e.target.checked)}
        />
      </div>
    </div>
  );
};

export default CheckboxInput;
