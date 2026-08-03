"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const FALLBACK_TIMEZONES = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Africa/Cairo",
  "UTC",
];

function getAllTimezones() {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {}
  return FALLBACK_TIMEZONES;
}

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
  } catch {
    return "Europe/Berlin";
  }
}

function formatDay(iso, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

function formatTime(iso, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export default function RegisterPage() {
  const [slots, setSlots] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [timezone, setTimezone] = useState("Europe/Berlin");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [background, setBackground] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);

  const timezones = useMemo(() => getAllTimezones(), []);

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  async function loadSlots() {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setSlots(data.slots);
      setLoadError("");
    } catch {
      setLoadError("Could not load available time slots. Please refresh the page.");
      setSlots([]);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  const grouped = useMemo(() => {
    if (!slots) return [];
    const byDay = new Map();
    for (const slot of slots) {
      const day = formatDay(slot.start, timezone);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(slot);
    }
    return Array.from(byDay.entries());
  }, [slots, timezone]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    if (!selectedSlot) {
      setSubmitError("Please pick a time slot first (step 1).");
      return;
    }
    if (!mode) {
      setSubmitError("Please choose how you'd like to take part (step 2).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          email,
          name,
          mode,
          timezone,
          background,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        if (res.status === 409) {
          setSelectedSlot(null);
          loadSlots();
        }
        return;
      }
      setSuccess({
        slot: selectedSlot,
        mode,
        email,
        emailSent: data.emailSent,
      });
    } catch {
      setSubmitError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main>
        <div className="page-head">
          <div className="hero-inner">
            <h1>You&apos;re booked! 🎉</h1>
          </div>
        </div>
        <div className="booking-wrap">
          <div className="panel success-panel">
            <div className="big">✅</div>
            <h2>See you soon!</h2>
            <div className="summary-box">
              <div>
                <strong>📅 {formatDay(success.slot.start, timezone)}</strong>
              </div>
              <div>
                🕐 {formatTime(success.slot.start, timezone)}{" "}
                <span className="muted">({timezone})</span>
              </div>
              <div>
                {success.mode === "in_person"
                  ? "🏛️ In person — Room 3.12, Building E1 7, Uni-Campus N 1, 66123 Saarbrücken 🍫"
                  : "💻 Remote via Microsoft Teams (link will be emailed to you)"}
              </div>
              <div>✉️ Confirmation sent to {success.email}</div>
            </div>
            <p className="muted">
              {success.emailSent
                ? "A confirmation email with a calendar invite is on its way. If you don't see it, check your spam folder."
                : "Your booking is saved. If no confirmation email arrives shortly, don't worry — your slot is reserved."}
            </p>
            <p className="muted">
              Need to reschedule? Just reply to the confirmation email.
            </p>
            <Link className="btn btn-primary" href="/">
              Back to the study page
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-head">
        <div className="hero-inner">
          <h1>Book your session 📅</h1>
          <p>Pick a time, tell us how you&apos;d like to join, and you&apos;re set.</p>
        </div>
      </div>

      <div className="booking-wrap">
        <form onSubmit={handleSubmit}>
          <div className="panel">
            <h2>
              <span className="step-num">1</span> How would you like to take part in our
              study?
            </h2>
            <div className="mode-grid">
              <div
                className={"mode-card compact" + (mode === "remote" ? " selected" : "")}
                onClick={() => setMode("remote")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setMode("remote")}
              >
                <h3>💻 Remotely</h3>
                <p>Via Microsoft Teams, from anywhere</p>
              </div>
              <div
                className={
                  "mode-card compact" + (mode === "in_person" ? " selected" : "")
                }
                onClick={() => setMode("in_person")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setMode("in_person")}
              >
                <h3>🏛️ In person</h3>
                <p>At Saarland University, Saarbrücken</p>
              </div>
            </div>
            {mode === "remote" && (
              <div className="mode-detail">
                <p>
                  Please make sure{" "}
                  <strong>Microsoft Teams is installed on your computer</strong> before
                  the session and that you can comfortably join and manage a remote
                  meeting (including screen sharing). We&apos;ll send you the meeting
                  link by email.
                </p>
              </div>
            )}
            {mode === "in_person" && (
              <div className="mode-detail">
                <div className="address-box">
                  📍 <strong>Room 3.12, Building E1 7</strong>
                  <br />
                  Uni-Campus N 1<br />
                  66123 Saarbrücken
                  <br />
                  Germany
                </div>
                <div className="choco">
                  🍫 <strong>Bonus:</strong> if you&apos;re at Saarland University, we
                  warmly encourage you to come in person — you&apos;ll get an extra
                  chocolate on top of the gift card!
                </div>
              </div>
            )}
          </div>

          {mode && (
          <div className="panel appear">
            <h2>
              <span className="step-num">2</span> Choose a time slot
            </h2>
            <div className="tz-row">
              <label htmlFor="tz">
                <strong>🌍 Your timezone:</strong>
              </label>
              <select
                id="tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {!timezones.includes(timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {loadError && <div className="error-box">{loadError}</div>}
            {slots === null && !loadError && (
              <div className="empty-state">Loading available slots…</div>
            )}

            {grouped.map(([day, daySlots]) => (
              <div className="day-group" key={day}>
                <div className="day-label">{day}</div>
                <div className="slot-grid">
                  {daySlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      className={
                        "slot-btn" +
                        (selectedSlot?.id === slot.id ? " selected" : "")
                      }
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTime(slot.start, timezone)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}

          {mode && selectedSlot && (
          <div className="panel appear">
            <h2>
              <span className="step-num">3</span> Your details
            </h2>
            <div className="form-row">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="background">
                Which AI agent or automation tool have you used?{" "}
                <span className="muted">(optional)</span>
              </label>
              <input
                id="background"
                type="text"
                placeholder="e.g. ChatGPT Operator, n8n, Zapier…"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </div>

            {submitError && <div className="error-box">⚠️ {submitError}</div>}

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Booking…" : "Confirm my session 🎉"}
            </button>
          </div>
          )}
        </form>
        <p className="muted" style={{ textAlign: "center" }}>
          <Link href="/">← Back to study info</Link>
        </p>
      </div>
    </main>
  );
}
