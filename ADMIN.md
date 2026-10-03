# Admin panel — `/admin_veyra`

A small password-gated panel for editing the parts of the home page that change
often: the enquiry form's WhatsApp number, the client-logo strip, and the
"Results that outlive the campaign." cards.

Sign in at **http://localhost:3000/admin_veyra**

| | |
|---|---|
| ID | `Dibesh` |
| Password | `mady1007mady` |

Both are overridable with `ADMIN_USER` / `ADMIN_PASSWORD` — see
`.env.local.example`.

---

## One-time setup

Content is stored in **Supabase**. Without it the panel still loads and the site
still works, but it shows a "Backend not connected" banner and saving is
disabled.

**1. Create the table and the upload bucket**

Supabase Dashboard → **SQL Editor** → **New query**, paste the whole of
[`supabase/schema.sql`](supabase/schema.sql), and run it. It creates:

- `site_content` — one row (`id = 'main'`) holding all editable content as JSON
- the public `uploads` storage bucket that logo and card images land in

**2. Add the keys**

```bash
cp .env.local.example .env.local
```

Then fill in two values from Supabase → **Project Settings** → **API Keys**
(there is no separate "Data API" page any more — every key, old and new,
lives on that one page):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

> **Which key:** use the one labelled **Secret key** (`sb_secret_…`). Don't use
> the `anon` / publishable key — this table has row-level security enabled with
> no policies, so a low-privilege key can neither read nor write it.
>
> The legacy **`service_role`** key (a long `eyJ…` JWT) works exactly the same
> and is still accepted; Supabase is deprecating it at the end of 2026, so
> prefer the new secret key.
>
> Either way it must stay on the server — it bypasses row-level security, and
> every read and write goes through this app's API routes. `.env*` is
> gitignored, so it stays out of git.

Restart the dev server afterwards. The banner in the panel turns into
"Connected — showing saved content" and **Save changes** becomes active.

---

## What you can edit

**Contact & form** — the WhatsApp number the enquiry form opens, and the contact
email shown under the form and in the CTA button. Both take effect across the
desktop and mobile home pages.

**Logos** — drag-and-drop or click to upload several images at once (JPG, PNG,
WebP, GIF, AVIF or SVG, up to 4 MB each). Reorder with the arrows; that is the
order they scroll in. Each upload is given a freshly generated filename so
replacing an image never serves a stale cached copy.

The strip scrolls continuously from right to left, loops seamlessly, pauses while
your pointer is over it, and respects `prefers-reduced-motion`. **If there are
no logos the whole section does not render at all** — add one and it appears.

**Work** — the six cards. Edit tag, metric, title, description, hover tint and
image; add or remove cards; reorder them. Saving with every card removed
restores the six defaults, so the section is never left empty.

Edits are staged locally and only reach the live site when you press
**Save changes**, so a half-finished edit is never published. The live site
picks up changes within a few seconds.

---

## How it works

```
/admin_veyra            server component; shows the login form or the dashboard
  └─ /api/admin/login   checks credentials, sets an httpOnly signed cookie
  └─ /api/admin/content GET / PUT — read and write the content document
  └─ /api/admin/upload  POST / DELETE — images in and out of Supabase Storage

/                       the public site
  └─ /api/content       public read, cached ~15s
  └─ app/components/useSiteContent.ts   fetches it on the client
```

| File | Role |
|---|---|
| `lib/site-content.ts` | Types, defaults, validation, `whatsappLink()`. Single source of truth. |
| `lib/supabase-admin.ts` | Server-only Supabase client. Falls back to defaults if unconfigured. |
| `lib/admin-auth.ts` | Credential check, HMAC-signed session cookie, brute-force throttle. |

Notes:

- The credentials and the service-role key are **never** sent to the browser. The
  auth gate runs in a server component, so an unauthenticated visitor does not
  receive the dashboard's code or data.
- The home page renders the built-in defaults on the server and swaps in saved
  content once the fetch resolves. If the fetch fails, the defaults stay — a
  backend outage can never take the public site down.
- Login is throttled to 8 attempts per 10 minutes per process.
- Without `ADMIN_SESSION_SECRET` the signing key is derived from the user and
  password. Set an explicit secret in production so changing either credential
  does not invalidate the key format.