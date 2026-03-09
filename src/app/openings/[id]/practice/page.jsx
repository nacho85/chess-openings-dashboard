import { notFound } from "next/navigation";
import { getOpening } from "@/server/openings-store";
import PracticeClient from "@/components/PracticeClient";

export default async function OpeningPracticePage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    const opening = await getOpening(id);

    const requestedSide = resolvedSearchParams?.side;
    const userSide =
      requestedSide === "w" || requestedSide === "b"
        ? requestedSide
        : opening.side || "w";

    return <PracticeClient opening={opening} userSide={userSide} />;
  } catch {
    return notFound();
  }
}
