const TextAreaInput = ({
  disabled,
  name,
  title,
  data,
  setData,
  rows,
}: {
  disabled?: boolean;
  name: string;
  title: string;
  data: string;
  setData: (v: string) => void;
  rows?: number;
}) => {
  return (
    <div className="w-100 mb-3">
      <label htmlFor={name} className="form-label fw-semibold">
        {title}
      </label>
      <textarea
        name={name}
        id={name}
        value={data}
        rows={rows}
        disabled={disabled}
        onChange={(e) => setData(e.target.value)}
        placeholder={`${title}을(를) 입력하세요`}
        className="form-control"
      />
    </div>
  );
};

export default TextAreaInput;
