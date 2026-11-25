"use client";

import Reveal from "@/app/components/Reveal";
import type { WorkItem } from "@/lib/site-content";

/* ═══════════════════════════════════════════════════════════════════════════
   SELECTED WORK — real projects only. No invented numbers: every card says
   what we actually made, and products link to the live site.
   Shared by the desktop page and the mobile page so both stay in sync.
   ═══════════════════════════════════════════════════════════════════════ */

type CaseStudy = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  deliverables: string[];
  img: string;
  imgAlt: string;
  href?: string;
  linkLabel?: string;
  accent: "lime" | "purple";
  /** Featured cards fill a whole row on large screens. */
  wide?: boolean;
  /** Put the image on the right of a wide card. */
  flip?: boolean;
  /** Real, checkable results only (e.g. from the client's Instagram dashboard). */
  results?: { value: string; label: string }[];
  /** Fill the row on tablet (2-column) widths, so no card is left alone. */
  tabletWide?: boolean;
};

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "dine-in",
    kind: "Our product · SaaS",
    title: "Veyra Dine In",
    summary:
      "QR menu and table ordering for restaurants. Guests scan and order from their phone, the kitchen gets the ticket, and it keeps working when the internet drops.",
    deliverables: ["Product design", "Web + Windows app", "Brand", "Launch content"],
    img: "/projects/dine-in.jpg",
    imgAlt: "Veyra Dine In website showing QR table ordering on a phone and the live orders screen",
    href: "https://dinein.veyracreatives.com",
    linkLabel: "Visit live site",
    accent: "lime",
    wide: true,
  },
  {
    id: "academy",
    kind: "Our product · SaaS",
    title: "Veyra Academy",
    summary:
      "Management app for football academies: attendance in seconds, UPI fees, reminders and a parent view.",
    deliverables: ["Product design", "Web app", "SEO site"],
    img: "/projects/academy.jpg",
    imgAlt: "Veyra Academy website with the admissions board for a football academy",
    href: "https://academy.veyracreatives.com",
    linkLabel: "Visit live site",
    accent: "purple",
    wide: true,
    flip: true,
  },
  {
    id: "parke",
    kind: "Client · Kochi",
    title: "Parke",
    summary:
      "Instagram, reels and Meta ads for a parking pre-booking app in Kochi and Kozhikode, aimed at app downloads and bookings.",
    deliverables: ["Instagram", "Reels", "Meta ads", "In-app banner"],
    results: [
      { value: "11.1L", label: "Views in 30 days" },
      { value: "116K", label: "Views on one reel" },
    ],
    href: "https://www.instagram.com/parkeindia/",
    linkLabel: "See @parkeindia",
    img: "/projects/parke.jpg",
    imgAlt: "Veyra banner designed for the Parke app: Grow your brand online",
    accent: "purple",
  },
  {
    id: "brand",
    kind: "Studio · Brand",
    title: "Veyra identity & Instagram system",
    summary:
      "Our own rebrand: logo, brand book, colour and type rules, and a 10-part Instagram carousel series built from one template.",
    deliverables: ["Logo", "Brand book", "Carousel series"],
    img: "/projects/brand.jpg",
    imgAlt: "Veyra carousel cover: Your Instagram looks cheap",
    href: "https://www.instagram.com/veyralab.in/",
    linkLabel: "See on Instagram",
    accent: "lime",
  },
  {
    id: "films",
    kind: "Studio · Content",
    title: "Reels & festive stories",
    summary:
      "Short-form reels, a logo intro and festive story sets for Dhanteras, Diwali, Bhai Dooj and Gujarati New Year.",
    deliverables: ["Reels", "Motion", "Stories"],
    img: "/projects/films.jpg",
    imgAlt: "Veyra Diwali story with a gold diya",
    href: "https://www.instagram.com/veyralab.in/reels/",
    linkLabel: "Watch on Instagram",
    accent: "purple",
    tabletWide: true,
  },
];

