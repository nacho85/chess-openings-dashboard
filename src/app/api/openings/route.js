export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listOpeningsCached, saveOpening } from "@/server/openings-store";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/server/admin";

export async function GET() {
  try {
    const openings = await listOpeningsCached();
    return NextResponse.json({ ok: true, openings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const opening = body?.opening;

    await saveOpening(opening);
    revalidateTag("openings");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const opening = body?.opening;

    const result = await saveOpening(opening);
    revalidateTag("openings");

    return NextResponse.json({ ok: true, file: result.key });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
