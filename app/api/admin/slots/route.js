import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Not logged in." }, { status: 401 });
}

// Admin: list ALL slots (past + future) with registration info.
export async function GET() {
  if (!isAdminRequest()) return unauthorized();
  try {
    const { rows } = await query(
      `SELECT s.id, s.start_utc, s.duration_min,
              r.id AS registration_id, r.email, r.name, r.mode, r.timezone, r.background,
              r.status, r.created_at AS registered_at
       FROM slots s
       LEFT JOIN registrations r ON r.slot_id = s.id
       ORDER BY s.start_utc ASC`
    );
    return NextResponse.json({
      slots: rows.map((row) => ({
        id: row.id,
        start: row.start_utc.toISOString(),
        durationMin: row.duration_min,
        registration: row.registration_id
          ? {
              id: row.registration_id,
              email: row.email,
              name: row.name,
              mode: row.mode,
              timezone: row.timezone,
              background: row.background,
              status: row.status || "pending",
              registeredAt: row.registered_at?.toISOString?.() ?? null,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/slots failed:", err);
    return NextResponse.json({ error: "Could not load slots." }, { status: 500 });
  }
}

// Admin: create one or more slots. Body: { starts: ["2026-08-10T09:00:00.000Z", ...], durationMin: 60 }
export async function POST(request) {
  if (!isAdminRequest()) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const durationMin = Math.min(Math.max(Number(body.durationMin) || 60, 15), 480);
  const starts = Array.isArray(body.starts) ? body.starts.slice(0, 200) : [];
  const valid = starts
    .map((s) => new Date(s))
    .filter((d) => !Number.isNaN(d.getTime()));

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid start times given." }, { status: 400 });
  }

  try {
    let created = 0;
    let skipped = 0;
    for (const start of valid) {
      const res = await query(
        `INSERT INTO slots (start_utc, duration_min)
         VALUES ($1, $2)
         ON CONFLICT ON CONSTRAINT slots_start_unique DO NOTHING`,
        [start.toISOString(), durationMin]
      );
      if (res.rowCount > 0) created += 1;
      else skipped += 1;
    }
    return NextResponse.json({ ok: true, created, skipped });
  } catch (err) {
    console.error("POST /api/admin/slots failed:", err);
    return NextResponse.json({ error: "Could not create slots." }, { status: 500 });
  }
}

// Admin: delete a slot (?id=123). Cascades to its registration if any.
export async function DELETE(request) {
  if (!isAdminRequest()) return unauthorized();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid slot id." }, { status: 400 });
  }
  try {
    await query(`DELETE FROM slots WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/slots failed:", err);
    return NextResponse.json({ error: "Could not delete slot." }, { status: 500 });
  }
}
