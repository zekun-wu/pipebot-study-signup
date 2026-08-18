"use client";

import { useEffect, useMemo, useState } from "react";

const DAY_START_MIN = 8 * 60; // calendar shows 08:00
const DAY_END_MIN = 20 * 60; // … to 20:00
const PX_PER_30MIN = 26;
const SLOT_MINUTES = 60; // fixed study duration

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtTime(date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDayShort(date) {
  return date.toLocaleDateString("en-GB", { weekday: "short" });
}

function fmtWeekLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const opts = { day: "numeric", month: "short" };
  return `${weekStart.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString(
    "en-GB",
    { ...opts, year: "numeric" }
  )}`;
}

function fmt(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const localTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "your local timezone";
    }
  }, []);

  async function loadSlots() {
    const res = await fetch("/api/admin/slots", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setSlots(data.slots);
      setAuthed(true);
    } else {
      setError(data.error || "Failed to load slots.");
    }
    setChecking(false);
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      setChecking(true);
      await loadSlots();
    } else {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || "Login failed.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  async function createSlotAt(start) {
    if (busy) return;
    setMessage("");
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts: [start.toISOString()],
          durationMin: SLOT_MINUTES,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create the slot.");
      } else if (data.created === 0) {
        setError("A slot at that exact time already exists.");
      } else {
        setMessage(`Added a 1-hour slot on ${fmt(start.toISOString())}.`);
        await loadSlots();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSlot(slot) {
    const warn = slot.registration
      ? "This slot is BOOKED. Deleting it removes the registration too (no email is sent automatically). Delete anyway?"
      : "Remove this free slot?";
    if (!confirm(warn)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/slots?id=${slot.id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Slot removed.");
      await loadSlots();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete slot.");
    }
  }

  async function handleCancelRegistration(id) {
    if (
      !confirm(
        "Cancel this registration? The slot becomes available again. (No email is sent automatically — remember to inform the participant.)"
      )
    )
      return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/registrations?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Registration cancelled — the slot is free again.");
      await loadSlots();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not cancel registration.");
    }
  }

  async function handleDecision(id, decision) {
    const warn =
      decision === "confirmed"
        ? "Confirm this participant? We'll email them the full confirmation now."
        : "Decline this booking? We'll email them the recruitment-limit note and free up the slot.";
    if (!confirm(warn)) return;
    setMessage("");
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(
          decision === "confirmed"
            ? "Confirmed — the participant has been emailed."
            : "Declined — the participant has been emailed and the slot is free again."
        );
        await loadSlots();
      } else {
        setError(data.error || "Could not record the decision.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleHourClick(day, minutes) {
    const start = new Date(day);
    start.setHours(0, minutes, 0, 0);
    if (start.getTime() < Date.now()) {
      setError("That time is in the past — pick a future hour.");
      return;
    }
    createSlotAt(start);
  }

  if (checking) {
    return (
      <main className="admin-wrap">
        <div className="empty-state">Loading…</div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="admin-wrap">
        <div className="panel login-panel">
          <h2>🔐 Admin login</h2>
          <p className="hint">Enter the admin password to manage slots.</p>
          <form onSubmit={handleLogin}>
            <div className="form-row">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {loginError && <div className="error-box">{loginError}</div>}
            <button className="btn btn-primary" type="submit">
              Log in
            </button>
          </form>
        </div>
      </main>
    );
  }

  const now = Date.now();
  const bookedCount = slots.filter((s) => s.registration).length;
  const freeUpcoming = slots.filter(
    (s) => !s.registration && new Date(s.start).getTime() > now
  ).length;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 60) {
    hours.push(m);
  }
  const columnHeight = ((DAY_END_MIN - DAY_START_MIN) / 30) * PX_PER_30MIN;

  const registrations = slots.filter((s) => s.registration);

  return (
    <main className="admin-wrap">
      <div className="admin-head">
        <h1>🗓️ Study admin</h1>
        <div>
          <span className="muted" style={{ marginRight: 14 }}>
            {bookedCount} booked · {freeUpcoming} free upcoming
          </span>
          <button className="btn-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="cal-toolbar">
          <h2 style={{ margin: 0 }}>➕ Study slots</h2>
          <div className="cal-nav">
            <button className="btn-small" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              ← Prev
            </button>
            <button className="btn-small" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Today
            </button>
            <button className="btn-small" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Next →
            </button>
            <span className="cal-week-label">{fmtWeekLabel(weekStart)}</span>
          </div>
        </div>
        <p className="hint">
          Click an hour on the calendar to add that <strong>1-hour study slot</strong>{" "}
          (e.g. 10:00–11:00, shown in {localTz}). Click ✕ on a slot to remove it.
        </p>

        {message && <div className="ok-box">✅ {message}</div>}
        {error && <div className="error-box">⚠️ {error}</div>}

        <div className="cal-scroll">
          <div className="cal-grid">
            <div className="cal-times">
              <div className="cal-day-head" />
              <div className="cal-times-body" style={{ height: columnHeight }}>
                {hours.map((m) => (
                  <div
                    key={m}
                    className="cal-time-label"
                    style={{ top: ((m - DAY_START_MIN) / 30) * PX_PER_30MIN }}
                  >
                    {String(Math.floor(m / 60)).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
            </div>
            {days.map((day) => {
              const isToday = sameDay(day, new Date());
              const daySlots = slots.filter((s) =>
                sameDay(new Date(s.start), day)
              );
              return (
                <div className="cal-day" key={day.toISOString()}>
                  <div className={"cal-day-head" + (isToday ? " today" : "")}>
                    <span className="cal-day-name">{fmtDayShort(day)}</span>{" "}
                    <span className="cal-day-num">{day.getDate()}</span>
                  </div>
                  <div className="cal-day-body" style={{ height: columnHeight }}>
                    {hours.map((m) => {
                      const cellStart = new Date(day);
                      cellStart.setHours(0, m, 0, 0);
                      const cellPast = cellStart.getTime() < now;
                      const label = `${String(Math.floor(m / 60)).padStart(2, "0")}:00–${String(Math.floor(m / 60) + 1).padStart(2, "0")}:00`;
                      return (
                        <div
                          key={m}
                          className={"cal-hour-cell" + (cellPast ? " past" : "")}
                          style={{
                            top: ((m - DAY_START_MIN) / 30) * PX_PER_30MIN,
                            height: PX_PER_30MIN * 2,
                          }}
                          onClick={() => !cellPast && handleHourClick(day, m)}
                        >
                          {!cellPast && (
                            <span className="cal-add-hint">＋ {label}</span>
                          )}
                        </div>
                      );
                    })}
                    {daySlots.map((slot) => {
                      const start = new Date(slot.start);
                      const minutes = start.getHours() * 60 + start.getMinutes();
                      const top =
                        ((minutes - DAY_START_MIN) / 30) * PX_PER_30MIN;
                      const height =
                        (slot.durationMin / 30) * PX_PER_30MIN - 3;
                      if (
                        minutes + slot.durationMin < DAY_START_MIN ||
                        minutes > DAY_END_MIN
                      ) {
                        return null;
                      }
                      const isPast = start.getTime() < now;
                      const reg = slot.registration;
                      const isPending = reg && reg.status !== "confirmed";
                      const cls = reg
                        ? "cal-slot booked" + (isPending ? " pending" : "")
                        : isPast
                        ? "cal-slot past"
                        : "cal-slot free";
                      return (
                        <div
                          key={slot.id}
                          className={cls}
                          style={{ top: Math.max(top, 0), height }}
                          onClick={(e) => e.stopPropagation()}
                          title={
                            reg
                              ? `${reg.name || reg.email} (${reg.mode === "in_person" ? "in person" : "remote"})${isPending ? " — pending decision" : ""}`
                              : "Free slot"
                          }
                        >
                          <span className="cal-slot-time">{fmtTime(start)}</span>
                          <span className="cal-slot-label">
                            {reg
                              ? (reg.name || reg.email) + (isPending ? " ⏳" : "")
                              : isPast
                              ? "past"
                              : "free"}
                          </span>
                          {reg && (
                            <button
                              type="button"
                              className="cal-slot-x undo"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRegistration(reg.id);
                              }}
                              aria-label="Cancel booking, make slot available again"
                              title="Cancel booking — slot becomes available again"
                            >
                              ↺
                            </button>
                          )}
                          <button
                            type="button"
                            className="cal-slot-x"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlot(slot);
                            }}
                            aria-label="Delete slot"
                            title="Delete this slot entirely"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>📋 Registrations</h2>
        {registrations.length === 0 ? (
          <div className="empty-state">No registrations yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When ({localTz})</th>
                  <th>Participant</th>
                  <th>Mode</th>
                  <th>Background</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((slot) => {
                  const reg = slot.registration;
                  const isConfirmed = reg.status === "confirmed";
                  return (
                    <tr key={slot.id}>
                      <td>{fmt(slot.start)}</td>
                      <td>
                        {reg.name || "—"}
                        <div className="muted">{reg.email}</div>
                        <div className="muted">tz: {reg.timezone}</div>
                      </td>
                      <td>
                        {reg.mode === "in_person" ? (
                          <span className="tag inperson">in person 🍫</span>
                        ) : (
                          <span className="tag remote">remote</span>
                        )}
                      </td>
                      <td>{reg.background || "—"}</td>
                      <td>
                        {isConfirmed ? (
                          <span className="tag confirmed">✅ confirmed</span>
                        ) : (
                          <span className="tag pending">⏳ pending</span>
                        )}
                      </td>
                      <td>
                        <div className="action-stack">
                          {!isConfirmed && (
                            <>
                              <button
                                className="btn-small primary"
                                disabled={busy}
                                onClick={() => handleDecision(reg.id, "confirmed")}
                              >
                                Confirm
                              </button>
                              <button
                                className="btn-small danger"
                                disabled={busy}
                                onClick={() => handleDecision(reg.id, "rejected")}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          <button
                            className="btn-small"
                            onClick={() => handleCancelRegistration(reg.id)}
                          >
                            Cancel booking
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
