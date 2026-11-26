/**
 * Signed session cookie. Uses Web Crypto only, so it runs in middleware (edge) and routes (node).
 * The cookie is "<payload>.<signature>". The payload says who signed in and for which workspace.
 * SESSION_SECRET (a Vercel env var) signs it. Without that secret nobody can forge a session.
 */

export const SESSION_COOKIE = "calon_session";
/** Readable by the page so the app knows which workspace to show. It is a hint, not a credential. */
export const WORKSPACE_COOKIE = "calon_ws";
export const SESSION_DAYS = 7;

export type Session = { u: string; w: string; exp: number };

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(text: string) {
  const pad = text.length % 4 ? "=".repeat(4 - (text.length % 4)) : "";
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(session: Session, secret: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify(session)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload));
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export async function readSession(token: string | undefined, secret: string | undefined): Promise<Session | null> {
  if (!token || !secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), unb64url(sig), enc.encode(payload));
    if (!ok) return null;
    const session = JSON.parse(new TextDecoder().decode(unb64url(payload))) as Session;
    if (typeof session.exp !== "number" || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/** Constant-time comparison: hash both sides first so length does not leak. */
export async function sameSecret(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const xa = new Uint8Array(x);
  const ya = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ ya[i];
  return diff === 0;
}
