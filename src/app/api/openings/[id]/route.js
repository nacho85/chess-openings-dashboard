export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getOpening,
  saveOpening,
  deleteOpening,
} from "@/server/openings-store";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const opening = await getOpening(id);
    return NextResponse.json({ ok: true, opening });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const opening = {
      ...(body?.opening ?? body),
      id,
    };

    await saveOpening(opening);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    await deleteOpening(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}