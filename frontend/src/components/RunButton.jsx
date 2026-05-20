export default function RunButton({ onRun, loading }) {
  return (
    <button
      onClick={onRun}
      style={{
        padding: "10px 20px",
        background: "var(--primary)",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px"
      }}
    >
      {loading ? "Running..." : "Run ▶"}
    </button>
  );
}
