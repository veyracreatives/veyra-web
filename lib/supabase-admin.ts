/* ═══════════════════════════════════════════════════════════════════════════
   SUPABASE — server-side only.

   The service-role key bypasses Row Level Security, so it must never reach the
   browser. Everything here runs inside route handlers and server components,
   and the public site reads content through /api/content rather than talking to
   Supabase directly. Do NOT import this from a "use client" file — Next would
   happily inline the service key into the browser bundle.

   If the env vars are missing the app degrades to the built-in defaults instead
   of crashing, so the public site keeps working on an unconfigured machine.
   ═══════════════════════════════════════════════════════════════════════ */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  CONTENT_ID,
  DEFAULT_CONTENT,
  normalizeContent,
  type SiteContent,
} from "@/lib/site-content";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Bucket that admin-uploaded logos / work images land in. */
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET ?? "uploads";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SERVICE_KEY);

let cached: SupabaseClient | null = null;

function admin(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cached) {
    cached = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "veyra-admin" } },
    });
  }
  return cached;
}

export type ContentResult = {
  content: SiteContent;
  /** Where the content actually came from — surfaced in the admin panel. */
  source: "supabase" | "defaults";
  error?: string;
};

/**
 * Reads the single content row. Never throws: a missing table or bad creds
 * fall back to the defaults so the public site is never broken by a backend
 * problem. `error` is returned so the admin panel can explain the fallback.
 */
export async function getContent(): Promise<ContentResult> {
  const db = admin();
  if (!db) {
    return {
      content: DEFAULT_CONTENT,
      source: "defaults",
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const { data, error } = await db
    .from("site_content")
    .select("data")
    .eq("id", CONTENT_ID)
    .maybeSingle();

  if (error) {
    return {
      content: DEFAULT_CONTENT,
      source: "defaults",
      error: `Supabase read failed: ${error.message}`,
    };
  }
  if (!data?.data) {
    // No row yet — first run. Show defaults; the admin can save to create it.
    return { content: DEFAULT_CONTENT, source: "defaults" };
  }
  return { content: normalizeContent(data.data), source: "supabase" };
}

/** Upserts the content row. Throws so the route can return a real error. */
export async function saveContent(content: SiteContent): Promise<void> {
  const db = admin();
  if (!db) throw new Error("Supabase is not configured.");

  const clean = normalizeContent(content);
  const { error } = await db.from("site_content").upsert(
    { id: CONTENT_ID, data: clean, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) throw new Error(`Supabase write failed: ${error.message}`);
}

/* ── storage ─────────────────────────────────────────────────────────── */

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Writes an uploaded image into the public bucket and returns its URL.
 *
 * The filename is always freshly generated. That matters: if an admin
 * re-uploads a logo over an existing name, any CDN or browser cache keyed on
 * that URL would keep serving the old image. A unique name sidesteps it.
 */
export async function uploadImage(file: File): Promise<string> {
  const db = admin();
  if (!db) throw new Error("Supabase is not configured.");

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported image type "${file.type}". Use JPG, PNG, WebP, GIF, AVIF or SVG.`
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 4 MB.`
    );
  }

  const ext = EXT_BY_TYPE[file.type];
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `u-${stamp}-${rand}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from(BUCKET).upload(key, buffer, {
    contentType: file.type,
    cacheControl: "31536000", // 1 year — filenames are unique, so safe
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = db.storage.from(BUCKET).getPublicUrl(key);
  if (!data?.publicUrl) throw new Error("Could not build a public URL.");
  return data.publicUrl;
}

/** Removes a previously uploaded file. Ignores anything not in our bucket. */
export async function deleteImage(src: string): Promise<void> {
  const db = admin();
  if (!db) return;
  const marker = "/storage/v1/object/public/";
  const at = src.indexOf(marker);
  if (at === -1) return; // a bundled default such as /work/*.png — leave it
  const stored = src.slice(at + marker.length).split("?")[0];

  // A public URL is /<bucket>/<object path>, but remove() is already scoped to
  // BUCKET, so it wants the object path on its own. Passing the bucket again
  // makes it look for a file literally named "<bucket>/<path>", which doesn't
  // exist — and Supabase reports no error when that happens, so the delete
  // would silently do nothing and orphan the file forever.
  const slash = stored.indexOf("/");
  const key = slash === -1 ? "" : stored.slice(slash + 1);
  if (!key || key.includes("..")) return;

  // Best-effort: the content is already saved by the time this runs, so a
  // failure here must not surface as a failed removal. Log it instead of
  // swallowing it — that silence is what hid the bug above.
  const { error } = await db.storage.from(BUCKET).remove([key]);
  if (error) console.warn(`[veyra] could not delete "${key}": ${error.message}`);
}
