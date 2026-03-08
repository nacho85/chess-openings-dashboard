import { openings } from "@/lib/openings";
import OpeningClient from "./OpeningClient";

export default async function OpeningPage({ params }) {
  const { id } = await params;

  const opening = openings.find((o) => o.id === id);
  if (!opening) return <div>Opening not found</div>;

  return <OpeningClient opening={opening} />;
}