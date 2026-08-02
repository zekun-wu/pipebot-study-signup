import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "study_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const base = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
  if (!base) throw new Error("ADMIN_PASSWORD is not configured");
  return crypto.createHash("sha256").update(`study-admin:${base}`).digest();
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(String(password));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSessionValue() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(value) {
  if (!value) return false;
  const [payload, sig] = String(value).split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(payload) > Date.now();
}

export function isAdminRequest() {
  const value = cookies().get(COOKIE_NAME)?.value;
  return isValidSession(value);
}

export function sessionCookie() {
  return {
    name: COOKIE_NAME,
    value: createSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function clearedSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
