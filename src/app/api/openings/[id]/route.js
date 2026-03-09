export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getOpening,
  saveOpening,
  deleteOpening,
} from "@/server/openings-store";
import { isAdminRequest } from "@/server/admin";
import { revalidateTag } from "next/cache";

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
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const opening = {
      ...(body?.opening ?? body),
      id,
    };

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

export async function DELETE(req, { params }) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deleteOpening(id);
    revalidateTag("openings");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}