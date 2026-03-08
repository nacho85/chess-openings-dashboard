import { Handle, Position } from "reactflow";

export default function CircleNode({ data }) {
  let background = "#2a2a2a";
  let color = "white";
  let border = "2px solid rgba(255,255,255,0.3)";

  if (data.side === "w") {
    background = "white";
    color = "black";
    border = "2px solid rgba(0,0,0,0.35)";
  }

  if (data.mistake) {
    background = data.mistake === "error" ? "#ff5757" : "#ffb020";
    color = "white";
    border = "2px solid rgba(255,255,255,0.25)";
  }

  const boxShadow = data.selected
    ? "0 0 0 4px rgba(80,160,255,0.35), 0 10px 22px rgba(0,0,0,0.45)"
    : "0 6px 16px rgba(0,0,0,0.35)";

  const tags = Array.isArray(data.tags) ? data.tags : [];
  const hasNote = !!(data.note && data.note.trim());
  const hasTags = tags.length > 0;

  // tooltip simple (title) con tags + nota
  const titleParts = [];
  if (data.label) titleParts.push(data.label);
  if (hasTags) titleParts.push(`Tags: ${tags.join(", ")}`);
  if (hasNote) titleParts.push(`Nota: ${data.note}`);
  const title = titleParts.join("\n");

  return (
    <div
      title={title}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background,
        border,
        boxShadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 14,
        color,
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* label */}
      <div style={{ transform: "translateY(-0.5px)" }}>{data.label || ""}</div>

      {/* note indicator */}
      {hasNote ? (
        <div
          style={{
            position: "absolute",
            top: -6,
            left: -6,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "rgba(0,0,0,0.75)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          📝
        </div>
      ) : null}
    </div>
  );
}