/* ═══════════════════════════════════════════════════════════════════════════
   SUPABASE — server-side only, CONTENT storage.

   Holds the single editable content document (text, card fields, and the URLs
   of uploaded images). The images themselves live on Cloudinary — see
   lib/cloudinary.ts.

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
