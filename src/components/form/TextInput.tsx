const TextInput = ({
  disabled,
  name,
  data,
  setData,
}: {
  disabled?: boolean;
  name: string;
  data: string;
  setData: (v: string) => void;
}) => {
  return (
    <div className="w-100 mb-3">
      <input
        type="text"
        name={name}
        value={data}
        disabled={disabled}
        onChange={(e) => setData(e.target.value)}
        placeholder={`내용을(를) 입력하세요`}
        className="form-control"
      />
    </div>
  );
};

export default TextInput;
