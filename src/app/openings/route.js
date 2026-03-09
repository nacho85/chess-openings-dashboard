import { NextResponse } from "next/server";
import { loadOpeningsFromS3 } from "@/lib/s3Openings";

export async function GET() {
  const openings = await loadOpeningsFromS3();

  return NextResponse.json({
    ok: true,
    openings,
  });
}