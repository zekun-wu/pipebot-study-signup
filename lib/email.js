import { Resend } from "resend";

const STUDY_TITLE = "AI Agents & Workflows User Study";
const IN_PERSON_ADDRESS = "Room 3.12, Building E1 7, Uni-Campus N 1, 66123 Saarbrücken, Germany";

function fmtInTz(dateIso, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone,
    }).format(new Date(dateIso));
  } catch {
    return new Date(dateIso).toUTCString();
  }
}

function icsTimestamp(date) {
  return new Date(date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function buildIcs({ startIso, durationMin, mode, uid }) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const location =
    mode === "in_person" ? IN_PERSON_ADDRESS : "Microsoft Teams (link will follow)";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Agent Study//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${uid}@ai-agent-study`,
    `DTSTAMP:${icsTimestamp(new Date())}`,
    `DTSTART:${icsTimestamp(start)}`,
    `DTEND:${icsTimestamp(end)}`,
    `SUMMARY:${STUDY_TITLE}`,
    `LOCATION:${location.replace(/,/g, "\\,")}`,
    "DESCRIPTION:Your session for the AI Agents & Workflows user study.",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function participantHtml({ name, startIso, timezone, mode }) {
  const when = fmtInTz(startIso, timezone);
  const modeBlock =
    mode === "in_person"
      ? `<p><strong>How to take part — in person 🏛️</strong><br/>
         Please come to:<br/>
         <strong>${IN_PERSON_ADDRESS}</strong><br/>
         As promised: in-person participants at Saarland University get a <strong>bonus chocolate</strong> on top of the gift card. 🍫</p>`
      : `<p><strong>How to take part — remote 💻</strong><br/>
         The session runs over <strong>Microsoft Teams</strong>. Please make sure Teams is
         <strong>installed on your computer before the session</strong> and that you're comfortable
         joining and managing a remote meeting (screen sharing included).
         We'll email you the meeting link before your session.</p>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
    <h2 style="color:#4f46e5;">You're in! 🎉</h2>
    <p>Hi ${name || "there"},</p>
    <p>Thanks for signing up for the <strong>${STUDY_TITLE}</strong>. Your session is confirmed:</p>
    <div style="background:#eef2ff;border-radius:10px;padding:16px 20px;margin:16px 0;">
      <p style="margin:4px 0;"><strong>📅 When:</strong> ${when} <span style="color:#6b7280;">(${timezone})</span></p>
      <p style="margin:4px 0;"><strong>⏱️ Duration:</strong> about 1 hour</p>
      <p style="margin:4px 0;"><strong>🎁 Compensation:</strong> €15 Amazon gift card</p>
    </div>
    ${modeBlock}
    <p>A calendar invite is attached so you can add the session to your calendar.</p>
    <p>If you need to reschedule or cancel, just reply to this email.</p>
    <p>See you soon!<br/>The study team</p>
  </div>`;
}

function adminHtml({ name, email, startIso, timezone, mode, background }) {
  const whenBerlin = fmtInTz(startIso, "Europe/Berlin");
  const whenTheirs = fmtInTz(startIso, timezone);
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;">
    <h3>New study registration ✅</h3>
    <table cellpadding="6" style="border-collapse:collapse;">
      <tr><td><strong>Name</strong></td><td>${name || "—"}</td></tr>
      <tr><td><strong>Email</strong></td><td>${email}</td></tr>
      <tr><td><strong>Slot (Berlin time)</strong></td><td>${whenBerlin}</td></tr>
      <tr><td><strong>Slot (participant's tz)</strong></td><td>${whenTheirs} (${timezone})</td></tr>
      <tr><td><strong>Mode</strong></td><td>${mode === "in_person" ? "In person 🏛️ (remember the chocolate 🍫)" : "Remote 💻 (send a Teams link before the session)"}</td></tr>
      <tr><td><strong>Background</strong></td><td>${background || "—"}</td></tr>
    </table>
  </div>`;
}

export async function sendConfirmationEmails(registration) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "AI Agent Study <onboarding@resend.dev>";
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping confirmation emails.");
    return { sent: false, reason: "missing_api_key" };
  }

  const resend = new Resend(apiKey);
  const ics = buildIcs({
    startIso: registration.startIso,
    durationMin: registration.durationMin,
    mode: registration.mode,
    uid: `reg-${registration.id}`,
  });
  const icsAttachment = {
    filename: "study-session.ics",
    content: Buffer.from(ics).toString("base64"),
  };

  const results = { sent: true, participant: null, admin: null };

  try {
    results.participant = await resend.emails.send({
      from,
      to: registration.email,
      subject: "✅ Your study session is confirmed — AI Agents & Workflows Study",
      html: participantHtml(registration),
      attachments: [icsAttachment],
    });
  } catch (err) {
    console.error("[email] participant email failed:", err);
    results.participant = { error: String(err) };
  }

  if (adminEmail) {
    try {
      results.admin = await resend.emails.send({
        from,
        to: adminEmail,
        subject: `📥 New registration: ${registration.email} (${registration.mode === "in_person" ? "in person" : "remote"})`,
        html: adminHtml(registration),
      });
    } catch (err) {
      console.error("[email] admin email failed:", err);
      results.admin = { error: String(err) };
    }
  }

  return results;
}
