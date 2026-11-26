import { NextResponse } from "next/server";
import { demoAccounts } from "@/lib/accounts";
import { SESSION_COOKIE, SESSION_DAYS, WORKSPACE_COOKIE, sameSecret, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "Sign-in is not set up yet." }, { status: 500 });

  let username = "";
  let password = "";
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    username = String(body.username ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const account = demoAccounts.find((a) => a.username === username);
  // Vercel may have saved the name in lower case; accept either.
  const expected = account ? (process.env[account.passwordEnv] ?? process.env[account.passwordEnv.toLowerCase()]) : undefined;
  // Always run one comparison so a wrong username and a wrong password take the same time.
  const ok = await sameSecret(password, expected ?? "\u0000no-account\u0000");
  if (!account || !expected || !ok) {
    return NextResponse.json({ error: "That username and password do not match." }, { status: 401 });
  }

  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const token = await signSession({ u: account.username, w: account.workspace, exp: Date.now() + maxAge * 1000 }, secret);
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
  res.cookies.set(WORKSPACE_COOKIE, account.workspace, { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge });
  return res;
}
