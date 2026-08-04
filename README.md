# AI Agents & Workflows Study — Signup Website

A Doodle-style recruitment site for the user study: a vivid landing page, a booking
page with timezone-aware time slots (remote via Microsoft Teams or in person at
Saarland University), automatic confirmation emails to the participant and the
admin, and a password-protected admin area for managing slots.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page: study pitch, eligibility, duration, €15 Amazon gift card, chocolate bonus for in-person participants |
| `/register` | Booking: pick a slot (auto-detected timezone with manual override), choose remote/in-person, enter name + email. One slot per email, one participant per slot. |
| `/admin` | Admin: password login, create single slots or whole series, see all registrations, cancel bookings, delete slots. |

## Tech stack

- **Next.js 14** (App Router) — deploys directly on Vercel
- **Postgres** via `pg` — works with the Vercel/Neon Postgres integration or any Postgres
- **Resend** for transactional email (participant confirmation with `.ics` calendar invite + admin notification)

The database schema is created automatically on first use — no migration step needed.

## Deploy on Vercel

1. **Push this repo to GitHub** (already done if you're reading this there).
2. On [vercel.com](https://vercel.com), **Add New → Project** and import the repo.
   Framework preset: Next.js — no build settings needed.
3. **Add a database**: in the Vercel project, go to **Storage → Create Database →
   Neon (Postgres)** and connect it. This automatically sets `POSTGRES_URL`,
   which the app picks up. (Alternatively set `DATABASE_URL` to any Postgres
   connection string.)
4. **Set environment variables** (Project → Settings → Environment Variables):

   | Variable | Value |
   | --- | --- |
   | `RESEND_API_KEY` | your Resend API key (`re_...`) |
   | `EMAIL_FROM` | e.g. `AI Agent Study <contact@yourdomain.com>` — must be a verified sender/domain in Resend (`RESEND_FROM` is also accepted) |
   | `ADMIN_EMAIL` | where admin notifications go |
   | `TEAMS_MEETING_LINK` | *(optional)* reusable Microsoft Teams meeting link — automatically included in remote participants' confirmation emails and calendar invites |
   | `ADMIN_PASSWORD` | password for `/admin` — pick something strong |
   | `AUTH_SECRET` | *(optional)* separate secret for signing the admin session cookie |

5. **Deploy.** Then open `https://your-app.vercel.app/admin`, log in, and create
   your first slots. The public site is ready at the root URL.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your values; point DATABASE_URL at a local Postgres
npm run dev
```

Without `RESEND_API_KEY`, bookings still work — emails are skipped and logged instead.

## Behaviour notes

- Slots are stored in UTC and rendered in the participant's timezone
  (auto-detected from the browser, overridable via dropdown).
- Double-booking is prevented at the database level (unique constraints), so two
  people can't grab the same slot even if they submit at the same moment; the
  same email cannot book twice.
- Deleting a slot cascades to its registration; cancelling a registration frees
  the slot again (no automatic email is sent on cancellation — inform the
  participant manually).
- Admin sessions last 7 days (HMAC-signed HttpOnly cookie).