const ACCENT = { lime: "#D6FF3F", purple: "#8B7CF6" } as const;
const mono = { fontFamily: "var(--font-mono)" } as const;
const display = { fontFamily: "var(--font-display)", fontWeight: 700 } as const;

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M5 11 11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CaseCard({ c, index }: { c: CaseStudy; index: number }) {
  const color = ACCENT[c.accent];
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101219] transition-colors duration-300 hover:border-white/[0.18] ${c.wide ? (c.flip ? "lg:flex-row-reverse" : "lg:flex-row") : ""}`}
    >
      <div className={`relative w-full overflow-hidden bg-[#0B0D12] ${c.wide ? "aspect-[16/10] lg:aspect-auto lg:min-h-[400px] lg:w-[58%] lg:shrink-0" : "aspect-[16/10]"}`}>
        <img
          src={c.img}
          alt={c.imgAlt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.04]" />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color }}>{c.kind}</p>
          <span className="shrink-0 text-[11px] tabular-nums text-white/35" style={mono}>{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div>
          <h3 className="text-2xl leading-tight sm:text-[1.7rem]" style={display}>{c.title}</h3>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">{c.summary}</p>
        {c.results && (
          <dl className="mt-5 grid grid-cols-2 gap-3">
            {c.results.map((r) => (
              <div key={r.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <dt className="sr-only">{r.label}</dt>
                <dd className="text-2xl leading-none" style={{ ...display, color }}>{r.value}</dd>
                <dd className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-white/45" style={mono}>{r.label}</dd>
              </div>
            ))}
          </dl>
        )}
        <ul className="mt-5 flex flex-wrap gap-2">
          {c.deliverables.map((d) => (
            <li key={d} className="rounded-full border border-white/[0.1] px-3 py-1 text-[11px] text-white/70" style={mono}>{d}</li>
          ))}
        </ul>
        {c.href && (
          <a
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color }}
          >
            {c.linkLabel} <Arrow />
          </a>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full" style={{ background: `linear-gradient(90deg, ${ACCENT.lime}, ${ACCENT.purple})` }} />
    </article>
  );
}

function ClientWorkCard({ w }: { w: WorkItem }) {
  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101219]">
      <div className="relative aspect-square w-full overflow-hidden">
        <img src={w.img} alt={w.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#D6FF3F]/90" style={mono}>{w.tag}</p>
        <p className="mt-1 text-[15px] leading-snug text-white" style={display}>{w.title}</p>
      </figcaption>
    </figure>
  );
}

export default function WorkSection({ work, compact = false }: { work: WorkItem[]; compact?: boolean }) {
  return (
    <section id="work" className={`relative z-10 border-t border-white/[0.06] px-6 md:px-10 ${compact ? "py-24" : "py-32"}`}>
      <div className="relative mx-auto max-w-7xl">
        <div className={`flex flex-wrap items-end justify-between gap-6 ${compact ? "mb-12" : "mb-16"}`}>
          <div>
            <Reveal><p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={mono}>Selected work</p></Reveal>
            <Reveal delay={0.08}><h2 className="max-w-2xl text-4xl leading-tight sm:text-5xl" style={display}>Things we&apos;ve built, shipped and grown.</h2></Reveal>
            <Reveal delay={0.12}><p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">Client campaigns, our own software products and the brand we built for ourselves.</p></Reveal>
          </div>
          <Reveal delay={0.16}>
            <a href="https://veyracreatives.github.io/veyra-portfolio/" target="_blank" rel="noopener noreferrer" className="group/link inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/85 transition hover:border-white/50">
              Full portfolio <Arrow />
            </a>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CASE_STUDIES.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i, 3) * 0.06} className={c.wide ? "md:col-span-2 lg:col-span-3" : c.tabletWide ? "md:col-span-2 lg:col-span-1" : ""}>
              <CaseCard c={c} index={i} />
            </Reveal>
          ))}
        </div>

        {work.length > 0 && (
          <div className={compact ? "mt-16" : "mt-24"}>
            <Reveal>
              <div className="mb-8 flex items-center gap-4">
                <p className="text-[12px] uppercase tracking-[0.25em] text-[#8B7CF6]" style={mono}>More client work</p>
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {work.map((w, i) => (
                <Reveal key={w.id} delay={Math.min(i, 5) * 0.05}>
                  <ClientWorkCard w={w} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
