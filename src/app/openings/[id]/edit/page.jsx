import { notFound } from "next/navigation";
import { getOpening } from "@/server/openings-store";
import NewOpeningClient from "@/components/NewOpeningClient";

export default async function EditOpeningPage({ params }) {
  const { id } = await params;
  const opening = await getOpening(id);

  if (!opening) {
    notFound();
  }

  return <NewOpeningClient initialOpening={opening} mode="edit" />;
}