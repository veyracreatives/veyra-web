import { NextResponse } from "next/server";
import { getContent } from "@/lib/supabase-admin";

/* Public read of the editable site content. Cached briefly so a busy home page
   doesn't hammer Supabase, but short enough that an admin save shows up almost
   immediately. */
export async function GET() {
  const { content } = await getContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=60" },
  });
}
