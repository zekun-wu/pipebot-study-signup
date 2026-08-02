"use client";

import { useEffect, useMemo, useState } from "react";

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

  // add-slot form state
  const [date, setDate] = useState("");
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("");
  const [interval, setIntervalMin] = useState(90);
  const [duration, setDuration] = useState(60);
  const [busy, setBusy] = useState(false);

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

  function buildStarts() {
    if (!date || !fromTime) return [];
    const starts = [];
    const first = new Date(`${date}T${fromTime}`);
    if (Number.isNaN(first.getTime())) return [];
    if (!toTime) return [first.toISOString()];
    const last = new Date(`${date}T${toTime}`);
    if (Number.isNaN(last.getTime()) || last < first) return [first.toISOString()];
    const step = Math.max(Number(interval) || 60, 15) * 60 * 1000;
    for (let t = first.getTime(); t <= last.getTime(); t += step) {
      starts.push(new Date(t).toISOString());
    }
    return starts;
  }

  async function handleAddSlots(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    const starts = buildStarts();
    if (starts.length === 0) {
      setError("Please pick a date and start time.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starts, durationMin: Number(duration) || 60 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create slots.");
      } else {
        setMessage(
          `Created ${data.created} slot${data.created === 1 ? "" : "s"}` +
            (data.skipped ? ` (${data.skipped} already existed)` : "") +
            "."
        );
        await loadSlots();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSlot(id) {
    if (!confirm("Delete this slot? Any registration on it will be removed too.")) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Slot deleted.");
      await loadSlots();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete slot.");
    }
  }

  async function handleCancelRegistration(id) {
    if (!confirm("Cancel this registration? The slot becomes available again. (No email is sent automatically — remember to inform the participant.)"))
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
        <h2>➕ Add slots</h2>
        <p className="hint">
          Times are entered in <strong>your</strong> timezone ({localTz}) and stored in
          UTC. Leave &quot;until&quot; empty to add a single slot; fill it to create a
          series (e.g. 09:00 until 16:30, every 90 min).
        </p>
        <form onSubmit={handleAddSlots}>
          <div className="add-slot-row">
            <div className="form-row">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>First slot at</label>
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>Until (optional)</label>
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Every (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={interval}
                onChange={(e) => setIntervalMin(e.target.value)}
                style={{ width: 90 }}
              />
            </div>
            <div className="form-row">
              <label>Duration (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: 90 }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>

      {message && <div className="ok-box">✅ {message}</div>}
      {error && <div className="error-box">⚠️ {error}</div>}

      <div className="panel">
        <h2>📋 All slots &amp; registrations</h2>
        {slots.length === 0 ? (
          <div className="empty-state">No slots yet — add some above.</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When ({localTz})</th>
                  <th>Status</th>
                  <th>Participant</th>
                  <th>Mode</th>
                  <th>Background</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const isPast = new Date(slot.start).getTime() < now;
                  const reg = slot.registration;
                  return (
                    <tr key={slot.id}>
                      <td>
                        {fmt(slot.start)}
                        <div className="muted">{slot.durationMin} min</div>
                      </td>
                      <td>
                        {reg ? (
                          <span className="tag booked">booked</span>
                        ) : isPast ? (
                          <span className="tag past">past</span>
                        ) : (
                          <span className="tag free">free</span>
                        )}
                      </td>
                      <td>
                        {reg ? (
                          <>
                            {reg.name || "—"}
                            <div className="muted">{reg.email}</div>
                            <div className="muted">tz: {reg.timezone}</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {reg ? (
                          reg.mode === "in_person" ? (
                            <span className="tag inperson">in person 🍫</span>
                          ) : (
                            <span className="tag remote">remote</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{reg?.background || "—"}</td>
                      <td>
                        {reg && (
                          <button
                            className="btn-small danger"
                            onClick={() => handleCancelRegistration(reg.id)}
                            style={{ marginRight: 8 }}
                          >
                            Cancel booking
                          </button>
                        )}
                        <button
                          className="btn-small danger"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          Delete slot
                        </button>
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
