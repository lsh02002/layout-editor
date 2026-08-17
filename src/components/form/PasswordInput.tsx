const PasswordInput = ({
  isPasswordVisible,
  disabled,
  name,
  title,
  data,
  setData,
}: {
  isPasswordVisible?: boolean;
  disabled?: boolean;
  name: string;
  title: string;
  data: string;
  setData: (v: string) => void;
}) => {
  return (
    <div className="w-100 mb-3">
      <label htmlFor={name} className="form-label fw-semibold">
        {title}
      </label>
      <input
        disabled={disabled}
        type={isPasswordVisible ? "text" : "password"}
        name={name}
        id={name}
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder={`${title}을(를) 입력하세요`}
        className="form-control"
      />
    </div>
  );
};

export default PasswordInput;
