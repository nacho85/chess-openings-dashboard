export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { password } = await req.json();

    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_SECRET no configurado" },
        { status: 500 }
      );
    }

    if (password !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Clave incorrecta" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("opening_admin", process.env.ADMIN_SECRET, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}