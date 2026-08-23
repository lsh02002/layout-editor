type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function ComponentNameField({
  value,
  onChange,
  placeholder = "예: 신청 버튼, 메인 이미지",
}: Props) {
  return (
    <div className="mb-3">
      <label className="form-label">컴포넌트 이름</label>

      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default ComponentNameField;
