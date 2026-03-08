"use client";
import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, ChessboardProvider } from "react-chessboard";

export default function ChessPanel({ path, side }) {
  const [flipped, setFlipped] = useState(false);

  const computed = useMemo(() => {
    const chess = new Chess();
    const uciList = Array.isArray(path?.uci) ? path.uci : [];
    const sanList = Array.isArray(path?.san) ? path.san : [];
    let last = null;

    for (const uci of uciList) {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;
      last = chess.move(promotion ? { from, to, promotion } : { from, to });
      if (!last) break;
    }

    const customSquareStyles =
      last?.from && last?.to
        ? {
            [last.from]: { boxShadow: "inset 0 0 0 4px rgba(80,160,255,0.55)" },
            [last.to]: { boxShadow: "inset 0 0 0 4px rgba(80,160,255,0.55)" },
          }
        : {};

    return {
      fen: chess.fen(),
      sanLine: sanList.join(" "),
      customSquareStyles,
    };
  }, [path]);

  const boardOptions = useMemo(
    () => ({
      position: computed.fen,
      arePiecesDraggable: false,
      customSquareStyles: computed.customSquareStyles,

      // 👇 esto es lo que suele activar la “slide animation”
      // si tu versión no lo reconoce, simplemente lo ignora (no rompe)
      animationDuration: 250,
      boardOrientation: flipped
        ? side === "b" ? "white" : "black"
        : side === "b" ? "black" : "white"
    }),
    [computed.fen, computed.customSquareStyles, flipped, side]
  );

  return (
    <div className="w-[420px] border-l border-neutral-800 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Posición</h2>
      </div>
      <br/>
      <button
        onClick={() => setFlipped(v => !v)}
        className="flex items-center hover:bg-neutral-800 cursor-pointer"
        title="Rotate board"
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
      </button>
      <div className="mt-3" style={{ width: 380 }}>
        {/* key fuerza remount cuando cambia la fen */}
        <ChessboardProvider options={boardOptions}>
          <Chessboard />
        </ChessboardProvider>
      </div>

      <div className="mt-3 text-xs text-neutral-300 whitespace-pre-wrap">
        {computed.sanLine || "Click en una jugada para ver la posición."}
      </div>

      {computed.error ? <div className="mt-2 text-xs text-red-300">{computed.error}</div> : null}
    </div>
  );
}