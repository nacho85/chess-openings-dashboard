// SelectedNodeNotePanel.jsx
import React from "react";

export default function SelectedNodeNotePanel({ selectedNode }) {
  const note = (selectedNode?.note || "").trim();
  const tags = Array.isArray(selectedNode?.tags) ? selectedNode.tags : [];
  const label = selectedNode?.san || selectedNode?.label || "";

  if (!note && tags.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3">
      <div className="text-xs font-semibold opacity-80">
        {label ? `Notas (${label})` : "Notas"}
      </div>

      {tags.length > 0 ? (
        <div className="mt-2">
          {tags.map((t) => (
            <span
              key={t}
              className="mr-2 inline-block rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {note ? (
        <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
          {note}
        </div>
      ) : (
        <div className="mt-2 text-sm opacity-60">Sin notas.</div>
      )}
    </div>
  );
}