"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ScrollParallax from "@/app/components/ScrollParallax";
import RevealBlock from "@/app/components/Reveal";
import ScrollAgain from "@/app/components/ScrollAgain"; 

gsap.registerPlugin(ScrollTrigger);

/* ─── palette + types (for the founder blocks) ────────── */
const ACCENTS = { lime: "#D6FF3F", purple: "#8B7CF6" } as const;
type Accent = keyof typeof ACCENTS;
type Glyph = { char: string; color: string; size: number; pos: React.CSSProperties; z: number; speed: number; delay: string };

const founderGlyphs: Glyph[] = [
  { char: "◆", color: ACCENTS.lime, size: 30, pos: { top: -22, left: -18 }, z: 70, speed: 1.4, delay: "0s" },
  { char: "▲", color: ACCENTS.purple, size: 24, pos: { bottom: -16, right: -12 }, z: 55, speed: 1.1, delay: ".6s" },
  { char: "●", color: "#F5F3EE", size: 13, pos: { top: "16%", right: -22 }, z: 85, speed: 1.7, delay: "1.1s" },
  { char: "■", color: ACCENTS.lime, size: 16, pos: { bottom: "20%", left: -24 }, z: 45, speed: 0.9, delay: ".3s" },
];

const cofounderGlyphs: Glyph[] = [
  { char: "▲", color: ACCENTS.purple, size: 30, pos: { top: -22, right: -18 }, z: 70, speed: 1.4, delay: "0s" },
  { char: "◆", color: ACCENTS.lime, size: 22, pos: { bottom: -16, left: -12 }, z: 55, speed: 1.1, delay: ".6s" },
  { char: "■", color: "#F5F3EE", size: 14, pos: { top: "20%", left: -22 }, z: 85, speed: 1.7, delay: "1.1s" },
  { char: "●", color: ACCENTS.purple, size: 18, pos: { bottom: "18%", right: -24 }, z: 45, speed: 0.9, delay: ".3s" },
];

const founderSkills = [
  { label: "Brand Strategy", value: 95 },
  { label: "Creative Direction", value: 92 },
  { label: "Storytelling & Voice", value: 90 },
  { label: "Client Vision", value: 94 },
];

const cofounderSkills = [
  { label: "UI / UX Design", value: 96 },
  { label: "Design Systems", value: 93 },
  { label: "Motion & 3D", value: 90 },
  { label: "Visual Craft", value: 95 },
];

/* ─── scroll reveal hook (home's local Reveal) ────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Scroll progress bar ─────────────────────────────── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />;
}

/* ─── Scroll Sequence (home intro, frame-by-frame) ────── */
const FRAME_COUNT = 200;
const FRAME_PREFIX = "ezgif-frame-";
const FRAME_EXT = ".jpg";
function padFrame(n: number): string {
  return String(n).padStart(3, "0");
}

function ScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const presentsRef = useRef<HTMLDivElement>(null); // ← "Veyra presents" ref
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/veyra-sequence/${FRAME_PREFIX}${padFrame(i)}${FRAME_EXT}`;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) setReady(true);
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, []);

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

  useEffect(() => {
    if (!ready) return;
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const rawProgress = -rect.top / scrollableHeight;
      const clamped = Math.min(Math.max(rawProgress, 0), 1);
      const targetFrame = Math.min(Math.round(clamped * (FRAME_COUNT - 1)), FRAME_COUNT - 1);
      if (targetFrame !== frameRef.current) {
        frameRef.current = targetFrame;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(targetFrame));
      }

      // ── Fade out "Veyra presents" as user scrolls ──
      if (presentsRef.current) {
        // Fade out over the first 25% of scroll progress
        const fadeEnd = 0.25;
        const opacity = Math.max(0, 1 - clamped / fadeEnd);
        const translateY = clamped * -40; // slight upward drift
        presentsRef.current.style.opacity = String(opacity);
        presentsRef.current.style.transform = `translateY(${translateY}px)`;
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
    <section ref={containerRef} className="relative w-full" style={{ height: `${FRAME_COUNT * 1.2}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0B0D12]">
        <canvas ref={canvasRef} className="h-full w-full object-cover" style={{ display: ready ? "block" : "none" }} />
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0B0D12]">
            <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#D6FF3F] transition-all duration-200" style={{ width: `${loadPercent}%` }} />
            </div>
            <p className="text-[12px] uppercase tracking-[0.25em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
              Loading sequence… {loadPercent}%
            </p>
          </div>
        )}

        {/* ── "Veyra presents" — left side, fades on scroll ── */}
        <div
          ref={presentsRef}
          className="pointer-events-none absolute left-6 top-1/2 z-20 -translate-y-1/2 md:left-10 lg:left-14"
          style={{ opacity: 1, transition: "opacity 0.1s linear" }}
        >
          <div className="flex flex-col gap-3">
            {/* small decorative line */}
            <div className="h-px w-10 bg-gradient-to-r from-[#D6FF3F]/80 to-transparent" />
            <p
              className="text-[11px] uppercase tracking-[0.35em] text-white/50 md:text-[12px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Veyra
            </p>
            <p
              className="text-[11px] uppercase tracking-[0.35em] text-white/30 md:text-[12px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              presents
            </p>
            {/* small decorative dot */}
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D6FF3F]/60 animate-pulse" />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/60 to-transparent" />
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
            Scroll to play
            <span className="h-8 w-px animate-pulse bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Spline showpiece ("Step inside the lab") ────────── */
function SplineShowpiece() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-32 md:px-10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[860px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B7CF6]/20 blur-[130px]" />
      <div className="pointer-events-none absolute left-[38%] top-1/2 h-[360px] w-[520px] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6FF3F]/12 blur-[130px]" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>
            Interactive · 3D
          </p>
        </Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal delay={80}>
            <h2 className="max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Step inside the lab.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="max-w-sm text-sm leading-relaxed text-white/55">
              Drag, hover, poke — this one&apos;s alive. A tiny corner of the Veyra universe you can actually play with.
            </p>
          </Reveal>
        </div>
        <Reveal delay={180}>
          <div className="group relative mt-12 overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0D12] shadow-[0_50px_140px_-40px_rgba(139,124,246,0.45)]">
            <div className="relative h-[58vh] min-h-[400px] w-full sm:h-[66vh] lg:h-[70vh]">
              <iframe
                src="https://my.spline.design/booleansinteractioncopycopy-tmPEv7BelAEG9pCQbWci6jvb-Ool/"
                frameBorder="0"
                loading="lazy"
                width="100%"
                height="100%"
                className="absolute inset-0 h-full w-full"
                title="Veyra 3D interaction"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 52%, rgba(11,13,18,0.55) 88%, rgba(11,13,18,0.9) 100%)" }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0B0D12]/80 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B0D12]/80 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/5 transition duration-500 group-hover:ring-[#D6FF3F]/25" />
              <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6FF3F]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/80" style={{ fontFamily: "var(--font-mono)" }}>
                  3D · Live
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-5 right-5 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm" style={{ fontFamily: "var(--font-mono)" }}>
                Drag to explore
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── animated skill meter (used by the portrait cards) ─ */
function SkillBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] uppercase tracking-[0.15em] text-white/55" style={{ fontFamily: "var(--font-mono)" }}>
          {label}
        </span>
        <span className="text-[12px] tabular-nums" style={{ fontFamily: "var(--font-mono)", color }}>
          {value}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            transform: on ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: `transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}ms`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── animated portrait card (founder / co-founder) ───── */
