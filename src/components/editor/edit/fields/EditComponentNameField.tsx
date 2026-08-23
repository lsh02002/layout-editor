type Props = {
  value: string;
  onChange: (value: string) => void;
};

function EditComponentNameField({ value, onChange }: Props) {
  return (
    <div className="mb-3">
      <label className="form-label">컴포넌트 이름</label>

      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: 메인 배너"
      />
    </div>
  );
}

export default EditComponentNameField;
