const TextInput = ({
  disabled,
  name,
  title,
  data,
  setData,
}: {
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
        type="text"
        id={name}
        name={name}
        value={data}
        disabled={disabled}
        onChange={(e) => setData(e.target.value)}
        placeholder={`${title}을(를) 입력하세요`}
        className="form-control"
      />
    </div>
  );
};

export default TextInput;
