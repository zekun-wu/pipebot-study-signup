import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Admin: cancel a registration (?id=123) — frees the slot again.
export async function DELETE(request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid registration id." }, { status: 400 });
  }
  try {
    await query(`DELETE FROM registrations WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/registrations failed:", err);
    return NextResponse.json({ error: "Could not cancel registration." }, { status: 500 });
  }
}
