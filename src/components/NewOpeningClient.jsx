"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";

import OpeningTree from "@/components/OpeningTree";
import ChessPanel from "@/components/ChessPanel";
import SelectedNodeNotePanel from "./SelectedNodeNotePanel";
import { findNode } from "./openingTreeUtils";

function newNodeId(prefix = "n") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function clone(obj) {
  return typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));
}

function getPathIds(root, targetId) {
  const path = [];
  let found = false;

  function dfs(node) {
    if (!node || found) return;
    path.push(node.id);

    if (node.id === targetId) {
      found = true;
      return;
    }

    for (const ch of node.children || []) {
      dfs(ch);
      if (found) return;
    }

    path.pop();
  }

  dfs(root);
  return found ? path : [];
}


function findParentNode(root, targetId, parent = null) {
  if (!root) return null;
  if (root.id === targetId) return parent;

  for (const child of root.children || []) {
    const found = findParentNode(child, targetId, root);
    if (found !== null) return found;
  }

  return null;
}

function removeNodeById(root, targetId) {
  if (!root || root.id === targetId) return false;
  if (!Array.isArray(root.children) || root.children.length === 0) return false;

  const initialLength = root.children.length;
  root.children = root.children.filter((child) => child.id !== targetId);
  if (root.children.length !== initialLength) return true;

  return root.children.some((child) => removeNodeById(child, targetId));
}

function uciToObj(uci) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  return promotion ? { from, to, promotion } : { from, to };
}

function computeUciFromSan(root, parentId, san) {
  const chess = new Chess();
  const ids = getPathIds(root, parentId);

  for (const id of ids) {
    const node = findNode(root, id);
    if (!node?.san) continue;

    if (node.uci) {
      const res = chess.move(uciToObj(node.uci));
      if (!res) return null;
    } else {
      const res = chess.move(node.san, { sloppy: true });
      if (!res) return null;
    }
  }

  const mv = chess.move(san, { sloppy: true });
  if (!mv) return null;

  return `${mv.from}${mv.to}${mv.promotion ? mv.promotion : ""}`;
}

