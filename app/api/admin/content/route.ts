import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { getContent, saveContent, isSupabaseConfigured } from "@/lib/supabase-admin";
import { normalizeContent, type SiteContent } from "@/lib/site-content";

/** Read the current content plus the health of the backend connection. */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const { content, source, error } = await getContent();
  return NextResponse.json({
    ok: true,
    content,
    source,
    configured: isSupabaseConfigured,
    backendError: error ?? null,
  });
}

/** Overwrite the content document. */
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured — see .env.local." },
      { status: 503 }
    );
  }

  let incoming: SiteContent;
  try {
    incoming = normalizeContent(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  try {
    await saveContent(incoming);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, content: incoming });
}
