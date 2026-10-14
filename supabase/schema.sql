-- ═══════════════════════════════════════════════════════════════════════════
--  VEYRA — admin panel content storage
--
--  Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New).
--  It creates the single content table that holds all editable site content.
--
--  Uploaded images are NOT stored here — logos and work-card images live on
--  Cloudinary (see lib/cloudinary.ts and the CLOUDINARY_* vars in .env.local).
--  Supabase only stores the content document, including the Cloudinary URLs.
--
--  Nothing here uses Row Level Security because every read and write goes
--  through this app's server using the service-role key. If you ever expose
--  Supabase directly to the browser, enable RLS first.
-- ═══════════════════════════════════════════════════════════════════════

-- ── content ──────────────────────────────────────────────────────────────
-- One row (id = 'main') holds the whole editable site content as JSON, so the
-- admin panel saves atomically and the document shape can never drift out of
-- sync with the TypeScript types in lib/site-content.ts.
create table if not exists public.site_content (
  id         text primary key,
  data       jsonb        not null default '{}'::jsonb,
  updated_at timestamptz  not null default now()
);

alter table public.site_content enable row level security;

insert into public.site_content (id, data)
values (
  'main',
  '{
    "whatsappNumber": "918928246726",
    "contactEmail": "veyracreativesdigitallab25@gmail.com",
    "logos": [],
    "work": []
  }'::jsonb
)
on conflict (id) do nothing;
