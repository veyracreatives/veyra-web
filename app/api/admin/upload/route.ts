import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import {
  uploadImage,
  deleteImage,
  isSupabaseConfigured,
  MAX_UPLOAD_BYTES,
} from "@/lib/supabase-admin";

/* Accepts a single image and returns its public URL. The filename is generated
   server-side, so a hostile client can't choose where the file lands. */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured — see .env.local." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 4 MB.`,
      },
      { status: 413 }
    );
  }

  try {
    const url = await uploadImage(file);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

/* Best-effort cleanup when an admin removes a logo or swaps a work image. */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  try {
    const { src } = (await request.json()) as { src?: string };
    if (typeof src === "string" && src) await deleteImage(src);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
}