function PortraitCard({
  accent,
  eyebrow,
  name,
  role,
  quote,
  bio,
  tags,
  skills,
  socials,
  imgSrc,
  imgAlt,
  objectPosition = "center 30%",
  glyphs,
  side,
  indexLabel,
}: {
  accent: Accent;
  eyebrow: string;
  name: string;
  role: string;
  quote: string;
  bio: string;
  tags: string[];
  skills: { label: string; value: number }[];
  socials: { l: string; h: string }[];
  imgSrc: string;
  imgAlt: string;
  objectPosition?: string;
  glyphs: Glyph[];
  side: "left" | "right";
  indexLabel: string;
}) {
  const color = ACCENTS[accent];
  const sectionRef = useRef<HTMLDivElement>(null);
  const tiltWrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const wrap = tiltWrapRef.current;
    const card = cardRef.current;
    const frame = frameRef.current;
    if (!wrap || !card || !frame) return;
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
      frame.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
      frame.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
      frame.style.setProperty("--glare", "1");
    };
    const onLeave = () => {
      card.style.transform = "rotateY(0deg) rotateX(0deg)";
      frame.style.setProperty("--glare", "0");
    };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      if (imgRef.current) {
        gsap.fromTo(
          imgRef.current,
          { yPercent: -7 },
          { yPercent: 7, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } }
        );
      }
      gsap.utils.toArray<HTMLElement>(".pfloat", sectionRef.current).forEach((el) => {
        const s = parseFloat(el.dataset.speed || "1");
        gsap.to(el, { y: -80 * s, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: sectionRef }
  );

  const brackets = [
    { c: "border-l-2 border-t-2", o: "-left-3 -top-3", origin: "top left" },
    { c: "border-r-2 border-t-2", o: "-right-3 -top-3", origin: "top right" },
    { c: "border-b-2 border-l-2", o: "-bottom-3 -left-3", origin: "bottom left" },
    { c: "border-b-2 border-r-2", o: "-bottom-3 -right-3", origin: "bottom right" },
  ];

  const imageBlock = (
    <div className={side === "right" ? "lg:order-2" : "lg:order-1"}>
      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <span
          className="pointer-events-none absolute -left-5 top-1/2 hidden -translate-y-1/2 -rotate-90 whitespace-nowrap text-[11px] uppercase tracking-[0.4em] lg:block"
          style={{ fontFamily: "var(--font-mono)", color: `${color}80` }}
        >
          {indexLabel}
        </span>

        <div className="aura-blob pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] blur-3xl" style={{ background: `${color}26` }} />
        <div className="aura-blob aura-blob-2 pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] blur-3xl" style={{ background: `${accent === "lime" ? ACCENTS.purple : ACCENTS.lime}1f` }} />

        <div ref={tiltWrapRef} style={{ perspective: "1100px" }}>
          <div ref={cardRef} className="relative" style={{ transformStyle: "preserve-3d", transition: "transform 0.25s ease-out", willChange: "transform" }}>
            {brackets.map((b, i) => (
              <span
                key={i}
                className={`pointer-events-none absolute z-20 h-8 w-8 ${b.c} ${b.o}`}
                style={{
                  borderColor: color,
                  transformOrigin: b.origin,
                  transform: inView ? "scale(1)" : "scale(0)",
                  opacity: inView ? 0.8 : 0,
                  transition: `transform .6s cubic-bezier(.34,1.56,.64,1) ${0.15 + i * 0.08}s, opacity .4s ease ${0.15 + i * 0.08}s`,
                }}
              />
            ))}

            <div
              ref={frameRef}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border shadow-[inset_0_0_90px_rgba(11,13,18,0.6)]"
              style={{ borderColor: `${color}33`, ["--gx" as any]: "50%", ["--gy" as any]: "30%", ["--glare" as any]: "0" }}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt={imgAlt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-115 object-cover"
                style={{ objectPosition, willChange: "transform", filter: "contrast(1.06) saturate(0.95) brightness(0.97)" }}
              />
              <div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: `linear-gradient(150deg, ${color}cc, transparent 55%, ${accent === "lime" ? ACCENTS.purple : ACCENTS.lime}99)` }} />
              <div className="grain pointer-events-none absolute inset-0" />
              <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-white/40 to-transparent mix-blend-soft-light" />
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{ background: "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.32), transparent 45%)", opacity: "var(--glare)" }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0B0D12]/85 to-transparent" />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: color }} />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/80" style={{ fontFamily: "var(--font-mono)" }}>
                  Portrait / Live
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm" style={{ fontFamily: "var(--font-mono)", color: `${color}cc` }}>
                Est. Veyra
              </div>
            </div>

            {glyphs.map((g, i) => (
              <div key={i} className="pfloat pointer-events-none absolute z-30" data-speed={g.speed} style={g.pos}>
                <div style={{ transform: `translateZ(${g.z}px)` }}>
                  <span className="float-slow block" style={{ animationDelay: g.delay, color: g.color, fontSize: g.size, lineHeight: 1, filter: `drop-shadow(0 0 14px ${g.color}66)` }}>
                    {g.char}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const textBlock = (
    <div className={side === "right" ? "lg:order-1" : "lg:order-2"}>
      <Reveal>
        <span className="inline-block rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", borderColor: `${color}55`, color: `${color}dd` }}>
          {role}
        </span>
      </Reveal>
      <Reveal delay={80}>
        <h3 className="mt-6 text-5xl sm:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
          {name}
        </h3>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg">{bio}</p>
      </Reveal>
      <Reveal delay={200}>
        <div className="mt-8 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
            Core skills
          </p>
          {skills.map((s, i) => (
            <SkillBar key={s.label} label={s.label} value={s.value} color={color} delay={i * 120} />
          ))}
        </div>
      </Reveal>
      <Reveal delay={260}>
        <div className="mt-7 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-white/55" style={{ fontFamily: "var(--font-mono)" }}>
              {t}
            </span>
          ))}
        </div>
      </Reveal>
      <Reveal delay={320}>
        <blockquote className="mt-8 border-l-2 pl-5 text-lg italic leading-relaxed text-white/75 sm:text-xl" style={{ borderColor: `${color}99` }}>
          &ldquo;{quote}&rdquo;
        </blockquote>
      </Reveal>
      <Reveal delay={380}>
        <div className="mt-8 flex flex-wrap gap-3">
          {socials.map((s) => (
            <a
              key={s.l}
              href={s.h}
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-white/70 transition hover:text-white"
              style={{ fontFamily: "var(--font-mono)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}99`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
            >
              {s.l}
            </a>
          ))}
        </div>
      </Reveal>
    </div>
  );

  return (
    <section ref={sectionRef} className="relative border-t border-white/[0.06] px-6 py-28 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="mb-4 text-[12px] uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)", color }}>
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mb-14 max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
            {side === "left" ? "The vision behind the lab." : "The face behind the pixels."}
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {imageBlock}
          {textBlock}
        </div>
      </div>
    </section>
  );
}

