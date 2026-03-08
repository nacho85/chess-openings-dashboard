import { notFound } from "next/navigation";
import { openings } from "@/lib/openings";
import NewOpeningClient from "@/components/NewOpeningClient";

export default async function Page({ params }) {
  const { id } = await params;
  const opening = openings.find((o) => o.id === id);
  if (!opening) return notFound();

  return <NewOpeningClient initialOpening={opening} mode="edit" />;
}