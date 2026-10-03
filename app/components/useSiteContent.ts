"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/site-content";

/**
 * Reads the admin-editable content.
 *
 * State starts at DEFAULT_CONTENT so the very first paint (and the server HTML)
 * is identical to what ships today — no flash, no layout shift, and the copy
 * stays crawlable. If Supabase has content saved, it swaps in once loaded.
 *
 * If the fetch fails we simply keep the defaults: a backend outage must never
 * take the public site down.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/content", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SiteContent;
        if (!cancelled && data && Array.isArray(data.work)) setContent(data);
      } catch {
        /* keep defaults */
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
