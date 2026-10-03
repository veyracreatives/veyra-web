"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not sign in.");
        setBusy(false);
        return;
      }
      // Re-render server-side so the page swaps the form for the dashboard.
      router.replace("/admin_veyra");
      router.refresh();
    } catch {
      setError("Network error — is the server running?");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0D12] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#D6FF3F]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Veyra
          </p>
          <h1
            className="text-3xl text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Admin panel
          </h1>
          <p className="mt-3 text-sm text-white/45">Sign in to edit the site content.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <div>
            <label htmlFor="admin-user" className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
              ID
            </label>
            <input
              id="admin-user"
              type="text"
              autoComplete="username"
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D6FF3F]/60"
              placeholder="Dibesh"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D6FF3F]/60"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#D6FF3F] px-4 py-3 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-white/25">
          <Link href="/" className="transition hover:text-white/60">
            ← Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
}
