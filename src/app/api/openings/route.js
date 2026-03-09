export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listOpenings, saveOpening } from "@/server/openings-store";

function isAdmin(req) {
  if (process.env.NODE_ENV !== "production") return true;

  const cookie = req.headers.get("cookie") || "";
  const adminSecret = process.env.ADMIN_SECRET;
  return !!adminSecret && cookie.includes(`opening_admin=${adminSecret}`);
}

export async function GET() {
  try {
    const openings = await listOpenings();
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
    if (!isAdmin(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const opening = body?.opening;

    const result = await saveOpening(opening);

    return NextResponse.json({ ok: true, file: result.key });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const opening = body?.opening;

    const result = await saveOpening(opening);

    return NextResponse.json({ ok: true, file: result.key });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
