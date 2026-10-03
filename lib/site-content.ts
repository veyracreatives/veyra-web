/* ═══════════════════════════════════════════════════════════════════════════
   SITE CONTENT — the single source of truth for everything the admin panel
   can edit, shared by the server, the API routes and the client components.

   The shape is deliberately small and flat so it round-trips through a JSONB
   column without any schema drift.
   ═══════════════════════════════════════════════════════════════════════ */

export type WorkItem = {
  id: string;
  tag: string;
  title: string;
  metric: string;
  desc: string;
  img: string;
  gradient: string;
};

export type LogoItem = {
  id: string;
  src: string;
  alt: string;
};

export type SiteContent = {
  /** Where the enquiry form sends visitors. Full international digits, no "+". */
  whatsappNumber: string;
  /** Shown next to the form and in the contact block. */
  contactEmail: string;
  /** Client logos for the marquee. Empty array => the whole section is hidden. */
  logos: LogoItem[];
  /** The "Results that outlive the campaign." cards. */
  work: WorkItem[];
};

export const CONTENT_ID = "main";

/* ── gradient presets offered in the admin UI ────────────────────────────
   Kept to a fixed list on purpose: the value is interpolated straight into a
   Tailwind class name, and Tailwind only ships classes it can see at build
   time. Free-text gradients would silently render as no gradient at all. */
export const GRADIENT_PRESETS = [
  { label: "Lime → Purple", value: "from-[#D6FF3F]/40 to-[#8B7CF6]/20" },
  { label: "Purple → Lime", value: "from-[#8B7CF6]/40 to-[#D6FF3F]/20" },
  { label: "Lime blend", value: "from-[#D6FF3F]/30 to-[#8B7CF6]/30" },
  { label: "Purple blend", value: "from-[#8B7CF6]/30 to-[#D6FF3F]/30" },
  { label: "Lime strong", value: "from-[#D6FF3F]/40 to-[#8B7CF6]/10" },
  { label: "Purple strong", value: "from-[#8B7CF6]/40 to-[#D6FF3F]/10" },
] as const;

const DEFAULT_GRADIENT = GRADIENT_PRESETS[0].value;

export const DEFAULT_WORK: WorkItem[] = [
  {
    id: "work-1",
    tag: "Local SEO",
    title: "Google Business Profile",
    metric: "+210% map views",
    desc: "Listings tuned for the map pack — more calls, more directions, more walk-ins.",
    img: "/work/googlebusiness_profile.png",
    gradient: "from-[#D6FF3F]/40 to-[#8B7CF6]/20",
  },
  {
    id: "work-2",
    tag: "Paid Media",
    title: "Performance Marketing",
    metric: "3.4× ROAS",
    desc: "Paid funnels built like lab experiments: hypothesis, test, scale, repeat.",
    img: "/work/performance_marketing.png",
    gradient: "from-[#8B7CF6]/40 to-[#D6FF3F]/20",
  },
  {
    id: "work-3",
    tag: "Production",
    title: "Shooting Videos",
    metric: "40+ shoots / mo",
    desc: "Scroll-stopping short-form and brand films — shot, lit, and cut in-house.",
    img: "/work/Shooting.png",
    gradient: "from-[#D6FF3F]/30 to-[#8B7CF6]/30",
  },
  {
    id: "work-4",
    tag: "Always-on",
    title: "Social Media Management",
    metric: "12M organic reach",
    desc: "Calendars, community, and content that keep the brand alive between launches.",
    img: "/work/socialmedia_management.png",
    gradient: "from-[#8B7CF6]/30 to-[#D6FF3F]/30",
  },
  {
    id: "work-5",
    tag: "Organic",
    title: "Website SEO",
    metric: "+180% organic traffic",
    desc: "Technical + on-page SEO engineered to compound quietly, month over month.",
    img: "/work/Website_seo.png",
    gradient: "from-[#D6FF3F]/40 to-[#8B7CF6]/10",
  },
  {
    id: "work-6",
    tag: "Full-funnel",
    title: "Performance + Content",
    metric: "−38% cost per lead",
    desc: "Creative that performs — ads and content tuned to the same north-star metric.",
    img: "/work/performance_marketing_content.png",
    gradient: "from-[#8B7CF6]/40 to-[#D6FF3F]/10",
  },
];

