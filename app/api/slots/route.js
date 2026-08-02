import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public: list upcoming slots that are still free.
export async function GET() {
  try {
    const { rows } = await query(
      `SELECT s.id, s.start_utc, s.duration_min
       FROM slots s
       LEFT JOIN registrations r ON r.slot_id = s.id
       WHERE r.id IS NULL AND s.start_utc > now()
       ORDER BY s.start_utc ASC`
    );
    return NextResponse.json({
      slots: rows.map((row) => ({
        id: row.id,
        start: row.start_utc.toISOString(),
        durationMin: row.duration_min,
      })),
    });
  } catch (err) {
    console.error("GET /api/slots failed:", err);
    return NextResponse.json({ error: "Could not load slots." }, { status: 500 });
  }
}
