import { openings } from "@/lib/openings";
import PracticeClient from "@/components/PracticeClient";

export default async function OpeningPracticePage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const opening = openings.find((o) => o.id === id);
  if (!opening) return <div>Opening not found</div>;

  const requestedSide = resolvedSearchParams?.side;
  const userSide =
    requestedSide === "w" || requestedSide === "b"
      ? requestedSide
      : opening.side || "w";

  return <PracticeClient opening={opening} userSide={userSide} />;
}