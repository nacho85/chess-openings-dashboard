import Link from "next/link";
import { listOpenings } from "@/server/openings-store";
import Sidebar from "@/components/Sidebar";

function OpeningPracticeLink({ opening }) {
  const side = opening.side ?? "w";

  return (
    <Link
      href={`/openings/${opening.id}/practice?side=${side}`}
      className="rounded-xl border p-4 transition hover:bg-white/5"
    >
      <div className="text-base font-medium">{opening.name}</div>
      <div className="mt-1 text-sm text-neutral-400">
        Practicar con {side === "w" ? "blancas" : "negras"}
      </div>
    </Link>
  );
}

export default async function PracticePage() {
  const openings = await listOpenings();
  const whites = openings.filter((o) => (o.side ?? "w") === "w");
  const blacks = openings.filter((o) => o.side === "b");

  return (
    <main className="flex h-screen">
      <Sidebar />

      <section className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
          <header>
            <div className="text-sm uppercase tracking-wide text-neutral-400">
              Practice
            </div>
            <h1 className="text-3xl font-semibold">Elegí qué querés practicar</h1>
            <p className="mt-2 text-neutral-400">
              Por ahora la máquina decide sus jugadas en base a los nodos cargados
              en cada árbol.
            </p>
          </header>

          <section className="space-y-4">
            <div className="text-lg font-semibold">Blancas</div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {whites.map((opening) => (
                <OpeningPracticeLink key={opening.id} opening={opening} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="text-lg font-semibold">Negras</div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {blacks.map((opening) => (
                <OpeningPracticeLink key={opening.id} opening={opening} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
