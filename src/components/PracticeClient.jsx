"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import Sidebar from "@/components/Sidebar";
import PracticeBoard from "@/components/PracticeBoard";
import OpeningTree from "@/components/OpeningTree";
import {
  buildMovePathToNode,
  findNode,
  isSameMove,
  pickWeightedChild,
  uciToMove,
} from "@/components/openingTreeUtils";

function getStatusTone(status) {
  if (status === "correct") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "incorrect") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  if (status === "completed") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  }

  return "border-white/10 bg-white/5 text-neutral-200";
}

function getNextOptions(root, currentNodeId) {
  if (!root) return [];
  if (!currentNodeId) return [root];

  const currentNode = findNode(root, currentNodeId);
  return currentNode?.children || [];
}

function getHintNode(options = []) {
  if (!options.length) return null;

  return [...options].sort(
    (a, b) => (b?.popularity ?? 0) - (a?.popularity ?? 0)
  )[0];
}

function IconButton({
  title,
  onClick,
  children,
  disabled = false,
  active = false,
  variant = "default",
}) {
  const variantClass =
    variant === "success"
      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
      : active
      ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300"
      : "border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded border transition ${variantClass} ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
    >
      {children}
    </button>
  );
}

export default function PracticeClient({ opening, openings, userSide }) {
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [status, setStatus] = useState("playing");
  const [message, setMessage] = useState("Seguí la línea correcta.");
  const [wrongMove, setWrongMove] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [hintStage, setHintStage] = useState("none"); // none | hint | solution
  const [showMiniTree, setShowMiniTree] = useState(false);

  const path = useMemo(() => {
    if (!currentNodeId) {
      return { san: [], uci: [] };
    }

    return buildMovePathToNode(opening.root, currentNodeId);
  }, [opening.root, currentNodeId]);

  const chess = useMemo(() => {
    const c = new Chess();

    for (const uci of path.uci || []) {
      const move = uciToMove(uci);
      if (!move) continue;
      c.move(move);
    }

    return c;
  }, [path]);

  const nextOptions = useMemo(() => {
    return getNextOptions(opening.root, currentNodeId);
  }, [opening.root, currentNodeId]);

  const currentTurn = chess.turn();
  const isUsersTurn = currentTurn === userSide;

  const canInteract =
    status !== "completed" &&
    status !== "incorrect" &&
    isUsersTurn &&
    nextOptions.length > 0;

  const boardOrientation = flipped
    ? userSide === "b"
      ? "white"
      : "black"
    : userSide === "b"
    ? "black"
    : "white";

  const hintNode = useMemo(() => {
    if (!isUsersTurn || status === "completed" || status === "incorrect") {
      return null;
    }
    return getHintNode(nextOptions);
  }, [isUsersTurn, status, nextOptions]);

  const hintSquares = useMemo(() => {
    if (hintStage !== "hint" || !hintNode?.uci) return [];
    const move = uciToMove(hintNode.uci);
    return move?.from ? [move.from] : [];
  }, [hintStage, hintNode]);

  const solutionMove = useMemo(() => {
    if (hintStage !== "solution" || !hintNode?.uci) return null;
    return uciToMove(hintNode.uci);
  }, [hintStage, hintNode]);

  const resetHints = useCallback(() => {
    setHintStage("none");
  }, []);

  const markCompleted = useCallback(() => {
    setStatus("completed");
    setMessage("¡Resuelto! Llegaste al final del árbol.");
    resetHints();
  }, [resetHints]);

  const resetPractice = useCallback(() => {
    setCurrentNodeId(null);
    setStatus("playing");
    setMessage("Seguí la línea correcta.");
    setWrongMove(null);
    setLastMove(null);
    setHintStage("none");
  }, []);

  const clearError = useCallback(() => {
    setStatus("playing");
    setMessage("Reintentá.");
    setWrongMove(null);
    resetHints();
  }, [resetHints]);

  const cycleHint = useCallback(() => {
    if (!hintNode) return;

    setHintStage((prev) => {
      if (prev === "none") return "hint";
      if (prev === "hint") return "solution";
      return "none";
    });
  }, [hintNode]);

  const applyMachineMove = useCallback(() => {
    const options = getNextOptions(opening.root, currentNodeId);

    if (!options.length) {
      markCompleted();
      return;
    }

    const choice = pickWeightedChild(options);

    if (!choice) {
      markCompleted();
      return;
    }

    const move = uciToMove(choice.uci);

    setCurrentNodeId(choice.id);
    setLastMove(move);
    setWrongMove(null);
    resetHints();

    if (!choice.children?.length) {
      setStatus("completed");
      setMessage("¡Resuelto! Llegaste al final del árbol.");
      return;
    }

    setStatus("playing");
    setMessage(`La máquina jugó ${choice.san}. Tu turno.`);
  }, [opening.root, currentNodeId, markCompleted, resetHints]);

  const handlePieceDrop = useCallback(
    (dropData) => {
      const sourceSquare = dropData?.sourceSquare;
      const targetSquare = dropData?.targetSquare;
      const piece = dropData?.piece;

      if (!canInteract) return false;
      if (!sourceSquare || !targetSquare) return false;
      if (sourceSquare === targetSquare) return false;

      const attemptedMove = {
        from: sourceSquare,
        to: targetSquare,
      };

      const pieceCode =
        typeof piece === "string"
          ? piece
          : piece?.pieceType || piece?.type || piece?.notation || "";

      const isPawn =
        typeof pieceCode === "string" &&
        pieceCode.toLowerCase().includes("p");

      const promotionRank =
        (userSide === "w" && targetSquare[1] === "8") ||
        (userSide === "b" && targetSquare[1] === "1");

      if (isPawn && promotionRank) {
        attemptedMove.promotion = "q";
      }

      const options = getNextOptions(opening.root, currentNodeId);

      const matchedNode = options.find((node) => {
        const expectedMove = uciToMove(node.uci);
        return isSameMove(attemptedMove, expectedMove);
      });

      if (!matchedNode) {
        setStatus("incorrect");
        setWrongMove(attemptedMove);
        setMessage("Incorrecto. Esa jugada no sigue la línea cargada.");
        resetHints();
        return false;
      }

      setCurrentNodeId(matchedNode.id);
      setLastMove(uciToMove(matchedNode.uci));
      setWrongMove(null);
      resetHints();

      if (!matchedNode.children?.length) {
        setStatus("completed");
        setMessage("¡Resuelto! Llegaste al final del árbol.");
      } else {
        setStatus("correct");
        setMessage("¡Correcto!");
      }

      return true;
    },
    [canInteract, opening.root, currentNodeId, userSide, resetHints]
  );

  useEffect(() => {
    if (status === "completed") return;
    if (status === "incorrect") return;
    if (isUsersTurn) return;

    const timeout = setTimeout(() => {
      const options = getNextOptions(opening.root, currentNodeId);

      if (!options.length) {
        markCompleted();
        return;
      }

      applyMachineMove();
    }, 450);

    return () => clearTimeout(timeout);
  }, [
    status,
    isUsersTurn,
    opening.root,
    currentNodeId,
    applyMachineMove,
    markCompleted,
  ]);

  const hintTitle =
    hintStage === "none"
      ? "Pista"
      : hintStage === "hint"
      ? "Mostrar solución"
      : "Ocultar pista";

  return (
    <main className="flex h-screen">
      <Sidebar activeId={opening.id} openings={openings} />

      <section className="flex-1 min-h-0 h-full overflow-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm uppercase tracking-wide text-neutral-400">
                Práctica
              </div>
              <h1 className="text-2xl font-semibold">{opening.name}</h1>
              <p className="text-sm text-neutral-400">
                Jugás con{" "}
                <span className="font-medium text-neutral-200">
                  {userSide === "w" ? "blancas" : "negras"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/openings/${opening.id}`}
                className="rounded border px-3 py-2 text-sm hover:bg-white/5"
              >
                Volver al árbol
              </Link>
            </div>
          </div>

          <div
            className={`rounded-xl border px-4 py-3 text-sm ${getStatusTone(
              status
            )}`}
          >
            {message}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border bg-neutral-950/40">
              <PracticeBoard
                fen={chess.fen()}
                boardOrientation={boardOrientation}
                lastMove={lastMove}
                wrongMove={wrongMove}
                disabled={!canInteract}
                onPieceDrop={handlePieceDrop}
                hintSquares={hintSquares}
                solutionMove={solutionMove}
              />
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border p-4">
                <div className="mb-2 text-sm font-semibold">Estado</div>

                <div className="space-y-2 text-sm text-neutral-300">
                  <div>
                    Turno actual:{" "}
                    <span className="font-medium text-neutral-100">
                      {currentTurn === "w" ? "Blancas" : "Negras"}
                    </span>
                  </div>

                  <div>
                    Te toca:{" "}
                    <span className="font-medium text-neutral-100">
                      {isUsersTurn && status !== "completed" ? "Sí" : "No"}
                    </span>
                  </div>

                  <div>
                    Siguientes opciones:{" "}
                    <span className="font-medium text-neutral-100">
                      {nextOptions.length}
                    </span>
                  </div>

                  <div>
                    Resultado:{" "}
                    <span className="font-medium text-neutral-100">
                      {status === "playing" && "En curso"}
                      {status === "correct" && "Correcto"}
                      {status === "incorrect" && "Incorrecto"}
                      {status === "completed" && "Resuelto"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="mb-2 text-sm font-semibold">Línea seguida</div>

                <div className="min-h-24 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                  {path.san?.length
                    ? path.san.join(" ")
                    : "Todavía no hay jugadas."}
                </div>
              </div>

              <div className="rounded-2xl border p-4 text-sm text-neutral-400">
                La máquina elige entre los nodos cargados. Si no hay más hijos, la
                práctica termina como resuelta.
              </div>

              <div className="rounded-2xl border p-4">
                <div className="flex items-center gap-2">
                  <IconButton
                    title="Reintentar"
                    onClick={clearError}
                    disabled={status !== "incorrect"}
                    variant={status === "incorrect" ? "success" : "default"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-9.36L1 10" />
                    </svg>
                  </IconButton>

                  <IconButton title="Reiniciar" onClick={resetPractice}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <line x1="12" y1="2" x2="12" y2="12" />
                      <path d="M5.5 7.5a9 9 0 1 0 13 0" />
                    </svg>
                  </IconButton>

                  <IconButton
                    title={hintTitle}
                    onClick={cycleHint}
                    disabled={!hintNode}
                    active={hintStage !== "none"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                      <path d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1 1 1.8V17h6v-.5c0-.8.4-1.4 1-1.8A7 7 0 0 0 12 2z" />
                    </svg>
                  </IconButton>

                  <IconButton
                    title="Girar tablero"
                    onClick={() => setFlipped((v) => !v)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 0 1 15-6" />
                      <polyline points="18 2 18 6 14 6" />
                      <path d="M21 12a9 9 0 0 1-15 6" />
                      <polyline points="6 22 6 18 10 18" />
                    </svg>
                  </IconButton>

                  <IconButton
                    title={showMiniTree ? "Ocultar árbol" : "Mostrar árbol"}
                    onClick={() => setShowMiniTree((v) => !v)}
                    active={showMiniTree}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="6" cy="6" r="2" />
                      <circle cx="18" cy="6" r="2" />
                      <circle cx="12" cy="18" r="2" />
                      <path d="M8 6h8" />
                      <path d="M7 7.5 11 16" />
                      <path d="M17 7.5 13 16" />
                    </svg>
                  </IconButton>
                </div>

                <div className="mt-3 text-xs text-neutral-400">
                  {hintStage === "none" &&
                    "Pista: resalta la pieza correcta. Segundo click: muestra la solución."}
                  {hintStage === "hint" &&
                    "Pista activa: se resaltó la pieza que corresponde mover."}
                  {hintStage === "solution" &&
                    "Solución activa: se muestra la flecha con la jugada sugerida."}
                </div>
              </div>

              {showMiniTree && (
                <div className="rounded-2xl border p-3">
                  <div className="mb-3 text-sm font-semibold">Árbol miniatura</div>

                  <div className="h-[260px] overflow-hidden rounded-xl border">
                    <OpeningTree
                      root={opening.root}
                      selectedNodeId={currentNodeId}
                      interactive={false}
                      showControls={false}
                    />
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}