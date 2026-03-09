import { notFound } from "next/navigation";
import { getOpening } from "@/server/openings-store";
import OpeningClient from "./OpeningClient";

export default async function OpeningPage({ params }) {
  const { id } = await params;

  let opening;

  try {
    opening = await getOpening(id);
  } catch (error) {
    console.error("Opening page error:", error);
    notFound();
  }

  return <OpeningClient opening={opening} />;
}