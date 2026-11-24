type Props = {
  onClick: () => void;
  disabled?: boolean;
};

function ApplyButton({ onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      className="btn btn-outline-primary"
      onClick={onClick}
      disabled={disabled}
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
  );
}

export default ApplyButton;