export default function NewOpeningClient({
  initialOpening = null,
  mode = "create", // "create" | "edit"
}) {
  const isEdit = mode === "edit";

  const [meta, setMeta] = useState(() => ({
    id: initialOpening?.id ?? "new-opening",
    name: initialOpening?.name ?? "Nueva Opening",
    side: initialOpening?.side ?? "w",
  }));

  const [tree, setTree] = useState(() =>
    initialOpening?.root
      ? initialOpening.root
      : {
          id: "draft-root",
          san: "",
          uci: "",
          side: "w",
          popularity: 100,
          mistake: null,
          note: "",
          children: [],
        }
  );

  const [selectedNodeId, setSelectedNodeId] = useState(
    () => initialOpening?.root?.id ?? "draft-root"
  );

  const selectedNode = useMemo(
    () => findNode(tree, selectedNodeId),
    [tree, selectedNodeId]
  );
  const selectedNote = (selectedNode?.note || "").trim();
  const selectedTags = Array.isArray(selectedNode?.tags) ? selectedNode.tags : [];

  const previewPath = useMemo(() => {
    const ids = getPathIds(tree, selectedNodeId);
    const uci = [];
    const san = [];

    for (const id of ids) {
      const n = findNode(tree, id);
      if (!n?.san) continue;
      if (n.uci) uci.push(n.uci);
      san.push(n.san);
    }

    return { uci, san };
  }, [tree, selectedNodeId]);

  // Add-child inputs
  const [newMoveSan, setNewMoveSan] = useState("");
  const [newMoveUci, setNewMoveUci] = useState("");

  // Node edit inputs
  const [editSan, setEditSan] = useState("");
  const [editUci, setEditUci] = useState("");
  const [editPopularity, setEditPopularity] = useState(50);
  const [editMistake, setEditMistake] = useState(""); // "" | "inaccuracy" | "error"
  const [editNote, setEditNote] = useState("");
  const [editTags, setEditTags] = useState(""); 

  // UI toggle: edit node panel
  const [isEditingNode, setIsEditingNode] = useState(false);

  useEffect(() => {
    const n = selectedNode;
    if (!n) return;

    setEditSan(n.san || "");
    setEditUci(n.uci || "");
    setEditPopularity(typeof n.popularity === "number" ? n.popularity : 50);
    setEditMistake(n.mistake || "");

    setIsEditingNode(false);
    setEditNote(n.note || "");
    setEditTags(Array.isArray(n.tags) ? n.tags.join(", ") : "");
  }, [selectedNodeId, selectedNode]);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const addChild = () => {
    const san = newMoveSan.trim();
    if (!san) return;

    const next = clone(tree);
    const isRootUndefined = !next.san?.trim();

    if (isRootUndefined) {
      const uci = newMoveUci.trim() || computeUciFromSan(next, next.id, san) || "";

      next.san = san;
      next.uci = uci;
      next.side = "w";
      next.children = next.children || [];

      setTree(next);
      setSelectedNodeId(next.id);

      setNewMoveSan("");
      setNewMoveUci("");
      return;
    }

    const parent = findNode(next, selectedNodeId);
    if (!parent) return;

    const uci = newMoveUci.trim() || computeUciFromSan(next, parent.id, san) || "";

    const child = {
      id: newNodeId("m"),
      san,
      uci,
      side: parent.side === "w" ? "b" : "w",
      popularity: 50,
      mistake: null,
      note: "",
      children: [],
    };

    parent.children = parent.children || [];
    parent.children.push(child);

    setTree(next);
    setSelectedNodeId(child.id);

    setNewMoveSan("");
    setNewMoveUci("");
  };

  const saveNodeEdits = () => {
    const next = clone(tree);
    const n = findNode(next, selectedNodeId);
    if (!n) return;

    n.san = editSan.trim();
    n.uci = editUci.trim();

    const pop = Number(editPopularity);
    if (!Number.isNaN(pop)) n.popularity = pop;

    n.mistake = editMistake || null;

    // ✅ note
    n.note = editNote?.trim() || "";

    // ✅ tags (comma separated -> array)
    const parsedTags = (editTags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // uniq (case-insensitive) pero preservando el case del primero
    const seen = new Set();
    const uniqTags = [];
    for (const t of parsedTags) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqTags.push(t);
    }

    n.tags = uniqTags;

    setTree(next);
    setIsEditingNode(false);
  };

  const autoFillUci = () => {
    const san = editSan.trim();
    if (!san) return;

    const uci = computeUciFromSan(tree, selectedNodeId, san);
    if (uci) setEditUci(uci);
  };

  const cancelEdit = () => {
    const n = selectedNode;
    if (n) {
      setEditSan(n.san || "");
      setEditUci(n.uci || "");
      setEditPopularity(typeof n.popularity === "number" ? n.popularity : 50);
      setEditMistake(n.mistake || "");
      setEditNote(n.note || "");
      setEditTags(Array.isArray(n.tags) ? n.tags.join(", ") : "");
    }
    setIsEditingNode(false);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    const label = selectedNode.san?.trim() || 'este nodo';
    const confirmed = window.confirm(
      `¿Seguro que querés borrar ${label}? Se eliminará este nodo y todos sus hijos.`
    );

    if (!confirmed) return;

    const next = clone(tree);

    if (next.id === selectedNodeId) {
      next.san = "";
      next.uci = "";
      next.side = "w";
      next.popularity = 100;
      next.mistake = null;
      next.note = "";
      next.tags = [];
      next.children = [];
      setTree(next);
      setSelectedNodeId(next.id);
      setIsEditingNode(false);
      return;
    }

    const parent = findParentNode(next, selectedNodeId);
    const deleted = removeNodeById(next, selectedNodeId);

    if (!deleted) return;

    setTree(next);
    setSelectedNodeId(parent?.id || next.id);
    setIsEditingNode(false);
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg("");

    try {
      if (!meta.id.trim() || !meta.name.trim()) {
        throw new Error("Completá ID y Nombre.");
      }
      if (!tree?.san?.trim()) {
        throw new Error('Agregá al menos la primera jugada (root), ej: "e4".');
      }

      // ✅ SIEMPRE definido
      const opening = {
        id: meta.id.trim(),
        name: meta.name.trim(),
        side: meta.side,
        root: tree,
      };

      const res = await fetch("/api/openings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { opening }
            : {
                moduleName: meta.id.replace(/-/g, "_"),
                fileName: `${meta.id}-${meta.side === "b" ? "black" : "white"}`,
                opening,
              }
        ),
      });

      const text = await res.text();
      let json = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // server returned HTML or plain text
      }

      if (!res.ok) {
        // muestra algo útil aunque no sea JSON
        throw new Error(
          (json && json.error) ||
            `HTTP ${res.status}: ${text?.slice(0, 200) || "Empty response"}`
        );
      }

      if (json && json.ok === false) {
        throw new Error(json.error || "Save failed");
      }

      if (!json.ok) throw new Error(json.error || "Save failed");

      setSaveMsg(isEdit ? "Actualizado ✅" : `Guardado ✅ (archivo: ${json.file})`);
    } catch (e) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isRootUndefined = !tree?.san?.trim();

  return (
    <main className="flex h-screen min-h-0">
      <div className="w-96 border-r p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEdit ? "Editar Opening" : "Nueva Opening"}
          </div>
          <Link href="/" className="text-sm border rounded px-3 py-1 hover:opacity-80">
            ← Dashboard
          </Link>
        </div>

        <label className={`text-sm transition-opacity ${isEditingNode ? "opacity-45" : ""}`}>
          ID (slug)
          <input
            className={`mt-1 w-full border rounded px-2 py-1 ${
              isEdit ? "opacity-60 cursor-not-allowed" : ""
            } ${isEditingNode ? "pointer-events-none bg-neutral-100" : ""}`}
            value={meta.id}
            disabled={isEdit}
            onChange={(e) => {
              if (isEdit) return;
              setMeta((m) => ({ ...m, id: e.target.value }));
            }}
          />
          {isEdit ? (
            <div className="mt-1 text-xs opacity-60">
              En modo edición el ID está bloqueado.
            </div>
          ) : null}
        </label>

        <label className={`text-sm transition-opacity ${isEditingNode ? "opacity-45" : ""}`}>
          Nombre
          <input
            className={`mt-1 w-full border rounded px-2 py-1 ${isEditingNode ? "pointer-events-none bg-neutral-100" : ""}`}
            value={meta.name}
            onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
            disabled={isEditingNode}
          />
        </label>

        <label className={`text-sm transition-opacity ${isEditingNode ? "opacity-45" : ""}`}>
          Menú
          <select
            className={`mt-1 w-full border rounded px-2 py-1 ${isEditingNode ? "pointer-events-none bg-neutral-100" : ""}`}
            value={meta.side}
            onChange={(e) => setMeta((m) => ({ ...m, side: e.target.value }))}
            disabled={isEditingNode}
          >
            <option value="w">Blancas</option>
            <option value="b">Negras</option>
          </select>
        </label>

        <div className="mt-2 border-t pt-3">
          <div className="text-sm font-semibold">Nodo seleccionado</div>
          <div className="text-xs opacity-70">
            {selectedNode?.san ? selectedNode.san : "(root sin definir)"}{" "}
            <span className="opacity-60">({selectedNodeId})</span>
          </div>

          <button
            type="button"
            className="mt-3 w-full border rounded px-2 py-2 font-semibold"
            onClick={() => setIsEditingNode((v) => !v)}
            disabled={!selectedNode}
          >
            {isEditingNode ? "Cerrar edición" : "Editar nodo"}
          </button>

          {isEditingNode ? (
            <div className="mt-3 rounded-lg border border-black-400 bg-white p-3 shadow-sm text-black">
              <div className="text-sm font-semibold text-black">Edición del nodo</div>

              <label className="mt-2 block text-xs text-black">SAN</label>
              <input
                className="mt-1 w-full rounded border border-black-300 bg-white px-2 py-1 text-black placeholder:text-neutral-400"
                value={editSan}
                onChange={(e) => setEditSan(e.target.value)}
                placeholder="SAN (ej: Nf3)"
              />

              <label className="mt-3 block text-xs text-black">UCI</label>
              <input
                className="mt-1 w-full rounded border border-black-300 bg-white px-2 py-1 text-black placeholder:text-neutral-400"
                value={editUci}
                onChange={(e) => setEditUci(e.target.value)}
                placeholder="UCI (ej: g1f3)"
              />

              <button
                className="mt-2 w-full rounded border border-black-300 bg-white px-2 py-2 text-black hover:bg-black-50"
                onClick={autoFillUci}
                type="button"
              >
                Autocalcular UCI
              </button>

              <label className="mt-3 block text-xs text-black">Popularidad</label>
              <input
                type="number"
                className="mt-1 w-full rounded border border-black-300 bg-white px-2 py-1 text-black"
                value={editPopularity}
                onChange={(e) => setEditPopularity(e.target.value)}
              />

              <label className="mt-3 block text-xs text-black">Evaluación</label>
              <select
                className="mt-1 w-full rounded border border-black-300 bg-white px-2 py-1 text-black"
                value={editMistake}
                onChange={(e) => setEditMistake(e.target.value)}
              >
                <option value="">Normal</option>
                <option value="inaccuracy">Inexactitud</option>
                <option value="error">Error</option>
              </select>

              <label className="mt-3 block text-xs text-black">Notas</label>
              <textarea
                className="mt-1 min-h-[90px] w-full rounded border border-black-300 bg-white px-2 py-1 text-black placeholder:text-neutral-400"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ej: idea, plan, trampas, evaluación, etc."
              />

              <label className="mt-3 block text-xs text-black">Tags (separados por coma)</label>
              <input
                className="mt-1 w-full rounded border border-black-300 bg-white px-2 py-1 text-black placeholder:text-neutral-400"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Ej: avanzada, intercambio, tartakower"
              />

              <button
                className="mt-3 w-full rounded border border-black-300 bg-white px-2 py-2 font-semibold text-black hover:bg-black-50"
                onClick={saveNodeEdits}
                type="button"
              >
                Guardar cambios del nodo
              </button>

              <button
                className="mt-2 w-full rounded border border-red-700 bg-red-600 px-2 py-2 font-semibold text-white hover:bg-red-700"
                onClick={deleteSelectedNode}
                type="button"
              >
                Borrar nodo
              </button>

              <button
                className="mt-2 w-full rounded border border-black-300 bg-white px-2 py-2 text-black hover:bg-neutral-50"
                onClick={cancelEdit}
                type="button"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="mt-4 border-t pt-3 transition-opacity">
              <div className="text-sm font-semibold">
                {isRootUndefined ? "Definir primera jugada (root)" : "Agregar hijo"}
              </div>

              <input
                className="mt-1 w-full border rounded px-2 py-1"
                placeholder={isRootUndefined ? "SAN root (ej: e4, d4, ...)" : "SAN (ej: d4, Nf3, ...)"}
                value={newMoveSan}
                onChange={(e) => setNewMoveSan(e.target.value)}
              />

              <input
                className="mt-2 w-full border rounded px-2 py-1"
                placeholder="UCI (opcional, ej: d2d4)"
                value={newMoveUci}
                onChange={(e) => setNewMoveUci(e.target.value)}
              />

              <button className="mt-2 w-full border rounded px-2 py-2" onClick={addChild} type="button">
                {isRootUndefined ? "✓ Setear root" : "+ Agregar hijo"}
              </button>
            </div>
          )}
        </div>

        {!isEditingNode ? (
          <button
            disabled={saving}
            className="mt-auto w-full border rounded px-2 py-2 font-semibold"
            onClick={save}
          >
            {saving ? "Guardando..." : isEdit ? "Actualizar opening" : "Guardar opening"}
          </button>
        ) : (
          <div className="mt-auto rounded border border-dashed border-black-400 bg-white px-3 py-2 text-xs text-black">
            Terminá o cancelá la edición del nodo para volver a actualizar el opening.
          </div>
        )}

        {saveMsg ? <div className="text-xs mt-2 whitespace-pre-wrap">{saveMsg}</div> : null}
      </div>

      <div className="flex-1 flex min-h-0 h-full">
        <div className="flex-1 min-h-0 h-full">
          <OpeningTree root={tree} onSelectNodeId={setSelectedNodeId} />
        </div>

        <div className="w-[420px] border-l h-full">
          <ChessPanel path={previewPath} side={meta.side} />
          <SelectedNodeNotePanel selectedNode={selectedNode} />
        </div>
      </div>
    </main>
  );
}