export const DEFAULT_CONTENT: SiteContent = {
  whatsappNumber: "918928246726",
  contactEmail: "veyracreativesdigitallab25@gmail.com",
  logos: [],
  work: DEFAULT_WORK,
};

/* ── validation ──────────────────────────────────────────────────────────
   Everything arriving from the admin is untrusted. These helpers coerce to the
   right types, drop junk, and cap lengths so a bad request can't bloat the
   database or break rendering. */

const MAX_DESC = 600;
const MAX_ITEMS = 24;

const str = (v: unknown, max: number, fallback = ""): string =>
  typeof v === "string" ? v.trim().slice(0, max) : fallback;

/** Keeps only digits — WhatsApp needs country code + number, nothing else. */
const digits = (v: unknown, fallback: string): string => {
  const cleaned = str(v, 24).replace(/\D/g, "");
  return cleaned.length >= 8 ? cleaned : fallback;
};

const isSafeUrl = (v: string): boolean =>
  /^\/[\w\-./]*$/.test(v) || /^https:\/\/[\w\-.]+/i.test(v);

/** Drops an id that could break out of the value it is interpolated into. */
const safeId = (v: unknown, fallback: string): string => {
  const s = str(v, 64);
  return /^[A-Za-z0-9_-]+$/.test(s) ? s : fallback;
};

const gradient = (v: unknown): string => {
  const s = str(v, 120);
  return GRADIENT_PRESETS.some((g) => g.value === s) ? s : DEFAULT_GRADIENT;
};

export function normalizeContent(input: unknown): SiteContent {
  const raw = (input ?? {}) as Partial<SiteContent>;

  const logos = Array.isArray(raw.logos)
    ? raw.logos
        .slice(0, MAX_ITEMS)
        .map((l, i) => {
          const src = str((l as LogoItem)?.src, 2048);
          if (!isSafeUrl(src)) return null;
          return {
            id: safeId((l as LogoItem)?.id, `logo-${i + 1}`),
            src,
            alt: str((l as LogoItem)?.alt, 120, "Client logo"),
          };
        })
        .filter((l): l is LogoItem => l !== null)
    : [];

  const work = Array.isArray(raw.work)
    ? raw.work
        .slice(0, MAX_ITEMS)
        .map((w, i) => {
          const title = str((w as WorkItem)?.title, 120);
          if (!title) return null;
          const img = str((w as WorkItem)?.img, 2048);
          return {
            id: safeId((w as WorkItem)?.id, `work-${i + 1}`),
            tag: str((w as WorkItem)?.tag, 60),
            title,
            metric: str((w as WorkItem)?.metric, 80),
            desc: str((w as WorkItem)?.desc, MAX_DESC),
            img: isSafeUrl(img) ? img : "/work/googlebusiness_profile.png",
            gradient: gradient((w as WorkItem)?.gradient),
          };
        })
        .filter((w): w is WorkItem => w !== null)
    : [];

  return {
    whatsappNumber: digits(raw.whatsappNumber, DEFAULT_CONTENT.whatsappNumber),
    contactEmail: str(raw.contactEmail, 200, DEFAULT_CONTENT.contactEmail),
    logos,
    // never let the section empty out — an empty grid reads as a broken page
    work: work.length ? work : DEFAULT_WORK,
  };
}

/** WhatsApp deep link with the enquiry pre-filled. */
export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${digits(number, DEFAULT_CONTENT.whatsappNumber)}?text=${encodeURIComponent(message)}`;
}

/** Handy for the admin: the default enquiry text shown to visitors. */
export function enquiryMessage(f: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): string {
  return `Hi Veyra!\n\nName: ${f.name}\nEmail: ${f.email}\nPhone: ${f.phone}\nMessage: ${f.message}`;
}
