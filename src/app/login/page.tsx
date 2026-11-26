"use client";

import { useState } from "react";
import { CalonLockup } from "@/components/brand";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        // A full load, so the app starts fresh on the right restaurant.
        window.location.assign("/");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not sign in. Try again.");
    } catch {
      setError("Could not reach Calon. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 py-10 text-ink">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <CalonLockup tone="cream" className="mx-auto h-16 w-auto" />
          <p className="mt-3 text-mist">Growth with heart. Built in Wales.</p>
        </div>
        <label className="block text-[0.85rem] text-mist">
          Username
          <input
            className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-[1rem] text-ink outline-none focus:border-white/40"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="block text-[0.85rem] text-mist">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-[1rem] text-ink outline-none focus:border-white/40"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p role="alert" className="text-[0.85rem] text-[#F2B8A8]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ink px-4 py-2.5 text-[0.95rem] font-medium text-navy disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-[0.75rem] text-faint">Pilot access. Ask your Calon contact if you need a login.</p>
      </form>
      <footer className="mt-10 max-w-sm space-y-1 text-center text-[0.7rem] leading-snug text-faint">
        <p>Calon Intelligence is a trading name of Integrated Visual Arts Ltd.</p>
        <p>Registered in England and Wales (Company No. 17169834).</p>
        <p>Registered Office: 3 Messina House, Vellacott Close, Cardiff, Wales, CF10 4AS.</p>
      </footer>
    </main>
  );
}
