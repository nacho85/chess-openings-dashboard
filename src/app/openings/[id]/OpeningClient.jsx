"use client";

import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import OpeningTree from "@/components/OpeningTree";
import ChessPanel from "@/components/ChessPanel";
import Link from "next/link";
import SelectedNodeNotePanel from "@/components/SelectedNodeNotePanel";
import { findNode } from "@/components/openingTreeUtils";
import useAdmin from "@/hooks/useAdmin";

export default function OpeningClient({ opening, openings }) {
  const [selectedPath, setSelectedPath] = useState({ uci: [], san: [] });
  const [hoverPath, setHoverPath] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(opening?.root?.id ?? null);
  const { isAdmin } = useAdmin();

  const selectedNode = useMemo(
    () => findNode(opening?.root, selectedNodeId),
    [opening?.root, selectedNodeId]
  );

  const pathToShow = hoverPath ?? selectedPath;

  return (
    <main className="flex h-screen">
      <Sidebar activeId={opening.id} openings={openings}/>

      <section className="flex-1 flex min-h-0 h-full">
        <div className="flex-1 min-h-0 h-full">
          <div className="sticky top-3 left-3 z-10 ml-2 flex gap-2">
            {isAdmin ? (
              <Link
                href={`/openings/${opening.id}/edit`}
                className="rounded border px-3 py-1 text-sm bg-neutral-900 hover:opacity-80"
              >
                Editar
              </Link>
            ) : null}

            <Link
              href={`/openings/${opening.id}/practice?side=${opening.side ?? "w"}`}
              className="rounded border px-3 py-1 text-sm bg-neutral-900 hover:opacity-80"
            >
              Practicar
            </Link>
          </div>

          <OpeningTree
            root={opening.root}
            onSelectMoves={setSelectedPath}
            onSelectNodeId={setSelectedNodeId}
            onHoverMoves={setHoverPath}
          />
        </div>

        <div className="w-[420px] border-l h-full">
          <ChessPanel path={pathToShow} side={opening.side} />
          <SelectedNodeNotePanel selectedNode={selectedNode} />
        </div>
      </section>
    </main>
  );
}