/* ─── data ───────────────────────────────────────────── */
const capabilities = [
  { tag: "Strategy", title: "Brand & Positioning", desc: "Sharpening who you are before we say a word about it — narrative, voice, and visual identity built to travel.", icon: "◆" },
  { tag: "Performance", title: "Paid Growth Systems", desc: "Media buying and funnel architecture engineered like a lab experiment: hypothesis, test, scale.", icon: "▲" },
  { tag: "Content", title: "Social & Content Studio", desc: "A production line for scroll-stopping content — short-form, campaigns, and always-on organic.", icon: "●" },
  { tag: "Product", title: "Web & Product Design", desc: "Interfaces and sites that feel inevitable — fast, considered, and built to convert.", icon: "■" },
];

const work = [
  {
    tag: "Local SEO",
    title: "Google Business Profile",
    metric: "+210% map views",
    desc: "Listings tuned for the map pack — more calls, more directions, more walk-ins.",
    img: "/work/googlebusiness_profile.png",
    gradient: "from-[#D6FF3F]/40 to-[#8B7CF6]/20",
  },
  {
    tag: "Paid Media",
    title: "Performance Marketing",
    metric: "3.4× ROAS",
    desc: "Paid funnels built like lab experiments: hypothesis, test, scale, repeat.",
    img: "/work/performance_marketing.png",
    gradient: "from-[#8B7CF6]/40 to-[#D6FF3F]/20",
  },
  {
    tag: "Production",
    title: "Shooting Videos",
    metric: "40+ shoots / mo",
    desc: "Scroll-stopping short-form and brand films — shot, lit, and cut in-house.",
    img: "/work/Shooting.png",
    gradient: "from-[#D6FF3F]/30 to-[#8B7CF6]/30",
  },
  {
    tag: "Always-on",
    title: "Social Media Management",
    metric: "12M organic reach",
    desc: "Calendars, community, and content that keep the brand alive between launches.",
    img: "/work/socialmedia_management.png",
    gradient: "from-[#8B7CF6]/30 to-[#D6FF3F]/30",
  },
  {
    tag: "Organic",
    title: "Website SEO",
    metric: "+180% organic traffic",
    desc: "Technical + on-page SEO engineered to compound quietly, month over month.",
    img: "/work/Website_seo.png",
    gradient: "from-[#D6FF3F]/40 to-[#8B7CF6]/10",
  },
  {
    tag: "Full-funnel",
    title: "Performance + Content",
    metric: "−38% cost per lead",
    desc: "Creative that performs — ads and content tuned to the same north-star metric.",
    img: "/work/performance_marketing_content.png",
    gradient: "from-[#8B7CF6]/40 to-[#D6FF3F]/10",
  },
];

