"use client";

import type { LogoItem } from "@/lib/site-content";

/* ═══════════════════════════════════════════════════════════════════════════
   CLIENT LOGO MARQUEE

   A seamless right-to-left loop. The trick is that the track holds two
   identical copies of the logo list and the animation translates the track by
   exactly -50% — the width of one copy. When the first copy has fully scrolled
   out, the second is exactly where the first started, so the loop never shows
   a seam.

   Renders nothing at all when there are no logos, which is the requested
   behaviour: with an empty list the entire section disappears.
   ═══════════════════════════════════════════════════════════════════════ */

export default function LogoMarquee({ logos }: { logos: LogoItem[] }) {
  /* No hydration concern: the server always renders with the built-in
     defaults (no logos), so the first client paint matches the server HTML
     exactly. The strip only appears on the later render once the content
     fetch resolves — which is a normal update, not a mismatch. */
  if (logos.length === 0) return null;

  // Exactly two copies, always — that is what makes the -50% translate land
  // copy 2 precisely where copy 1 started.
  const copies = 2;

  // Loop speed scales with the list length, so the strip always takes roughly
  // the same time to travel instead of racing when there are many logos.
  const duration = Math.min(70, Math.max(22, logos.length * 3.2));

  return (
    <section
      aria-label="Clients we've worked with"
      className="relative z-10 border-t border-white/[0.06] bg-[#0B0D12] px-6 py-14 md:px-10"
    >
      <div className="relative mx-auto max-w-7xl">
        <p
          className="mb-8 text-center text-[11px] uppercase tracking-[0.3em] text-white/35"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Trusted by teams at
        </p>

        <div className="logo-marquee relative overflow-hidden">
          {/* soft fade masks on both edges so logos enter and leave gently */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0B0D12] to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0B0D12] to-transparent sm:w-28" />

          <div
            className="flex w-max animate-marquee"
            style={{ ["--marquee-duration" as string]: `${duration}s` }}
          >
            {Array.from({ length: copies }, (_, copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-4 pr-4 sm:gap-6 sm:pr-6"
                /* the second copy is decorative — screen readers already
                   announced the first one, so keep it out of the a11y tree */
                aria-hidden={copy > 0}
              >
                {logos.map((logo) => (
                  <div
                    key={`${copy}-${logo.id}`}
                    className="group flex h-16 w-32 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 transition-colors duration-300 hover:border-[#D6FF3F]/30 sm:h-20 sm:w-40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        admin-uploaded URLs are dynamic, so the optimizer's
                        build-time allowlist doesn't apply */}
                    <img
                      src={logo.src}
                      alt={logo.alt || "Client logo"}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain opacity-55 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
