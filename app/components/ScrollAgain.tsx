"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ─── config ────────────────────────────────────────────
   Frames live in /public/veyra-seq/ezgif-frame-001.jpg … 300.jpg
   Tune SCROLL_MULT to change how long the scroll feels:
     higher = smoother / longer scroll, lower = snappier.
─────────────────────────────────────────────────────── */
const FRAME_COUNT = 300;
const FRAME_PREFIX = "ezgif-frame-";
const FRAME_EXT = ".jpg";
const SCROLL_MULT = 1.0; // outer height = FRAME_COUNT * SCROLL_MULT (in vh)

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// linear ramp from 0→1 as `p` travels from `start`→`end`
const ramp = (p: number, start: number, end: number) =>
  clamp01((p - start) / (end - start));

export default function ScrollAgain() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);

  // scroll-choreographed overlays
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);

  /* ── preload frames ─────────────────────────────────── */
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/veyra-seq/${FRAME_PREFIX}${pad(i)}${FRAME_EXT}`;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) setReady(true);
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, []);

  /* ── draw a single frame to the canvas ──────────────── */
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }, []);

  /* ── scroll → frame + text choreography ─────────────── */
  useEffect(() => {
    if (!ready) return;

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const clamped = clamp01(-rect.top / scrollableHeight);

      // 1) frame playback
      const targetFrame = Math.min(
        Math.round(clamped * (FRAME_COUNT - 1)),
        FRAME_COUNT - 1
      );
      if (targetFrame !== frameRef.current) {
        frameRef.current = targetFrame;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(targetFrame));
      }

      // 2) top-right copy — reveals early (vine starts growing)
      if (topRightRef.current) {
        const t = ramp(clamped, 0.12, 0.34);
        topRightRef.current.style.opacity = String(t);
        topRightRef.current.style.transform = `translateY(${(1 - t) * 26}px)`;
      }

      // 3) bottom-right copy — reveals later (vine nearly full)
      if (bottomRightRef.current) {
        const t = ramp(clamped, 0.5, 0.74);
        bottomRightRef.current.style.opacity = String(t);
        bottomRightRef.current.style.transform = `translateY(${(1 - t) * 26}px)`;
      }

      // 4) scroll hint — fades out fast
      if (hintRef.current) {
        hintRef.current.style.opacity = String(clamp01(1 - clamped / 0.1));
      }

      // 5) bottom progress line — "grows" with the vine
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${clamped})`;
      }
    };

    drawFrame(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [ready, drawFrame]);

  const loadPercent = Math.round((loadedCount / FRAME_COUNT) * 100);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#07222b]"
      style={{ height: `${FRAME_COUNT * SCROLL_MULT}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#07222b]">
        {/* frame canvas */}
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover"
          style={{ display: ready ? "block" : "none" }}
        />

        {/* loader */}
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#07222b]">
            <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#D6FF3F] transition-all duration-200"
                style={{ width: `${loadPercent}%` }}
              />
            </div>
            <p
              className="text-[12px] uppercase tracking-[0.25em] text-white/40"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Loading sequence… {loadPercent}%
            </p>
          </div>
        )}

        {/* ── legibility scrims (keep the vine bright in the middle) ── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/35 to-transparent" />

        {/* ── editorial label, top-left (stays clear of the vine) ── */}
        <div className="pointer-events-none absolute left-6 top-6 md:left-10 md:top-8">
          <p
            className="text-[10px] uppercase tracking-[0.35em] text-white/35"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Veyra — seq. 02 / growth
          </p>
        </div>

        {/* ── TOP-RIGHT copy block ─────────────────────────────── */}
        <div
          ref={topRightRef}
          className="pointer-events-none absolute right-6 top-[13%] max-w-xs text-right md:right-12 md:max-w-sm lg:right-16"
          style={{ opacity: 0, transform: "translateY(26px)" }}
        >
          <div className="mb-4 ml-auto h-px w-12 bg-gradient-to-l from-[#D6FF3F]/80 to-transparent" />
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#D6FF3F]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Growth, observed
          </p>
          <h2
            className="text-3xl leading-[1.05] text-white sm:text-4xl lg:text-5xl"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              textShadow: "0 2px 30px rgba(0,0,0,0.55)",
            }}
          >
            We don&apos;t force it.
            <br />
            <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">
              We grow it.
            </span>
          </h2>
          <p
            className="mt-4 text-sm leading-relaxed text-white/70"
            style={{ textShadow: "0 1px 18px rgba(0,0,0,0.6)" }}
          >
            Real brands behave like living things — they need the right soil,
            light, and time. We tend the conditions until momentum takes root.
          </p>
        </div>

        {/* ── BOTTOM-RIGHT copy block ──────────────────────────── */}
        <div
          ref={bottomRightRef}
          className="pointer-events-none absolute bottom-[13%] right-6 max-w-xs text-right md:right-12 md:max-w-sm lg:right-16"
          style={{ opacity: 0, transform: "translateY(26px)" }}
        >
          <blockquote
            className="text-base italic leading-relaxed text-white/85 sm:text-lg"
            style={{ textShadow: "0 1px 18px rgba(0,0,0,0.6)" }}
          >
            &ldquo;Every leaf on that vine is a decision we tested before we let
            it grow.&rdquo;
          </blockquote>
          <div className="mt-5 flex items-center justify-end gap-3">
            <span
              className="text-[10px] uppercase tracking-[0.25em] text-white/45"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Creative × Digital Lab
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] animate-pulse" />
          </div>
          <a
            href="#work"
            className="pointer-events-auto mt-5 inline-block rounded-full border border-white/20 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm transition hover:border-[#D6FF3F]/70 hover:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            See the work →
          </a>
        </div>

        {/* ── scroll hint (fades out) ──────────────────────────── */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div
            className="flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Scroll to grow
            <span className="h-8 w-px animate-pulse bg-white/40" />
          </div>
        </div>

        {/* ── bottom progress line (grows with the vine) ───────── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
          <div
            ref={progressRef}
            className="h-full origin-left bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}