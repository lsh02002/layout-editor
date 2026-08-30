function ApplyButton({ onClick }: { onClick: () => void }) {
  return (
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
  );
}

export default ApplyButton;
