import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { sendConfirmationEmails } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slotId = Number(body.slotId);
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim().slice(0, 120);
  const mode = body.mode === "in_person" ? "in_person" : body.mode === "remote" ? "remote" : null;
  const timezone = String(body.timezone || "Europe/Berlin").slice(0, 64);
  const background = String(body.background || "").trim().slice(0, 200);

  if (!Number.isInteger(slotId) || slotId <= 0) {
    return NextResponse.json({ error: "Please pick a time slot." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json(
      { error: "Please choose how you want to take part (remote or in person)." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    const pool = getPool();

    // Confirm the slot exists and is in the future.
    const slotRes = await pool.query(
      `SELECT id, start_utc, duration_min FROM slots WHERE id = $1 AND start_utc > now()`,
      [slotId]
    );
    if (slotRes.rows.length === 0) {
      return NextResponse.json(
        { error: "That slot no longer exists or is in the past. Please pick another one." },
        { status: 409 }
      );
    }
    const slot = slotRes.rows[0];

    let inserted;
    try {
      inserted = await pool.query(
        `INSERT INTO registrations (slot_id, email, name, mode, timezone, background)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [slotId, email, name, mode, timezone, background]
      );
    } catch (err) {
      if (err.code === "23505") {
        if (String(err.constraint).includes("email")) {
          return NextResponse.json(
            { error: "This email is already registered for a session. You can only book one slot — reply to your confirmation email if you need to change it." },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "Oops — someone just grabbed that slot. Please pick another one." },
          { status: 409 }
        );
      }
      throw err;
    }

    const registration = {
      id: inserted.rows[0].id,
      email,
      name,
      mode,
      timezone,
      background,
      startIso: slot.start_utc.toISOString(),
      durationMin: slot.duration_min,
    };

    // Fire the emails; a failure here should not undo the booking.
    const emailResult = await sendConfirmationEmails(registration);

    return NextResponse.json({
      ok: true,
      registrationId: registration.id,
      emailSent: Boolean(emailResult?.sent),
    });
  } catch (err) {
    console.error("POST /api/register failed:", err);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 }
    );
  }
}
