"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GRADIENT_PRESETS,
  normalizeContent,
  type LogoItem,
  type SiteContent,
  type WorkItem,
} from "@/lib/site-content";

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD

   One document, three tabs. Edits are held in local state and only reach the
   database when "Save changes" is pressed, so a half-finished edit never leaks
   onto the live site.
   ═══════════════════════════════════════════════════════════════════════ */

type Tab = "contact" | "logos" | "work";
type Banner = { kind: "ok" | "err"; text: string } | null;

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function Dashboard({
  initial,
  source,
  configured,
  backendError,
}: {
  initial: SiteContent;
  source: "supabase" | "defaults";
  configured: boolean;
  backendError: string | null;
}) {
  const [draft, setDraft] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<Tab>("contact");
  const [banner, setBanner] = useState<Banner>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  /* `baseline` is the last-known-saved document, and is what Discard returns
     to. Keeping it separate from the `initial` prop means Discard still works
     correctly after a save — the prop is stale by then. */
  const [baseline, setBaseline] = useState<SiteContent>(initial);

  /* If the server hands us a different document (a router refresh after
     signing in, say), adopt it and drop any local edits. Adjusting state
     during render is React's recommended alternative to a syncing effect. */
  const [seenInitial, setSeenInitial] = useState<SiteContent>(initial);
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    setBaseline(initial);
    setDraft(initial);
    setDirty(false);
  }

  const update = useCallback((patch: Partial<SiteContent>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setBanner(null);
  }, []);

  /* ── save ── */
  const save = async () => {
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizeContent(draft)),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBanner({ kind: "err", text: data.error || "Could not save." });
      } else {
        setDraft(data.content);
        setBaseline(data.content);
        setDirty(false);
        setBanner({ kind: "ok", text: "Saved. The live site updates within a few seconds." });
      }
    } catch {
      setBanner({ kind: "err", text: "Network error — is the server running?" });
    } finally {
      setSaving(false);
    }
  };

  /* ── warn before losing unsaved edits ── */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* ── upload helper ── */
  const upload = async (file: File): Promise<string | null> => {
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBanner({ kind: "err", text: data.error || "Upload failed." });
        return null;
      }
      return data.url as string;
    } catch {
      setBanner({ kind: "err", text: "Upload failed — is the server running?" });
      return null;
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin_veyra";
  };

  /* ── logo ops ── */
  const addLogos = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: LogoItem[] = [];
    for (const file of Array.from(files)) {
      const url = await upload(file);
      if (url) added.push({ id: newId("logo"), src: url, alt: file.name.replace(/\.[^.]+$/, "") });
    }
    if (added.length) update({ logos: [...draft.logos, ...added] });
  };

  const removeLogo = async (logo: LogoItem) => {
    // Only uploaded files live in the bucket; bundled defaults are left alone.
    fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src: logo.src }),
    }).catch(() => {});
    update({ logos: draft.logos.filter((l) => l.id !== logo.id) });
  };

  const moveLogo = (index: number, dir: -1 | 1) => {
    const next = [...draft.logos];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    update({ logos: next });
  };

  /* ── work ops ── */
  const setWorkItem = (id: string, patch: Partial<WorkItem>) =>
    update({ work: draft.work.map((w) => (w.id === id ? { ...w, ...patch } : w)) });

  const addWorkItem = () =>
    update({
      work: [
        ...draft.work,
        {
          id: newId("work"),
          tag: "New tag",
          title: "New project",
          metric: "—",
          desc: "Describe the result.",
          img: "/work/googlebusiness_profile.png",
          gradient: GRADIENT_PRESETS[0].value,
        },
      ],
    });

  const removeWorkItem = (id: string) =>
    update({ work: draft.work.filter((w) => w.id !== id) });

  const moveWorkItem = (index: number, dir: -1 | 1) => {
    const next = [...draft.work];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    update({ work: next });
  };

  const uploadWorkImage = async (id: string, file: File | null) => {
    if (!file) return;
    const url = await upload(file);
    if (url) setWorkItem(id, { img: url });
  };

  /* ── shared field styles ── */
  const field =
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#D6FF3F]/60";
  const label =
    "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40";
  const iconBtn =
    "rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition hover:border-white/25 hover:text-white disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/60";

  return (
    <div className="min-h-screen bg-[#0B0D12] pb-28">
      {/* ── header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0D12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>
              Veyra
            </p>
            <h1 className="text-lg text-white" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Admin panel
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-white/50 underline underline-offset-4 transition hover:text-white">
              View site ↗
            </a>
            <button onClick={logout} className={iconBtn}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* ── backend health ── */}
        {backendError ? (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
            <strong className="block font-semibold">Backend not connected</strong>
            {backendError}
            {!configured && (
              <>
                {" "}Add <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="rounded bg-black/30 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
                <code className="rounded bg-black/30 px-1">.env.local</code>, then run{" "}
                <code className="rounded bg-black/30 px-1">supabase/schema.sql</code> in the Supabase SQL editor.
              </>
            )}
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2 text-[11px] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
            <span className={`h-1.5 w-1.5 rounded-full ${source === "supabase" ? "bg-[#D6FF3F]" : "bg-amber-400"}`} />
            {source === "supabase" ? "Connected — showing saved content" : "Using built-in defaults (nothing saved yet)"}
          </div>
        )}

        {/* ── tabs ── */}
        <div className="mb-8 flex gap-2 border-b border-white/[0.08]">
          {(
            [
              ["contact", "Contact & form"],
              ["logos", `Logos (${draft.logos.length})`],
              ["work", `Work (${draft.work.length})`],
            ] as [Tab, string][]
          ).map(([key, text]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition ${
                tab === key
                  ? "border-[#D6FF3F] text-white"
                  : "border-transparent text-white/45 hover:text-white/80"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        {banner ? (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-4 py-3 text-xs ${
              banner.kind === "ok"
                ? "border-[#D6FF3F]/30 bg-[#D6FF3F]/10 text-[#D6FF3F]"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {banner.text}
          </div>
        ) : null}

        {/* ── CONTACT TAB ── */}
        {tab === "contact" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <h2 className="mb-5 text-base text-white" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                Enquiry form
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="wa-number">WhatsApp number</label>
                  <input
                    id="wa-number"
                    className={field}
                    value={draft.whatsappNumber}
                    onChange={(e) => update({ whatsappNumber: e.target.value })}
                    placeholder="918928246726"
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                    Country code + number, digits only, no “+”. The enquiry form opens a chat to this number.
                  </p>
                </div>
                <div>
                  <label className={label} htmlFor="contact-email">Contact email</label>
                  <input
                    id="contact-email"
                    type="email"
                    className={field}
                    value={draft.contactEmail}
                    onChange={(e) => update({ contactEmail: e.target.value })}
                    placeholder="you@example.com"
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                    Shown under the form and in the contact button.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/20 px-4 py-3 text-[11px] leading-relaxed text-white/40">
                Preview link →{" "}
                <span className="break-all text-white/60">
                  wa.me/{draft.whatsappNumber || "—"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── LOGOS TAB ── */}
        {tab === "logos" && (
          <section>
            <LogoUploader onFiles={addLogos} disabled={!configured} />

            {draft.logos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/[0.12] px-6 py-14 text-center">
                <p className="text-sm text-white/50">No logos yet.</p>
                <p className="mt-2 text-xs text-white/30">
                  The marquee section stays hidden on the site until you add at least one.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-6 text-[11px] text-white/35">
                  Drag order with the arrows — this is the order they scroll in.
                </p>
                <ul className="mt-3 space-y-2">
                  {draft.logos.map((logo, i) => (
                    <li key={logo.id} className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                      <span className="w-6 shrink-0 text-center text-[11px] tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.src} alt={logo.alt} className="max-h-full max-w-full object-contain" />
                      </div>
                      <input
                        className={`${field} flex-1`}
                        value={logo.alt}
                        onChange={(e) =>
                          update({ logos: draft.logos.map((l) => (l.id === logo.id ? { ...l, alt: e.target.value } : l)) })
                        }
                        placeholder="Alt text"
                        aria-label="Logo alt text"
                      />
                      <div className="flex shrink-0 flex-col gap-1">
                        <button className={iconBtn} onClick={() => moveLogo(i, -1)} disabled={i === 0} aria-label="Move earlier">↑</button>
                        <button className={iconBtn} onClick={() => moveLogo(i, 1)} disabled={i === draft.logos.length - 1} aria-label="Move later">↓</button>
                      </div>
                      <button
                        onClick={() => removeLogo(logo)}
                        className="shrink-0 rounded-lg border border-red-500/25 px-2.5 py-1.5 text-xs text-red-300/80 transition hover:border-red-500/50 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {/* ── WORK TAB ── */}
        {tab === "work" && (
          <section>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-[11px] text-white/35">
                These are the cards in “Results that outlive the campaign.”
              </p>
              <button onClick={addWorkItem} className="rounded-lg border border-[#D6FF3F]/40 px-3.5 py-2 text-xs text-[#D6FF3F] transition hover:bg-[#D6FF3F]/10">
                + Add card
              </button>
            </div>

            <ul className="space-y-4">
              {draft.work.map((item, i) => (
                <li key={item.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-[11px] tabular-nums text-white/30">Card {String(i + 1).padStart(2, "0")}</span>
                    <div className="flex items-center gap-1.5">
                      <button className={iconBtn} onClick={() => moveWorkItem(i, -1)} disabled={i === 0} aria-label="Move earlier">↑</button>
                      <button className={iconBtn} onClick={() => moveWorkItem(i, 1)} disabled={i === draft.work.length - 1} aria-label="Move later">↓</button>
                      <button
                        onClick={() => removeWorkItem(item.id)}
                        className="rounded-lg border border-red-500/25 px-2.5 py-1.5 text-xs text-red-300/80 transition hover:border-red-500/50 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Tag</label>
                      <input className={field} value={item.tag} onChange={(e) => setWorkItem(item.id, { tag: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Metric</label>
                      <input className={field} value={item.metric} onChange={(e) => setWorkItem(item.id, { metric: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Title</label>
                      <input className={field} value={item.title} onChange={(e) => setWorkItem(item.id, { title: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Description</label>
                      <textarea className={`${field} min-h-20 resize-y`} value={item.desc} onChange={(e) => setWorkItem(item.id, { desc: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>Tint on hover</label>
                      <select className={field} value={item.gradient} onChange={(e) => setWorkItem(item.id, { gradient: e.target.value })}>
                        {GRADIENT_PRESETS.map((g) => (
                          <option key={g.value} value={g.value} className="bg-[#0B0D12]">
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Image</label>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.img} alt="" className="h-full w-full object-cover" />
                        </div>
                        <ImagePicker onPick={(f) => uploadWorkImage(item.id, f)} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {draft.work.length === 0 && (
              <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                Every card has been removed. Saving will restore the six defaults — the section is never left empty.
              </p>
            )}
          </section>
        )}
      </div>

      {/* ── sticky save bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#0B0D12]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDraft(baseline); setDirty(false); setBanner(null); }}
              disabled={!dirty || saving}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-30"
            >
              Discard
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving || !configured}
              className="rounded-lg bg-[#D6FF3F] px-5 py-2.5 text-xs font-medium text-black transition hover:bg-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── drag-free file pickers ──────────────────────────────────────────── */

function LogoUploader({ onFiles, disabled }: { onFiles: (f: FileList | null) => void; disabled: boolean }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
        over ? "border-[#D6FF3F]/60 bg-[#D6FF3F]/5" : "border-white/[0.12] hover:border-white/25"
      } ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
        multiple
        hidden
        onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
      />
      <p className="text-sm text-white/70">
        {disabled ? "Connect Supabase to upload" : "Drop logos here, or click to choose"}
      </p>
      <p className="mt-1.5 text-xs text-white/30">JPG, PNG, WebP, GIF, AVIF or SVG · up to 4 MB each · select several at once</p>
    </div>
  );
}

function ImagePicker({ onPick }: { onPick: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
      >
        Replace
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
        hidden
        onChange={(e) => { onPick(e.target.files?.[0] ?? null); e.target.value = ""; }}
      />
    </>
  );
}
