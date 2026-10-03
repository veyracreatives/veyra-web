/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN AUTH — server-only.

   The panel is protected by a single shared password, so this is deliberately
   simple: an HMAC-signed, expiring, httpOnly cookie. There is no user database
   and no session store — the cookie *is* the session, and it cannot be forged
   without the secret.

   Credentials default to the ones requested but can be overridden with
   ADMIN_USER / ADMIN_PASSWORD. Both live here, on the server: nothing about
   them is ever sent to the browser.
   ═══════════════════════════════════════════════════════════════════════ */

import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "veyra_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

const ADMIN_USER = process.env.ADMIN_USER ?? "Dibesh";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "mady1007mady";

/** Session-signing secret. Falls back to the password so it works unconfigured. */
const SECRET =
  process.env.ADMIN_SESSION_SECRET ?? `veyra::${ADMIN_USER}::${ADMIN_PASSWORD}`;

const b64url = (b: Buffer): string => b.toString("base64url");

const sign = (payload: string): string =>
  createHmac("sha256", SECRET).update(payload).digest("base64url");

function makeToken(): string {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${b64url(Buffer.from(String(expires)))}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, mac] = parts;

  const expected = sign(`${expires}.${nonce}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expiry = Number(Buffer.from(expires, "base64url").toString("utf8"));
  return Number.isFinite(expiry) && Date.now() < expiry;
}

/** Constant-time compare so the password can't be probed by timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = createHmac("sha256", SECRET).update(a).digest();
  const bufB = createHmac("sha256", SECRET).update(b).digest();
  return timingSafeEqual(bufA, bufB);
}

export function checkCredentials(user: string, password: string): boolean {
  const userOk = safeEqual(user ?? "", ADMIN_USER);
  const passOk = safeEqual(password ?? "", ADMIN_PASSWORD);
  return userOk && passOk;
}

export async function startSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE_NAME)?.value);
}

/* ── crude in-memory brute-force throttle ──────────────────────────────
   Resets when the process restarts, which is exactly the right scope for a
   single shared password on a single box. A real deployment across many
   instances would want this in Redis instead. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

let attempts: { count: number; first: number } = { count: 0, first: Date.now() };

export function loginThrottled(): { blocked: boolean; retryInMinutes: number } {
  const now = Date.now();
  if (now - attempts.first > WINDOW_MS) {
    attempts = { count: 0, first: now };
    return { blocked: false, retryInMinutes: 0 };
  }
  if (attempts.count >= MAX_ATTEMPTS) {
    return {
      blocked: true,
      retryInMinutes: Math.max(1, Math.ceil((WINDOW_MS - (now - attempts.first)) / 60000)),
    };
  }
  return { blocked: false, retryInMinutes: 0 };
}

export function recordFailedAttempt(): void {
  const now = Date.now();
  if (now - attempts.first > WINDOW_MS) attempts = { count: 0, first: now };
  attempts.count += 1;
}

export function clearAttempts(): void {
  attempts = { count: 0, first: Date.now() };
}
