export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/server/admin";

export async function GET(req) {
  return NextResponse.json({
    ok: true,
    isAdmin: isAdminRequest(req),
  });
}