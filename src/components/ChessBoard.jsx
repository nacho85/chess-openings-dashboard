"use client";

import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessBoard({ moves }) {

  const chess = new Chess();

  moves.forEach(m => chess.move(m));

  return (
    <div style={{ width: 400 }}>
      <Chessboard position={chess.fen()} />
    </div>
  );
}