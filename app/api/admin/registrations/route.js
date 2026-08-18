import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { sendDecisionEmail } from "@/lib/email";

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

// Admin: confirm or decline a pending registration.
// Body: { id: 123, decision: "confirmed" | "rejected" }
// - confirmed: marks the registration confirmed and sends the full confirmation email.
// - rejected: sends the "recruitment limit reached" email, then frees the slot
//   (same effect as cancelling — the registration row is removed).
export async function PATCH(request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = Number(body.id);
  const decision = body.decision === "confirmed" ? "confirmed" : body.decision === "rejected" ? "rejected" : null;
  if (!Number.isInteger(id) || id <= 0 || !decision) {
    return NextResponse.json({ error: "Invalid decision request." }, { status: 400 });
  }

  try {
    const { rows } = await query(
      `SELECT r.id, r.email, r.name, r.mode, r.timezone, r.signature,
              s.start_utc, s.duration_min
       FROM registrations r
       JOIN slots s ON s.id = r.slot_id
       WHERE r.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }
    const row = rows[0];
    const registration = {
      id: row.id,
      email: row.email,
      name: row.name,
      mode: row.mode,
      timezone: row.timezone,
      signature: row.signature,
      startIso: row.start_utc.toISOString(),
      durationMin: row.duration_min,
    };

    if (decision === "confirmed") {
      await query(`UPDATE registrations SET status = 'confirmed' WHERE id = $1`, [id]);
      const emailResult = await sendDecisionEmail(registration, "confirmed");
      return NextResponse.json({ ok: true, decision, emailSent: Boolean(emailResult?.sent) });
    }

    // rejected: free the slot (delete the registration) and let them know.
    await query(`DELETE FROM registrations WHERE id = $1`, [id]);
    const emailResult = await sendDecisionEmail(registration, "rejected");
    return NextResponse.json({ ok: true, decision, emailSent: Boolean(emailResult?.sent) });
  } catch (err) {
    console.error("PATCH /api/admin/registrations failed:", err);
    return NextResponse.json({ error: "Could not record the decision." }, { status: 500 });
  }
}
