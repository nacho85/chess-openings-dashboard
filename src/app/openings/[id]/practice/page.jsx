import { notFound } from "next/navigation";
import { getOpening, listOpeningsCached } from "@/server/openings-store";
import PracticeClient from "@/components/PracticeClient";

export default async function OpeningPracticePage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const openings = await listOpeningsCached();

  try {
    const opening = await getOpening(id);

    const requestedSide = resolvedSearchParams?.side;
    const userSide =
      requestedSide === "w" || requestedSide === "b"
        ? requestedSide
        : opening.side || "w";

    return <PracticeClient opening={opening} userSide={userSide} openings={openings} />;
  } catch {
    return notFound();
  }
}
