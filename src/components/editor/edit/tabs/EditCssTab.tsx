type Props = {
  value: string;
  onChange: (value: string) => void;
};

function EditCssTab({ value, onChange }: Props) {
  return (
    <div>
      <label className="form-label">컴포넌트 Custom CSS</label>

      <textarea
        className="form-control font-monospace"
        rows={14}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`& {
  background: #111;
  color: white;
}

&:hover {
  opacity: 0.9;
}

& button {
  border-radius: 20px;
}`}
        spellCheck={false}
      />

      <div className="form-text">&amp; 는 현재 컴포넌트를 의미합니다.</div>
    </div>
  );
}

export default EditCssTab;
