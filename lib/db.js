import { Pool } from "pg";

let pool;
let schemaReady;

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function getPool() {
  if (!pool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error(
        "No database connection string found. Set DATABASE_URL (or POSTGRES_URL)."
      );
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  start_utc TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slots_start_unique UNIQUE (start_utc)
);
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  slot_id INT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL CHECK (mode IN ('remote', 'in_person')),
  timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
  background TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registrations_slot_unique UNIQUE (slot_id),
  CONSTRAINT registrations_email_unique UNIQUE (email)
);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS signature TEXT NOT NULL DEFAULT '';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
`;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(SCHEMA_SQL)
      .catch((err) => {
        schemaReady = undefined;
        throw err;
      });
  }
  return schemaReady;
}

export async function query(text, params) {
  await ensureSchema();
  return getPool().query(text, params);
}
