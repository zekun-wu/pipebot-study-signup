"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CONSENT_TITLE, CONSENT_SECTIONS } from "@/lib/consent";

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    canvas.width = cssW * ratio;
    canvas.height = cssH * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk.current) {
      hasInk.current = true;
    }
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    hasInk.current = false;
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="sig-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="sig-actions">
        <span className="muted">Draw your signature above (mouse or touch)</span>
        <button type="button" className="btn-small" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}

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

const DAY_MS = 86400000;

// The study ends before September — don't offer weeks beyond this date.
const STUDY_END_KEY = "2026-08-31";

// Build a list of consecutive day descriptors in the given timezone,
// starting one week before today — avoids manual timezone arithmetic.
function buildDayInfos(timeZone) {
  const keyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const wdFmt = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short" });
  const headFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  });
  const todayKey = keyFmt.format(new Date());
  const infos = [];
  const seen = new Set();
  const start = Date.now() - 7 * DAY_MS;
  for (let i = 0; i < 60; i++) {
    const t = new Date(start + i * DAY_MS);
    const key = keyFmt.format(t);
    if (seen.has(key)) continue;
    seen.add(key);
    infos.push({
      key,
      weekday: wdFmt.format(t),
      head: headFmt.format(t),
      isToday: key === todayKey,
    });
  }
  return infos;
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
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [autoJumped, setAutoJumped] = useState(false);
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

  const dayInfos = useMemo(() => buildDayInfos(timezone), [timezone]);

  const monIdx = useMemo(() => {
    let idx = dayInfos.findIndex((d) => d.isToday);
    if (idx < 0) idx = 7;
    while (idx > 0 && dayInfos[idx].weekday !== "Mon") idx -= 1;
    return idx;
  }, [dayInfos]);

  const slotsByDay = useMemo(() => {
    const keyFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const map = new Map();
    for (const slot of slots || []) {
      const key = keyFmt.format(new Date(slot.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(slot);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.start) - new Date(b.start));
    }
    return map;
  }, [slots, timezone]);

  const maxWeekOffset = useMemo(() => {
    let lastIdx = -1;
    dayInfos.forEach((d, i) => {
      if (d.key <= STUDY_END_KEY) lastIdx = i;
    });
    if (lastIdx < monIdx) return 0;
    return Math.floor((lastIdx - monIdx) / 7);
  }, [dayInfos, monIdx]);

  // Jump to the first week that actually has available slots.
  useEffect(() => {
    if (autoJumped || !slots || slots.length === 0) return;
    const first = slots
      .map((s) => new Date(s.start).getTime())
      .sort((a, b) => a - b)[0];
    const keyFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const firstKey = keyFmt.format(new Date(first));
    const idx = dayInfos.findIndex((d) => d.key === firstKey);
    if (idx >= 0) {
      setWeekOffset(Math.min(maxWeekOffset, Math.max(0, Math.floor((idx - monIdx) / 7))));
    }
    setAutoJumped(true);
  }, [slots, autoJumped, dayInfos, monIdx, timezone, maxWeekOffset]);

  const weekDays = useMemo(() => {
    const startIdx = monIdx + weekOffset * 7;
    return dayInfos.slice(startIdx, startIdx + 7);
  }, [dayInfos, monIdx, weekOffset]);

  const weekHasSlots = weekDays.some((d) => slotsByDay.has(d.key));

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    if (!selectedSlot) {
      setSubmitError("Please pick a time slot first (step 1).");
      return;
    }
    if (!mode) {
      setSubmitError("Please choose how you'd like to take part (step 1).");
      return;
    }
    if (!consentAgreed || !signature) {
      setSubmitError("Please read the consent form, tick the agreement box, and sign it (step 3).");
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
          consent: consentAgreed,
          signature,
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
                  : "💻 Remote via Microsoft Teams — the meeting link is in your confirmation email"}
              </div>
              <div>✉️ Confirmation sent to {success.email}</div>
            </div>
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
                <p>
                  Please come to the office:{" "}
                  <strong>
                    Room 3.12, Building E1 7, Uni-Campus N 1, 66123 Saarbrücken, Germany
                  </strong>
                  . If you&apos;re around the campus, we do encourage you to come in
                  person — we&apos;ll give you a bonus <strong>chocolate</strong> 🍫 on
                  top of the gift card!
                </p>
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

            {slots !== null && !loadError && (
              <>
                <div className="uweek-nav">
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    disabled={weekOffset <= 0}
                  >
                    ← Prev week
                  </button>
                  <span className="uweek-label">
                    {weekDays[0]?.head} – {weekDays[6]?.head}
                  </span>
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={weekOffset >= maxWeekOffset}
                  >
                    Next week →
                  </button>
                </div>
                <div className="uweek-scroll">
                  <div className="uweek-grid">
                    {weekDays.map((day) => {
                      const daySlots = slotsByDay.get(day.key) || [];
                      return (
                        <div className="uweek-day" key={day.key}>
                          <div
                            className={
                              "uweek-day-head" + (day.isToday ? " today" : "")
                            }
                          >
                            <div className="uweek-day-name">{day.weekday}</div>
                            <div className="uweek-day-date">{day.head}</div>
                          </div>
                          <div className="uweek-day-body">
                            {daySlots.length === 0 ? (
                              <div className="uweek-empty">–</div>
                            ) : (
                              daySlots.map((slot) => (
                                <button
                                  type="button"
                                  key={slot.id}
                                  className={
                                    "slot-btn cal" +
                                    (selectedSlot?.id === slot.id
                                      ? " selected"
                                      : "")
                                  }
                                  onClick={() =>
                                    setSelectedSlot(
                                      selectedSlot?.id === slot.id ? null : slot
                                    )
                                  }
                                >
                                  {formatTime(slot.start, timezone)}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {!weekHasSlots && (
                  <div className="empty-state">
                    No free slots in this week — try another week.
                  </div>
                )}
                {selectedSlot && (
                  <div className="ok-box" style={{ marginTop: 14 }}>
                    ✅ Selected: {formatDay(selectedSlot.start, timezone)},{" "}
                    {formatTime(selectedSlot.start, timezone)} ({timezone}) — you can
                    pick one slot only.
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {mode && selectedSlot && (
          <div className="panel appear">
            <h2>
              <span className="step-num">3</span> Consent form
            </h2>
            <p className="hint">
              Please read the consent form below, then confirm and sign to continue.
            </p>
            <div className="consent-box">
              <h3>{CONSENT_TITLE}</h3>
              {CONSENT_SECTIONS.map((section) => (
                <div key={section.heading}>
                  <h4>{section.heading}</h4>
                  {(section.paragraphs || []).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {section.bullets && (
                    <ul>
                      {section.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {(section.paragraphsAfter || []).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {section.bulletsAfter && (
                    <ul>
                      {section.bulletsAfter.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
              />
              <span>
                I have read and understood the consent form, and I agree to take part in
                the study.
              </span>
            </label>
            {consentAgreed && (
              <div className="mode-detail">
                <p style={{ marginBottom: 8 }}>
                  <strong>Your signature:</strong>
                </p>
                <SignaturePad onChange={setSignature} />
              </div>
            )}
          </div>
          )}

          {mode && selectedSlot && consentAgreed && signature && (
          <div className="panel appear">
            <h2>
              <span className="step-num">4</span> Your details
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
