"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard, ChessboardProvider } from "react-chessboard";

function squareToPixels(square, orientation, boardSize) {
  if (!square || square.length < 2 || !boardSize) return null;

  const squareSize = boardSize / 8;
  const file = square.charCodeAt(0) - 97; // a=0 ... h=7
  const rank = Number(square[1]); // 1..8

  if (Number.isNaN(file) || Number.isNaN(rank)) return null;

  let col;
  let row;

  if (orientation === "black") {
    col = 7 - file;
    row = rank - 1;
  } else {
    col = file;
    row = 8 - rank;
  }

  return {
    left: col * squareSize,
    top: row * squareSize,
    centerX: col * squareSize + squareSize / 2,
    centerY: row * squareSize + squareSize / 2,
    squareSize,
  };
}

function HintOverlay({
  boardOrientation,
  hintSquares = [],
  solutionMove = null,
  boardSize,
}) {
  const hintSquare = hintSquares?.[0] || null;

  const hintPos = squareToPixels(hintSquare, boardOrientation, boardSize);
  const fromPos = squareToPixels(solutionMove?.from, boardOrientation, boardSize);
  const toPos = squareToPixels(solutionMove?.to, boardOrientation, boardSize);

  if (!boardSize) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {hintPos ? (
        <div
          className="absolute rounded-full border-4 border-yellow-400"
          style={{
            left: hintPos.left + 6,
            top: hintPos.top + 6,
            width: hintPos.squareSize - 12,
            height: hintPos.squareSize - 12,
            boxShadow: "0 0 0 2px rgba(250,204,21,0.25)",
          }}
        />
      ) : null}

      {solutionMove && fromPos && toPos ? (
        <>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${boardSize} ${boardSize}`}
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id="practice-arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="rgba(250,204,21,0.95)" />
              </marker>
            </defs>

            <line
              x1={fromPos.centerX}
              y1={fromPos.centerY}
              x2={toPos.centerX}
              y2={toPos.centerY}
              stroke="rgba(250,204,21,0.95)"
              strokeWidth="6"
              strokeLinecap="round"
              markerEnd="url(#practice-arrowhead)"
            />
          </svg>

          <div
            className="absolute rounded-full border-4 border-yellow-400"
            style={{
              left: fromPos.left + 6,
              top: fromPos.top + 6,
              width: fromPos.squareSize - 12,
              height: fromPos.squareSize - 12,
              boxShadow: "0 0 0 2px rgba(250,204,21,0.25)",
            }}
          />

          <div
            className="absolute rounded-full border-4 border-emerald-400"
            style={{
              left: toPos.left + 6,
              top: toPos.top + 6,
              width: toPos.squareSize - 12,
              height: toPos.squareSize - 12,
              boxShadow: "0 0 0 2px rgba(52,211,153,0.25)",
            }}
          />
        </>
      ) : null}
    </div>
  );
}

export default function PracticeBoard({
  fen,
  boardOrientation,
  lastMove = null,
  wrongMove = null,
  disabled = false,
  onPieceDrop,
  hintSquares = [],
  solutionMove = null,
}) {
  const wrapperRef = useRef(null);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateSize = () => {
      const nextSize = wrapperRef.current?.offsetWidth || 0;
      setBoardSize(nextSize);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(wrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const customSquareStyles = useMemo(() => {
    const styles = {};

    if (lastMove?.from) {
      styles[lastMove.from] = {
        ...(styles[lastMove.from] || {}),
        boxShadow: "inset 0 0 0 4px rgba(80,160,255,0.55)",
      };
    }

    if (lastMove?.to) {
      styles[lastMove.to] = {
        ...(styles[lastMove.to] || {}),
        boxShadow: "inset 0 0 0 4px rgba(80,160,255,0.55)",
      };
    }

    if (wrongMove?.from) {
      styles[wrongMove.from] = {
        ...(styles[wrongMove.from] || {}),
        boxShadow: "inset 0 0 0 4px rgba(255,80,80,0.7)",
      };
    }

    if (wrongMove?.to) {
      styles[wrongMove.to] = {
        ...(styles[wrongMove.to] || {}),
        boxShadow: "inset 0 0 0 4px rgba(255,80,80,0.7)",
      };
    }

    return styles;
  }, [lastMove, wrongMove]);

  const boardOptions = useMemo(
    () => ({
      position: fen,
      boardOrientation,
      arePiecesDraggable: !disabled,
      onPieceDrop,
      customSquareStyles,
      animationDuration: 200,
    }),
    [fen, boardOrientation, disabled, onPieceDrop, customSquareStyles]
  );

  return (
    <div className="w-full p-4">
      <div ref={wrapperRef} className="relative w-full">
        <ChessboardProvider options={boardOptions}>
          <Chessboard />
        </ChessboardProvider>

        <HintOverlay
          boardOrientation={boardOrientation}
          hintSquares={hintSquares}
          solutionMove={solutionMove}
          boardSize={boardSize}
        />
      </div>
    </div>
  );
}