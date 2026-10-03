-- ═══════════════════════════════════════════════════════════════════════════
--  VEYRA — admin panel storage
--
--  Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New).
--  It creates one content table plus the public bucket that admin-uploaded
--  logos and work images are written to.
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

-- ── uploads bucket ───────────────────────────────────────────────────────
-- Public read so the site can <img> the files; writes only via the service key.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

-- Service-role writes bypass RLS, so these policies only need to describe
-- public read access.
drop policy if exists "uploads are publicly readable" on storage.objects;
create policy "uploads are publicly readable"
  on storage.objects for select
  using (bucket_id = 'uploads');