const workStats = [
  { value: "250+", label: "Projects shipped" },
  { value: "40+", label: "Brands scaled" },
  { value: "4.9★", label: "Avg. rating" },
  { value: "98%", label: "Would refer us" },
];

const philosophy = [
  { num: "01", text: "We don't guess — we build hypotheses, run experiments, and let data lead." },
  { num: "02", text: "Every pixel and every penny should earn its place." },
  { num: "03", text: "Great work outlives the campaign that launched it." },
];

/* ═══════════════════════════════════════════════════════
   MANIFESTO SECTION — TRIMMED (only hello.webp remains)
   ═══════════════════════════════════════════════════════ */

function ManifestoSequence() {
  return (
    <section className="relative w-full bg-[#0B0D12]" style={{ height: `100vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0B0D12]">
        <img
          src="/veyra-sequence-again/hello.webp"
          alt="Hero Animation"
          className="h-full w-full object-cover"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/60 to-transparent" />
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500">
          <div className="flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
            Scroll to explore
            <span className="h-8 w-px animate-pulse bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ManifestoSection() {
  return (
    <div>
      <ManifestoSequence />
      {/* ── Everything below hello.webp removed — ready for your new content ── */}
    </div>
  );
}

/* ─── HOME PAGE COMPONENT ─────────────────────────────── */
export default function Home() {
  return (
    <main>
      <ScrollProgress />

      {/* 1. SCROLL SEQUENCE (cinematic intro) — now with "Veyra presents" */}
      <ScrollSequence />

      {/* 2. HERO */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden border-t border-white/[0.06] px-6 md:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[65%]" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -12%, rgba(255,150,80,0.18), rgba(255,120,60,0.06) 35%, transparent 72%)" }} />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-[#8B7CF6]/15 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#D6FF3F]/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <div style={{ backgroundImage: "radial-gradient(circle, #F5F3EE 1px, transparent 1px)", backgroundSize: "32px 32px", width: "100%", height: "100%" }} />
        </div>
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <Reveal>
              <p className="mb-5 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]/90" style={{ fontFamily: "var(--font-mono)" }}>
                Digital Marketing × Creative Lab
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="veyra-shimmer text-7xl leading-[0.92] sm:text-8xl lg:text-[9rem]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                VEYRA
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                We build brands, campaigns, and products that behave like living things — shaped, tested, and set loose in the world.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="#contact" className="rounded-full bg-[#D6FF3F] px-6 py-3 text-sm font-medium text-black transition hover:bg-white hover:scale-105">
                  Start a project
                </a>
                <a href="#work" className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/85 transition hover:border-white/50 hover:scale-105">
                  See our work
                </a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-16 flex items-center gap-4">
                <div className="h-px w-24 bg-gradient-to-r from-[#D6FF3F]/60 to-transparent" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] animate-pulse" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. PHILOSOPHY */}
      <section className="parallax-section relative border-t border-white/[0.06] px-6 py-36 md:px-10 md:py-44">
        <ScrollParallax speed={0.5} direction="up" className="absolute inset-0 pointer-events-none">
          <div className="parallax-bg-orb" style={{ width: 500, height: 500, top: "-10%", left: "-8%", background: "radial-gradient(circle, #8B7CF6 0%, transparent 70%)" }} />
        </ScrollParallax>
        <ScrollParallax speed={0.3} direction="down" className="absolute inset-0 pointer-events-none">
          <div className="parallax-bg-orb" style={{ width: 400, height: 400, bottom: "-5%", right: "-5%", background: "radial-gradient(circle, #D6FF3F 0%, transparent 70%)" }} />
        </ScrollParallax>
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
          <div style={{ backgroundImage: "radial-gradient(circle, #F5F3EE 1px, transparent 1px)", backgroundSize: "32px 32px", width: "100%", height: "100%" }} />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>
              Our philosophy
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-3xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Marketing is a science. <span className="text-white/30">Branding is an art.</span>{" "}
              <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">We practice both.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="my-16 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-[#D6FF3F]/60 via-[#8B7CF6]/40 to-transparent origin-left" />
              <div className="h-2 w-2 rounded-full bg-[#D6FF3F] animate-pulse" />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-0 md:grid-cols-3 md:gap-8">
            {philosophy.map((p, i) => (
              <ScrollParallax key={p.num} speed={0.12 + i * 0.06} direction="up">
                <Reveal delay={280 + i * 120}>
                  <div className="group relative py-8 md:py-0">
                    <p className="mb-4 text-5xl font-bold text-white/[0.04] transition-colors duration-500 group-hover:text-[#D6FF3F]/20" style={{ fontFamily: "var(--font-display)" }}>
                      {p.num}
                    </p>
                    <p className="text-base leading-relaxed text-white/55 transition-colors duration-500 group-hover:text-white/80 sm:text-lg">{p.text}</p>
                    <div className="mt-6 h-px w-12 bg-white/10 transition-all duration-500 group-hover:w-20 group-hover:bg-[#D6FF3F]/50 md:block" />
                  </div>
                </Reveal>
              </ScrollParallax>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CAPABILITIES */}
      <section id="capabilities" className="relative border-t border-white/[0.06] px-6 py-32 md:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#8B7CF6]" style={{ fontFamily: "var(--font-mono)" }}>
              What we build
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-2xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Full-spectrum growth, run like a lab — not a portfolio of favors.
            </h2>
          </Reveal>
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.06] sm:grid-cols-2">
            {capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 90}>
                <div className="group h-full bg-[#0B0D12] p-8 transition-all duration-300 hover:bg-[#12141b] md:p-10 relative overflow-hidden">
                  <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#D6FF3F]/0 transition-all duration-500 blur-[60px] group-hover:bg-[#D6FF3F]/10" />
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <p className="text-[12px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                        {cap.tag}
                      </p>
                      <span className="text-lg text-white/10 transition-all duration-300 group-hover:text-[#D6FF3F]/40 group-hover:scale-125">{cap.icon}</span>
                    </div>
                    <h3 className="mb-3 text-2xl transition group-hover:text-[#D6FF3F]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                      {cap.title}
                    </h3>
                    <p className="max-w-sm text-[15px] leading-relaxed text-white/55">{cap.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

{/* 5. SELECTED WORK */}
<section id="work" className="relative border-t border-white/[0.06] px-6 py-32 md:px-10">
  <div className="mx-auto max-w-7xl">
    <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
      <div>
        <Reveal>
          <p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>
            Selected work
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
            Results that outlive the campaign.
          </h2>
        </Reveal>
      </div>
      <Reveal delay={120}>
        <a href="#contact" className="whitespace-nowrap text-sm text-white/60 underline underline-offset-4 transition hover:text-white">
          View all case studies →
        </a>
      </Reveal>
    </div>

    {/* ── 6 work cards ─────────────────────────────────── */}
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {work.map((w, i) => (
        <Reveal key={w.title} delay={i * 90}>
          <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12141b] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15]">
            {/* image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img
                src={w.img}
                alt={w.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* bottom fade so the card body blends in */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12141b] via-[#12141b]/10 to-transparent" />
              {/* accent tint on hover */}
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${w.gradient} opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-50`} />
              {/* category pill */}
              <span
                className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {w.tag}
              </span>
              {/* index number */}
              <span
                className="absolute right-4 top-4 text-[11px] tabular-nums text-white/45"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            {/* body */}
            <div className="relative flex flex-1 flex-col p-6">
              <h3 className="text-xl transition-colors duration-300 group-hover:text-[#D6FF3F] sm:text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                {w.title}
              </h3>
              <p className="mt-2 text-[13px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "#D6FF3F" }}>
                {w.metric}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{w.desc}</p>
            </div>

            {/* hover underline */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] transition-all duration-500 group-hover:w-full" />
          </div>
        </Reveal>
      ))}
    </div>

    {/* ── social-proof band ────────────────────────────── */}
    <Reveal delay={120}>
      <div className="mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D12]">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {workStats.map((s) => (
            <div key={s.label} className="border-white/[0.06] px-6 py-9 text-center [&:not(:nth-child(2n))]:border-r sm:[&:not(:nth-child(2n))]:border-r-0 sm:[&:not(:first-child)]:border-l">
              <p
                className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-3xl text-transparent sm:text-4xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                {s.value}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] px-6 py-5 text-center">
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
            …and <span className="text-[#D6FF3F]">100+ more happy customers</span> — and counting.
          </p>
        </div>
      </div>
    </Reveal>
  </div>
</section>

      {/* 6. CONTACT / CTA */}
      <section id="contact" className="relative border-t border-white/[0.06] px-6 py-32 md:px-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
          <div style={{ backgroundImage: "radial-gradient(circle, #D6FF3F 1px, transparent 1px)", backgroundSize: "40px 40px", width: "100%", height: "100%", animation: "float-drift 20s ease-in-out infinite" }} />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <p className="mb-6 text-[12px] uppercase tracking-[0.25em] text-[#8B7CF6]" style={{ fontFamily: "var(--font-mono)" }}>
              Let&apos;s talk
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-3xl text-4xl leading-[1.05] sm:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Let&apos;s build something
              <br />
              no one&apos;s seen yet.
            </h2>
          </Reveal>
<Reveal delay={160}>
  <div className="mt-12 flex flex-wrap items-center gap-6">
    <a
      href="mailto:veyracreativesdigitallab25@gmail.com"
      className="rounded-full bg-[#D6FF3F] px-7 py-4 text-sm font-medium text-black transition-all duration-300 hover:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(214,255,63,0.3)]"
    >
      veyracreativesdigitallab25@gmail.com
    </a>
    <a
      href="https://wa.me/918928246726?text=Hi%20Veyra!%20I%27d%20love%20to%20start%20a%20project."
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-white/20 px-7 py-4 text-sm text-white/85 transition-all duration-300 hover:border-[#25D366]/70 hover:text-white hover:scale-105"
    >
      Chat Right now!
    </a>
  </div>
</Reveal>
        </div>
      </section>

      {/* 7. SPLINE SHOWPIECE */}
      <SplineShowpiece />

      {/* 8. MEET THE FOUNDERS — intro */}
      <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-28 md:px-10">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[#D6FF3F]/[0.08] blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-[#8B7CF6]/[0.12] blur-[120px]" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <p className="mb-5 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>
              Meet the lab
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="max-w-3xl text-4xl leading-[1.02] sm:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Two founders. One{" "}
              <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">obsession.</span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
              The people behind the pixels and the performance — strategy and craft, sitting at the same table.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 9. FOUNDER */}
      <PortraitCard
        accent="lime"
        side="left"
        eyebrow="The founder"
        indexLabel="Founder — Veyra Lab"
        name="Rutvi"
        role="Founder & Creative Director"
        imgSrc="/founder.jpg"
        imgAlt="Veyra founder portrait"
        objectPosition="center 28%"
        glyphs={founderGlyphs}
        bio="Started Veyra with a stubborn belief: that brands deserve more than templates and guesswork. Rutvi leads the studio's creative vision — translating messy ambitions into identities, products, and campaigns that actually move numbers. Part strategist, part art director, fully obsessed with the details most people scroll past."
        tags={["Vision", "Brand Strategy", "Creative Direction", "Storytelling"]}
        skills={founderSkills}
        quote="We're not here to make pretty things. We're here to make pretty things that pay the rent."
        socials={[
          { l: "LinkedIn", h: "#" },
          { l: "Twitter", h: "#" },
          { l: "Email", h: "mailto:veyracreativesdigitallab@gmail.com" },
        ]}
      />

      {/* 10. CO-FOUNDER */}
      <PortraitCard
        accent="purple"
        side="right"
        eyebrow="The co-founder"
        indexLabel="Co-Founder — Design Lead"
        name="Dibesh"
        role="Co-Founder & Design Lead"
        imgSrc="/cofounder.jpg"
        imgAlt="Veyra co-founder portrait"
        objectPosition="center 30%"
        glyphs={cofounderGlyphs}
        bio="The hand behind every interface that leaves the studio. Dibesh turns strategy into systems — pixels that behave, motion that means something, and design that holds together at every breakpoint. Quietly competitive, loudly detailed, and the reason our work feels inevitable."
        tags={["UI / UX", "Design Systems", "Motion", "Prototyping"]}
        skills={cofounderSkills}
        quote="Good design is invisible until you take it away. I make sure no one at Veyra ever finds out what that feels like."
        socials={[
          { l: "Instagram", h: "#" },
          { l: "Behance", h: "#" },
          { l: "Dribbble", h: "#" },
        ]}
      />

      {/* 11. MANIFESTO — now only shows hello.webp, rest removed */}
      <ManifestoSection />
      <ScrollAgain />     
      

      {/* keyframes */}
      <style jsx global>{`
        .veyra-shimmer {
          background: linear-gradient(100deg, #f5f3ee 0%, #d6ff3f 25%, #8b7cf6 50%, #f5f3ee 75%, #d6ff3f 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: veyra-shimmer-move 6s linear infinite;
        }
        @keyframes veyra-shimmer-move {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 300% 50%;
          }
        }
        @keyframes float-drift {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(14px, -10px);
          }
        }

        .float-slow {
          animation: veyra-float 5s ease-in-out infinite;
        }
        @keyframes veyra-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .scan-line {
          animation: veyra-scan 4.5s ease-in-out infinite;
        }
        @keyframes veyra-scan {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(520%);
            opacity: 0;
          }
        }

        .aura-blob {
          animation: veyra-aura 9s ease-in-out infinite;
        }
        .aura-blob-2 {
          animation-delay: -4.5s;
        }
        @keyframes veyra-aura {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(12px, -10px) scale(1.08);
          }
        }

        .grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          opacity: 0.16;
        }

        .scale-115 {
          transform: scale(1.15);
        }

        @media (prefers-reduced-motion: reduce) {
          .veyra-shimmer {
            animation: none;
            background-position: 0% 50%;
          }
          .float-slow,
          .scan-line,
          .aura-blob {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}