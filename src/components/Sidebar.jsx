"use client";

import Link from "next/link";
import { useMemo } from "react";
import useAdmin from "@/hooks/useAdmin";

function OpeningItem({ opening, activeId }) {
  const side = opening.side ?? "w";
  const isActive = activeId === opening.id;

  const base = "p-2 rounded border transition";
  const theme =
    side === "w"
      ? "bg-white text-black border-black/15"
      : "bg-black text-white border-white/15";

  const hover =
    side === "w"
      ? "hover:bg-black hover:text-white"
      : "hover:bg-white hover:text-black";

  const activeRing =
    isActive ? (side === "w" ? "ring-2 ring-black" : "ring-2 ring-white") : "";

  return (
    <Link
      href={`/openings/${opening.id}`}
      className={`${base} ${theme} ${hover} ${activeRing}`}
    >
      {opening.name}
    </Link>
  );
}

export default function Sidebar({ activeId, openings }) {
  const { isAdmin } = useAdmin();

  const whites = useMemo(
    () => openings.filter((o) => (o.side ?? "w") === "w"),
    [openings]
  );

  const blacks = useMemo(
    () => openings.filter((o) => o.side === "b"),
    [openings]
  );

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <aside className="w-72 border-r p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Aperturas</h2>
      </div>

      <div className="flex flex-col gap-2">
        {isAdmin ? (
          <Link href="/new" className="text-sm border px-3 py-2 rounded text-center">
            + Nuevo
          </Link>
        ) : null}
        <Link href="/practice" className="text-sm border px-3 py-2 rounded text-center">
          Practicar
        </Link>
      </div>

      <nav className="flex flex-col gap-4">
        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Blancas
          </div>

          <div className="flex flex-col gap-2">
            {whites.length ? (
              whites.map((o) => (
                <OpeningItem key={o.id} opening={o} activeId={activeId} />
              ))
            ) : (
              <div className="text-xs text-neutral-500">Sin aperturas</div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Negras
          </div>

          <div className="flex flex-col gap-2">
            {blacks.length ? (
              blacks.map((o) => (
                <OpeningItem key={o.id} opening={o} activeId={activeId} />
              ))
            ) : (
              <div className="text-xs text-neutral-500">Sin aperturas</div>
            )}
          </div>
        </section>
      </nav>
      <div className="mt-auto mb-2">
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="text-sm border px-3 py-2 rounded text-center cursor-pointer block w-full"
          >
            Salir admin
          </button>
        ) : (
          <Link href="/admin" className="text-sm border px-3 py-2 rounded text-center block w-full">
            Admin
          </Link>
        )}
      </div>
    </aside>
  );
}