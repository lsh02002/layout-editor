type Props = {
  value: string;
  onValueChange: (value: string) => void;
  onApply: () => void;
};

function ApplyButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="d-flex justify-content-end">
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={onClick}
        title="적용"
        aria-label="적용"
        style={{
          width: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="bi bi-check-lg" />
      </button>
    </div>
  );
}

function EditCssTab({ value, onValueChange, onApply }: Props) {
  return (
    <div>
      <label className="form-label">컴포넌트 Custom CSS</label>

      <textarea
        className="form-control font-monospace"
        rows={14}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
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

      <div className="form-text mb-3">
        &amp; 는 현재 컴포넌트를 의미합니다. CSS는 적용 버튼을 눌러야
        반영됩니다.
      </div>

      <ApplyButton onClick={onApply} />
    </div>
  );
}

export default EditCssTab;
