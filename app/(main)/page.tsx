"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ScrollParallax from "@/app/components/ScrollParallax";
import RevealBlock from "@/app/components/Reveal";
import MobileExtend from "@/app/components/mobileextend";



gsap.registerPlugin(ScrollTrigger);

/* ─── palette + types ────────────────────────────────── */
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

/* ─── scroll reveal hook ─────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════
   AMBIENT TYPE FIELD — kinetic typography background
   ═══════════════════════════════════════════════════════ */

type FieldLayer = "back" | "front";

interface GlyphAccent {
  char: string;
  size: number;
  pos: React.CSSProperties;
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
}

interface WordConfig {
  text: string;
  color: string;
  fontSize: number;
  strokeWidth: number;
  baseOpacity: number;
  layer: FieldLayer;
  axis: "horizontal" | "diagonal" | "vertical";
  speed: number;
  angle: number;
  startX: number;
  startY: number;
  pulseFreq: number;
  pulsePhase: number;
  glitchInterval: number;
  glitchTimer: number;
  glitchActive: boolean;
  glitchStart: number;
  glitchDuration: number;
  glyphs: GlyphAccent[];
}

interface WordState {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  cursorSkewX: number;
  cursorSkewY: number;
  cursorOpacityBoost: number;
  glitchOffsetX: number;
  glitchOffsetY: number;
  glitchSkew: number;
  glitchSplit: number;
  scanSolid: boolean;
}

const LIME = "#D6FF3F";
const PURPLE = "#8B7CF6";
const OFFWHITE = "#F5F3EE";
const SCAN_PERIOD = 7000;
const LINE_POOL = 8;

const FIELD_WORDS: WordConfig[] = [
  {
    text: "STRATEGY", color: LIME, fontSize: 21, strokeWidth: 1.5, baseOpacity: 0.12,
    layer: "front", axis: "horizontal", speed: 0.42, angle: 0, startX: 0.06, startY: 0.1,
    pulseFreq: 0.0004, pulsePhase: 0, glitchInterval: 12000, glitchTimer: 0,
    glitchActive: false, glitchStart: 0, glitchDuration: 220,
    glyphs: [
      { char: "◆", size: 13, pos: { left: -26, bottom: "18%" }, orbitRadius: 10, orbitSpeed: 0.0009, phase: 0.4 },
      { char: "▲", size: 11, pos: { right: -20, top: "6%" }, orbitRadius: 7, orbitSpeed: 0.0012, phase: 2.1 },
    ],
  },
  {
    text: "CREATIVE", color: OFFWHITE, fontSize: 16, strokeWidth: 1, baseOpacity: 0.11,
    layer: "front", axis: "horizontal", speed: -0.52, angle: 0, startX: 0.72, startY: 0.46,
    pulseFreq: 0.0005, pulsePhase: 2.5, glitchInterval: 11000, glitchTimer: 0,
    glitchActive: false, glitchStart: 0, glitchDuration: 250,
    glyphs: [
      { char: "■", size: 10, pos: { left: -22, top: "10%" }, orbitRadius: 8, orbitSpeed: 0.001, phase: 4.2 },
    ],
  },
  {
    text: "VEYRA", color: PURPLE, fontSize: 26, strokeWidth: 2, baseOpacity: 0.1,
    layer: "front", axis: "diagonal", speed: -0.34, angle: -Math.PI * 0.08, startX: 0.24, startY: 0.8,
    pulseFreq: 0.00045, pulsePhase: 5.1, glitchInterval: 10000, glitchTimer: 0,
    glitchActive: false, glitchStart: 0, glitchDuration: 280,
    glyphs: [
      { char: "◆", size: 14, pos: { right: -34, bottom: "12%" }, orbitRadius: 12, orbitSpeed: 0.0007, phase: 1.3 },
      { char: "■", size: 9, pos: { left: -24, top: "-4%" }, orbitRadius: 6, orbitSpeed: 0.0011, phase: 5.6 },
    ],
  },
  {
    text: "SCALE", color: PURPLE, fontSize: 32, strokeWidth: 2, baseOpacity: 0.055,
    layer: "back", axis: "horizontal", speed: 0.22, angle: 0, startX: 0.48, startY: 0.2,
    pulseFreq: 0.00035, pulsePhase: 1.2, glitchInterval: 15000, glitchTimer: 0,
    glitchActive: false, glitchStart: 0, glitchDuration: 200,
    glyphs: [
      { char: "●", size: 11, pos: { right: -30, top: "40%" }, orbitRadius: 9, orbitSpeed: 0.0008, phase: 3.0 },
    ],
  },
  {
    text: "GROWTH", color: LIME, fontSize: 28, strokeWidth: 1.8, baseOpacity: 0.05,
    layer: "back", axis: "diagonal", speed: 0.16, angle: Math.PI * 0.42, startX: 0.8, startY: 0.6,
    pulseFreq: 0.0003, pulsePhase: 3.8, glitchInterval: 16000, glitchTimer: 0,
    glitchActive: false, glitchStart: 0, glitchDuration: 200,
    glyphs: [
      { char: "▲", size: 12, pos: { left: -28, bottom: "24%" }, orbitRadius: 10, orbitSpeed: 0.0007, phase: 0.9 },
      { char: "●", size: 8, pos: { right: -18, top: "2%" }, orbitRadius: 6, orbitSpeed: 0.001, phase: 2.8 },
    ],
  },
  {
    text: "OBSESSION", color: OFFWHITE, fontSize: 19, strokeWidth: 1.2, baseOpacity: 0.065,
    layer: "back", axis: "horizontal", speed: -0.28, angle: 0, startX: 0.14, startY: 0.68,
    pulseFreq: 0.00055, pulsePhase: 0.7, glitchInterval: 14000, glitchTimer: 0,
    glitchActive: false, glitchStart: 0, glitchDuration: 160,
    glyphs: [
      { char: "●", size: 9, pos: { left: -18, top: "44%" }, orbitRadius: 7, orbitSpeed: 0.0009, phase: 1.7 },
    ],
  },
];

const pad4 = (n: number) => String(Math.abs(Math.round(n)) % 10000).padStart(4, "0");
const pad3 = (n: number) => String(Math.abs(Math.round(n)) % 1000).padStart(3, "0");
const padFrame = (n: number) => String(n).padStart(3, "0");

function AmbientTypeField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const backLayerRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const wordElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const glyphElsRef = useRef<Record<string, HTMLSpanElement | null>>({});
  const lineElsRef = useRef<(SVGLineElement | null)[]>([]);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const scanPctRef = useRef<HTMLSpanElement>(null);

  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });
  const scrollRef = useRef({ y: 0, velocity: 0, lastY: 0, lastTime: 0 });
  const statesRef = useRef<WordState[]>([]);
  const configsRef = useRef<WordConfig[]>([]);
  const wordDimsRef = useRef<{ w: number; h: number }[]>([]);
  const dimsRef = useRef({ w: 0, h: 0 });
  const layerLerpRef = useRef({ x: 0, y: 0 });
  const layerOffRef = useRef({ backX: 0, backY: 0, frontX: 0, frontY: 0 });
  const lastPctRef = useRef(-1);
  const lastCoordsRef = useRef("");
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;

    configsRef.current = FIELD_WORDS.map((w) => ({ ...w, glyphs: w.glyphs.map((g) => ({ ...g })) }));
    const dims = { w: window.innerWidth, h: window.innerHeight };
    dimsRef.current = dims;
    statesRef.current = configsRef.current.map((cfg) => ({
      x: cfg.startX * dims.w,
      y: cfg.startY * dims.h,
      scale: 1,
      opacity: cfg.baseOpacity,
      cursorSkewX: 0,
      cursorSkewY: 0,
      cursorOpacityBoost: 0,
      glitchOffsetX: 0,
      glitchOffsetY: 0,
      glitchSkew: 0,
      glitchSplit: 0,
      scanSolid: false,
    }));
    wordDimsRef.current = configsRef.current.map(() => ({ w: 0, h: 0 }));

    const measure = () => {
      dimsRef.current = { w: window.innerWidth, h: window.innerHeight };
      configsRef.current.forEach((_, i) => {
        const el = wordElsRef.current[i];
        if (el) wordDimsRef.current[i] = { w: el.offsetWidth, h: el.offsetHeight };
      });
    };
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const measureRaf = requestAnimationFrame(() => measure());
    let fontsCancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => { if (!fontsCancelled) measure(); });
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
      mouseRef.current.active = true;
    };
    const onMouseLeave = () => { mouseRef.current.active = false; };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    const onScroll = () => {
      const now = performance.now();
      const dt = now - scrollRef.current.lastTime;
      if (dt > 0) {
        const rawVel = Math.abs(window.scrollY - scrollRef.current.lastY) / dt;
        scrollRef.current.velocity += (rawVel - scrollRef.current.velocity) * 0.1;
      }
      scrollRef.current.lastY = window.scrollY;
      scrollRef.current.lastTime = now;
      scrollRef.current.y = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const renderStatic = () => {
      const configs = configsRef.current;
      const states = statesRef.current;
      const d = dimsRef.current;
      for (let i = 0; i < configs.length; i++) {
        const el = wordElsRef.current[i];
        const s = states[i];
        if (!el) continue;
        s.x = configs[i].startX * d.w;
        s.y = configs[i].startY * d.h;
        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        el.style.opacity = String(configs[i].baseOpacity * 0.8);
        el.style.color = "transparent";
        el.style.textShadow = "none";
      }
      if (scanRef.current) scanRef.current.style.display = "none";
      if (backLayerRef.current) backLayerRef.current.style.transform = "none";
      if (frontLayerRef.current) frontLayerRef.current.style.transform = "none";
      if (gridRef.current) gridRef.current.style.transform = "none";
      lineElsRef.current.forEach((l) => l && (l.style.strokeOpacity = "0"));
      if (coordsRef.current) coordsRef.current.textContent = "X 0000 · Y 0000 · V 0.00";
      if (scanPctRef.current) scanPctRef.current.textContent = "000";
    };

    let lastFrameTime = performance.now();
    const loop = (timestamp: number) => {
      if (reducedMotionRef.current) return;
      const dt = Math.min(timestamp - lastFrameTime, 50);
      lastFrameTime = timestamp;
      const dtF = dt / 16.667;
      const d = dimsRef.current;
      const configs = configsRef.current;
      const states = statesRef.current;
      const mouse = mouseRef.current;
      const scroll = scrollRef.current;

      const speedMult = 1 + Math.min(scroll.velocity * 12, 3);
      const glitchMult = 1 + Math.min(scroll.velocity * 8, 2);
      scroll.velocity *= 0.95;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProg = docH > 0 ? scroll.y / docH : 0;

      const ll = layerLerpRef.current;
      const tmx = mouse.active ? (mouse.x - 0.5) * 2 : 0;
      const tmy = mouse.active ? (mouse.y - 0.5) * 2 : 0;
      ll.x += (tmx - ll.x) * 0.03;
      ll.y += (tmy - ll.y) * 0.03;

      const off = layerOffRef.current;
      off.backX = ll.x * -10;
      off.backY = ll.y * -6 + scrollProg * -36;
      off.frontX = ll.x * -26;
      off.frontY = ll.y * -16 + scrollProg * -90;

      if (backLayerRef.current) backLayerRef.current.style.transform = `translate3d(${off.backX}px, ${off.backY}px, 0)`;
      if (frontLayerRef.current) frontLayerRef.current.style.transform = `translate3d(${off.frontX}px, ${off.frontY}px, 0)`;

      if (gridRef.current) {
        const gy = -((scroll.y * 0.06) % 120);
        const gx = ll.x * -6 - ((scroll.y * 0.012) % 120);
        gridRef.current.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      }

      const scanProg = (timestamp % SCAN_PERIOD) / SCAN_PERIOD;
      const scanY = scanProg * (d.h + 260) - 130;
      if (scanRef.current) scanRef.current.style.transform = `translate3d(0, ${scanY}px, 0)`;
      const pct = Math.round(scanProg * 100);
      if (pct !== lastPctRef.current) {
        lastPctRef.current = pct;
        if (scanPctRef.current) scanPctRef.current.textContent = pad3(pct);
      }

      const centers: { x: number; y: number }[] = [];
      for (let i = 0; i < configs.length; i++) {
        const cfg = configs[i];
        const s = states[i];
        const el = wordElsRef.current[i];
        if (!el) { centers.push({ x: -9999, y: -9999 }); continue; }

        const cached = wordDimsRef.current[i];
        const wordW = cached.w || (cfg.fontSize / 100) * d.w * cfg.text.length * 0.62;
        const wordH = cached.h || (cfg.fontSize / 100) * d.w * 1.05;
        const layerSpeed = cfg.layer === "back" ? 0.55 : 1;
        const layerOffX = cfg.layer === "back" ? off.backX : off.frontX;
        const layerOffY = cfg.layer === "back" ? off.backY : off.frontY;
        const margin = wordW * 0.6;

        const vx = Math.cos(cfg.angle) * cfg.speed * layerSpeed * speedMult * dtF;
        const vy = Math.sin(cfg.angle) * cfg.speed * layerSpeed * speedMult * dtF;

        if (cfg.axis === "horizontal") {
          s.x += vx;
          if (cfg.speed > 0 && s.x > d.w + margin) s.x = -wordW - margin * 0.5;
          if (cfg.speed < 0 && s.x < -wordW - margin) s.x = d.w + margin * 0.5;
        } else if (cfg.axis === "vertical") {
          s.y += vy;
          if (cfg.speed > 0 && s.y > d.h + wordH) s.y = -wordH - 50;
          if (cfg.speed < 0 && s.y < -wordH - 50) s.y = d.h + wordH;
        } else {
          s.x += vx;
          s.y += vy;
          if (s.x > d.w + margin) s.x = -wordW - margin * 0.5;
          if (s.x < -wordW - margin) s.x = d.w + margin * 0.5;
          if (s.y > d.h + wordH) s.y = -wordH - 50;
          if (s.y < -wordH - 50) s.y = d.h + wordH;
        }

        s.scale = 1 + Math.sin(timestamp * cfg.pulseFreq + cfg.pulsePhase) * 0.05;
        cfg.glitchTimer += dt * glitchMult;
        if (!cfg.glitchActive && cfg.glitchTimer >= cfg.glitchInterval) {
          cfg.glitchActive = true;
          cfg.glitchStart = timestamp;
          cfg.glitchTimer = 0;
          cfg.glitchInterval = 10000 + Math.random() * 6000;
        }
        if (cfg.glitchActive) {
          const elapsed = timestamp - cfg.glitchStart;
          if (elapsed < cfg.glitchDuration) {
            const intensity = Math.sin((elapsed / cfg.glitchDuration) * Math.PI);
            s.glitchOffsetX = (Math.random() - 0.5) * 8 * intensity;
            s.glitchOffsetY = (Math.random() - 0.5) * 4 * intensity;
            s.glitchSkew = (Math.random() - 0.5) * 12 * intensity;
            s.glitchSplit = Math.random() > 0.5 ? 1 : 0;
          } else {
            cfg.glitchActive = false;
            s.glitchOffsetX = 0; s.glitchOffsetY = 0; s.glitchSkew = 0; s.glitchSplit = 0;
          }
        }

        const centerX = s.x + wordW / 2 + layerOffX;
        const centerY = s.y + wordH / 2 + layerOffY;
        centers.push({ x: centerX, y: centerY });

        const cursorStiffness = cfg.layer === "back" ? 0.6 : 1;
        if (mouse.active) {
          const ndx = mouse.x - centerX / d.w;
          const ndy = mouse.y - centerY / d.h;
          const dist = Math.sqrt(ndx * ndx + ndy * ndy);
          const influence = Math.max(0, 1 - dist / 0.4);
          s.cursorSkewX += (ndx * influence * 6 * cursorStiffness - s.cursorSkewX) * 0.04;
          s.cursorSkewY += (ndy * influence * 3 * cursorStiffness - s.cursorSkewY) * 0.04;
          s.cursorOpacityBoost += (influence * 0.08 - s.cursorOpacityBoost) * 0.04;
        } else {
          s.cursorSkewX += (0 - s.cursorSkewX) * 0.03;
          s.cursorSkewY += (0 - s.cursorSkewY) * 0.03;
          s.cursorOpacityBoost += (0 - s.cursorOpacityBoost) * 0.03;
        }

        const solid = Math.abs(centerY - scanY) < 64;
        if (solid !== s.scanSolid) {
          s.scanSolid = solid;
          el.style.color = solid ? cfg.color : "transparent";
        }

        const targetOpacity = solid ? Math.min(cfg.baseOpacity + 0.34, 0.55) : Math.min(cfg.baseOpacity + s.cursorOpacityBoost, 0.18);
        s.opacity += (targetOpacity - s.opacity) * 0.12;
        el.style.opacity = String(s.opacity);

        let shadow = "none";
        if (cfg.glitchActive && s.glitchSplit) {
          shadow = `${s.glitchOffsetX * 0.5}px 0 rgba(214,255,63,0.3), ${-s.glitchOffsetX * 0.5}px 0 rgba(139,124,246,0.3)`;
        } else if (s.scanSolid) {
          shadow = `0 0 26px ${cfg.color}66, 0 0 64px ${cfg.color}30`;
        }
        el.style.textShadow = shadow;
        el.style.transform = `translate3d(${s.x + s.glitchOffsetX}px, ${s.y + s.glitchOffsetY}px, 0) scale(${s.scale}) skewX(${s.cursorSkewX + s.glitchSkew}deg) skewY(${s.cursorSkewY}deg)`;

        cfg.glyphs.forEach((g, gi) => {
          const gEl = glyphElsRef.current[`${i}:${gi}`];
          if (!gEl) return;
          const a = timestamp * g.orbitSpeed + g.phase;
          gEl.style.transform = `translate3d(${Math.cos(a) * g.orbitRadius}px, ${Math.sin(a) * g.orbitRadius * 0.6}px, 0)`;
        });
      }

      const threshold = Math.hypot(d.w, d.h) * 0.38;
      const energy = Math.min(Math.max((speedMult - 1) / 3, 0), 1);
      const pairs: { a: number; b: number; dist: number }[] = [];
      for (let i = 0; i < centers.length; i++) {
        for (let j = i + 1; j < centers.length; j++) {
          const dx = centers[i].x - centers[j].x;
          const dy = centers[i].y - centers[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < threshold) pairs.push({ a: i, b: j, dist });
        }
      }
      pairs.sort((p1, p2) => p1.dist - p2.dist);
      for (let k = 0; k < LINE_POOL; k++) {
        const line = lineElsRef.current[k];
        if (!line) continue;
        const p = pairs[k];
        if (p && energy > 0.01) {
          line.setAttribute("x1", String(centers[p.a].x));
          line.setAttribute("y1", String(centers[p.a].y));
          line.setAttribute("x2", String(centers[p.b].x));
          line.setAttribute("y2", String(centers[p.b].y));
          line.style.strokeOpacity = String((0.02 + energy * 0.13) * (1 - p.dist / threshold));
        } else {
          line.style.strokeOpacity = "0";
        }
      }

      const cx = Math.round(scroll.y * 0.5 + mouse.x * 400);
      const cy = Math.round(scroll.y + mouse.y * 400);
      const coordsStr = `X ${pad4(cx)} · Y ${pad4(cy)} · V ${scroll.velocity.toFixed(2)}`;
      if (coordsStr !== lastCoordsRef.current) {
        lastCoordsRef.current = coordsStr;
        if (coordsRef.current) coordsRef.current.textContent = coordsStr;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        cancelAnimationFrame(rafRef.current);
        renderStatic();
      } else {
        if (scanRef.current) scanRef.current.style.display = "block";
        lastFrameTime = performance.now();
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    motionQuery.addEventListener("change", onMotionChange);

    if (reducedMotionRef.current) {
      renderStatic();
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      fontsCancelled = true;
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(measureRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true" style={{ background: "#0B0D12" }}>
      <div ref={gridRef} className="absolute -inset-[10%]" style={{ backgroundImage: `linear-gradient(rgba(245,243,238,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,0.035) 1px, transparent 1px), linear-gradient(rgba(245,243,238,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,238,0.016) 1px, transparent 1px)`, backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px", willChange: "transform" }} />
      <svg className="absolute inset-0 h-full w-full">
        {Array.from({ length: LINE_POOL }, (_, k) => (
          <line key={k} ref={(el) => { lineElsRef.current[k] = el; }} stroke={k % 2 === 0 ? LIME : PURPLE} strokeWidth={1} strokeDasharray="3 7" style={{ strokeOpacity: 0 }} />
        ))}
      </svg>
      <div ref={backLayerRef} className="absolute inset-0" style={{ filter: "blur(3px)", willChange: "transform" }}>
        {FIELD_WORDS.map((cfg, i) => cfg.layer !== "back" ? null : (
          <div key={cfg.text} ref={(el) => { wordElsRef.current[i] = el; }} className="absolute left-0 top-0 select-none whitespace-nowrap" style={{ fontSize: `${cfg.fontSize}vw`, fontFamily: "var(--font-display)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: "transparent", WebkitTextStroke: `${cfg.strokeWidth}px ${cfg.color}`, opacity: cfg.baseOpacity, transform: `translate3d(${cfg.startX * 100}vw, ${cfg.startY * 100}vh, 0)`, transition: "color 0.28s ease", willChange: "transform, opacity" }}>
            {cfg.text}
            {cfg.glyphs.map((g, gi) => (
              <span key={gi} ref={(el) => { glyphElsRef.current[`${i}:${gi}`] = el; }} className="absolute select-none" style={{ ...g.pos, fontSize: g.size, lineHeight: 1, color: cfg.color, opacity: 0.2, textShadow: `0 0 8px ${cfg.color}55`, willChange: "transform" }}>{g.char}</span>
            ))}
          </div>
        ))}
      </div>
      <div ref={frontLayerRef} className="absolute inset-0" style={{ willChange: "transform" }}>
        {FIELD_WORDS.map((cfg, i) => cfg.layer !== "front" ? null : (
          <div key={cfg.text} ref={(el) => { wordElsRef.current[i] = el; }} className="absolute left-0 top-0 select-none whitespace-nowrap" style={{ fontSize: `${cfg.fontSize}vw`, fontFamily: "var(--font-display)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: "transparent", WebkitTextStroke: `${cfg.strokeWidth}px ${cfg.color}`, opacity: cfg.baseOpacity, transform: `translate3d(${cfg.startX * 100}vw, ${cfg.startY * 100}vh, 0)`, transition: "color 0.28s ease", willChange: "transform, opacity" }}>
            {cfg.text}
            {cfg.glyphs.map((g, gi) => (
              <span key={gi} ref={(el) => { glyphElsRef.current[`${i}:${gi}`] = el; }} className="absolute select-none" style={{ ...g.pos, fontSize: g.size, lineHeight: 1, color: cfg.color, opacity: 0.32, textShadow: `0 0 8px ${cfg.color}55`, willChange: "transform" }}>{g.char}</span>
            ))}
          </div>
        ))}
      </div>
      <div ref={scanRef} className="absolute inset-x-0 top-0" style={{ height: 160, willChange: "transform", transform: "translate3d(0,-200px,0)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(214,255,63,0.045) 38%, rgba(139,124,246,0.06) 52%, transparent)" }} />
        <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(214,255,63,0.35) 30%, rgba(139,124,246,0.35) 70%, transparent)", boxShadow: "0 0 18px rgba(214,255,63,0.22)" }} />
      </div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 30%, rgba(8,10,15,0.5) 78%, rgba(8,10,15,0.78) 100%)" }} />
      <div className="absolute inset-x-0 top-0 h-[12%]" style={{ background: "linear-gradient(to bottom, rgba(8,10,15,0.5), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 h-[12%]" style={{ background: "linear-gradient(to top, rgba(8,10,15,0.5), transparent)" }} />
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6FF3F]" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: "var(--font-mono)" }}>Field_active</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#D6FF3F]/50" style={{ fontFamily: "var(--font-mono)" }}>· Nodes 06</span>
      </div>
      <div className="absolute bottom-5 left-5 hidden text-[10px] uppercase tracking-[0.25em] text-white/30 sm:block" style={{ fontFamily: "var(--font-mono)" }}>
        <span ref={coordsRef}>X 0000 · Y 0000 · V 0.00</span>
      </div>
      <div className="absolute bottom-5 right-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="h-1 w-1 rounded-full bg-[#8B7CF6]/70" />
        Scan&nbsp;<span ref={scanPctRef} className="tabular-nums text-[#8B7CF6]/60">000</span>%
      </div>
    </div>
  );
}

/* ─── helpers for scroll choreography ────────────────── */
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ramp = (p: number, start: number, end: number) => clamp01((p - start) / (end - start));

/* ─── CINEMATIC HERO — scroll-driven text reveal + static form ──────────── */
const HERO_WORDS = ["STRATEGY", "DESIGN", "GROWTH", "VEYRA"];

const HERO_SHAPES: { char: string; color: string; size: number; top: string; left: string; speed: number; delay: string }[] = [
  { char: "◆", color: LIME,    size: 38, top: "12%", left: "8%",   speed: 0.7,  delay: "0s" },
  { char: "▲", color: PURPLE,  size: 28, top: "25%", left: "85%",  speed: 1.1,  delay: "0.4s" },
  { char: "●", color: OFFWHITE,size: 18, top: "68%", left: "5%",   speed: 0.9,  delay: "0.8s" },
  { char: "■", color: LIME,    size: 24, top: "78%", left: "92%",  speed: 1.3,  delay: "0.2s" },
  { char: "◆", color: PURPLE,  size: 20, top: "45%", left: "95%",  speed: 0.5,  delay: "1.2s" },
  { char: "▲", color: LIME,    size: 32, top: "88%", left: "48%",  speed: 0.8,  delay: "0.6s" },
  { char: "●", color: PURPLE,  size: 14, top: "8%",  left: "55%",  speed: 1.5,  delay: "1s" },
  { char: "■", color: OFFWHITE,size: 16, top: "55%", left: "18%",  speed: 1.0,  delay: "0.3s" },
];

function CinematicHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const orbRef = useRef<HTMLDivElement>(null);
  const shapeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  /* scroll-driven choreography (text, orb, shapes only) */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = clamp01(-rect.top / scrollable);

      /* word reveals — staggered cascade */
      wordRefs.current.forEach((el, i) => {
        if (!el) return;
        const wordStart = i * 0.12;
        const wordEnd = wordStart + 0.22;
        const t = clamp01((raw - wordStart) / (wordEnd - wordStart));
        const revealT = Math.min(t * 1.2, 1);
        el.style.opacity = String(revealT);
        el.style.transform = `translateY(${(1 - revealT) * 80}px) scale(${0.85 + revealT * 0.15}) rotateX(${(1 - revealT) * 15}deg)`;
        el.style.filter = `blur(${(1 - revealT) * 8}px)`;
        const hue = i % 2 === 0 ? "214,255,63" : "139,124,246";
        el.style.color = revealT > 0.6 ? `rgba(${hue},${revealT})` : `rgba(245,243,238,${revealT * 0.6})`;
      });

      /* orb morph */
      if (orbRef.current) {
        const scale = 0.6 + raw * 0.8;
        const orbX = Math.sin(raw * Math.PI * 2) * 15;
        const orbY = Math.cos(raw * Math.PI * 1.5) * 10;
        orbRef.current.style.transform = `translate3d(${orbX}%, ${orbY}%, 0) scale(${scale})`;
        orbRef.current.style.opacity = String(0.25 + raw * 0.35);
      }

      /* floating shapes parallax */
      shapeRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = HERO_SHAPES[i];
        const drift = raw * s.speed * -120;
        const sway = Math.sin(raw * Math.PI * 3 + i) * 20;
        el.style.transform = `translate3d(${sway}px, ${drift}px, 0) rotate(${raw * 360 * (i % 2 === 0 ? 1 : -1)}deg)`;
        el.style.opacity = String(0.12 + raw * 0.25);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    const msg = `Hi Veyra!\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message}`;
    const waUrl = `https://wa.me/918928246726?text=${encodeURIComponent(msg)}`;
    setTimeout(() => {
      window.open(waUrl, "_blank");
      setFormStatus("sent");
      setTimeout(() => setFormStatus("idle"), 3000);
    }, 600);
  };

  const inputBase = "w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-sm text-[#F5F3EE] placeholder:text-white/25 outline-none backdrop-blur-sm transition-all duration-300";
  const inputFocus = (field: string) =>
    focusedField === field
      ? "border-[#D6FF3F]/60 shadow-[0_0_24px_rgba(214,255,63,0.12)]"
      : "border-white/10 hover:border-white/20";

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full"
      style={{ height: "420vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0B0D12] px-5 sm:px-8 lg:px-14">
        {/* morphing gradient orb */}
        <div
          ref={orbRef}
          className="pointer-events-none absolute"
          style={{
            width: "min(70vw, 700px)",
            height: "min(70vw, 700px)",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, rgba(214,255,63,0.18), rgba(139,124,246,0.12) 50%, transparent 75%)",
            filter: "blur(80px)",
            opacity: 0.25,
            willChange: "transform, opacity",
          }}
        />

        {/* floating geometric shapes */}
        {HERO_SHAPES.map((s, i) => (
          <span
            key={i}
            ref={(el) => { shapeRefs.current[i] = el; }}
            className="pointer-events-none absolute select-none"
            style={{
              top: s.top,
              left: s.left,
              fontSize: s.size,
              color: s.color,
              opacity: 0.12,
              lineHeight: 1,
              filter: `drop-shadow(0 0 18px ${s.color}55)`,
              willChange: "transform, opacity",
              animation: `veyra-float ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          >
            {s.char}
          </span>
        ))}

        {/* ─── CENTERING WRAPPER ───────────────────────────────────────── */}
        <div className="relative z-10 grid min-h-full w-full place-items-center pt-28 pb-16 lg:pt-0 lg:pb-0">
          {/* ─── SPLIT LAYOUT: words left, form right on lg ─── */}
          <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* LEFT: scroll-revealing words */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 lg:items-start" style={{ perspective: "1200px" }}>
              {HERO_WORDS.map((word, i) => (
                <span
                  key={word}
                  ref={(el) => { wordRefs.current[i] = el; }}
                  className="block select-none text-center lg:text-left"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(2.8rem, 10vw, 8rem)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.03em",
                    opacity: 0,
                    willChange: "transform, opacity, filter",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {word}
                </span>
              ))}
              <p
                className="mt-6 max-w-md text-center text-sm leading-relaxed text-white/40 sm:text-base lg:text-left"
                style={{ fontFamily: "var(--font-body)" }}
              >
                A creative &amp; digital lab obsessed with building brands that move.
              </p>
            </div>

            {/* RIGHT: enquiry form (Reveals gracefully via IntersectionObserver, NOT scroll progress) */}
            <Reveal delay={800} className="relative w-full max-w-lg justify-self-center lg:justify-self-end">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D12]/70 p-6 shadow-[0_32px_120px_-20px_rgba(139,124,246,0.2)] backdrop-blur-xl sm:p-8">
                {/* corner accents */}
                <span className="absolute left-0 top-0 h-12 w-[2px] bg-gradient-to-b from-[#D6FF3F]/60 to-transparent" />
                <span className="absolute left-0 top-0 h-[2px] w-12 bg-gradient-to-r from-[#D6FF3F]/60 to-transparent" />
                <span className="absolute bottom-0 right-0 h-12 w-[2px] bg-gradient-to-t from-[#8B7CF6]/60 to-transparent" />
                <span className="absolute bottom-0 right-0 h-[2px] w-12 bg-gradient-to-l from-[#8B7CF6]/60 to-transparent" />

                <div className="mb-5 flex items-center gap-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6FF3F]" />
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#D6FF3F]/80" style={{ fontFamily: "var(--font-mono)" }}>
                    Start a conversation
                  </p>
                </div>
                <h3 className="mb-1 text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  Got a vision?
                </h3>
                <p className="mb-5 text-sm text-white/45">
                  Tell us about your project and we&apos;ll get back within 24 hours.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className={`${inputBase} ${inputFocus("name")}`}
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={`${inputBase} ${inputFocus("email")}`}
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputBase} ${inputFocus("phone")}`}
                  />
                  <textarea
                    rows={3}
                    placeholder="Tell us about your project…"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                    onFocus={() => setFocusedField("message")}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputBase} ${inputFocus("message")} resize-none`}
                  />
                  <button
                    type="submit"
                    disabled={formStatus === "sending"}
                    className="group relative w-full overflow-hidden rounded-xl bg-[#D6FF3F] px-6 py-3.5 text-sm font-semibold text-[#0B0D12] transition-all duration-300 hover:shadow-[0_0_40px_rgba(214,255,63,0.3)] hover:scale-[1.02] disabled:opacity-60"
                  >
                    <span className="relative z-10">
                      {formStatus === "idle" && "Send Enquiry →"}
                      {formStatus === "sending" && "Opening WhatsApp…"}
                      {formStatus === "sent" && "✓ Sent!"}
                    </span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                </form>

                <p className="mt-3 text-center text-[10px] text-white/25" style={{ fontFamily: "var(--font-mono)" }}>
                  or email us at{" "}
                  <a href="mailto:veyracreativesdigitallab25@gmail.com" className="text-[#8B7CF6]/60 underline underline-offset-2 transition hover:text-[#8B7CF6]">
                    veyracreativesdigitallab25@gmail.com
                  </a>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
        {/* ─── /CENTERING WRAPPER ─── */}

        {/* scroll prompt */}
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>
            Scroll to reveal
            <span className="cinematic-scroll-line h-8 w-px bg-white/30" />
          </div>
        </div>

        {/* top-left badge */}
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6FF3F]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: "var(--font-mono)" }}>Veyra — 2025</span>
        </div>

        {/* edge scrims */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-[#0B0D12]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-[#0B0D12] to-transparent" />
      </div>
    </section>
  );
}

/* ─── BOTTOM / VINE Scroll Sequence (300 images) — SMALL FRAMED CARD + SLOW TEXT INSIDE ─────────────── */
const BOTTOM_FRAME_COUNT = 300;
const BOTTOM_FRAME_PREFIX = "ezgif-frame-";
const BOTTOM_FRAME_EXT = ".jpg";

function BottomScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);

  // scroll-choreographed text overlays (positioned INSIDE the framed card)
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= BOTTOM_FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/veyra-seq/${BOTTOM_FRAME_PREFIX}${padFrame(i)}${BOTTOM_FRAME_EXT}`;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === BOTTOM_FRAME_COUNT) setReady(true);
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
    // High-DPI backing store for crispness; CSS keeps native size (no upscale)
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.floor(img.naturalWidth * dpr);
    const targetHeight = Math.floor(img.naturalHeight * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const clamped = clamp01(-rect.top / scrollableHeight);

      // 1) frame playback (vine grows horizontally)
      const targetFrame = Math.min(Math.round(clamped * (BOTTOM_FRAME_COUNT - 1)), BOTTOM_FRAME_COUNT - 1);
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

      // 5) bottom progress line — grows with the vine
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${clamped})`;
      }
    };
    drawFrame(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => drawFrame(frameRef.current), { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", () => drawFrame(frameRef.current));
      cancelAnimationFrame(rafRef.current);
    };
  }, [ready, drawFrame]);

  const loadPercent = Math.round((loadedCount / BOTTOM_FRAME_COUNT) * 100);

  return (
    <section ref={containerRef} className="relative z-10 w-full bg-[#0B0D12]" style={{ height: `${BOTTOM_FRAME_COUNT * 1.2}vh` }}>
      {/* center the small framed card in the viewport */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#0B0D12] p-4 sm:p-6">
        {/* loader (full-screen centered) */}
        {!ready && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0B0D12]">
            <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#D6FF3F] transition-all duration-200" style={{ width: `${loadPercent}%` }} />
            </div>
            <p className="text-[12px] uppercase tracking-[0.25em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
              Loading sequence… {loadPercent}%
            </p>
          </div>
        )}

        {/* ── the framed card: shrink-wraps the canvas so the overlay matches it exactly ── */}
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
          style={{ maxHeight: "80vh", maxWidth: "92vw", display: ready ? "block" : "none" }}
        >
          {/* native-size canvas → no upscaling → crisp */}
          <canvas
            ref={canvasRef}
            className="block h-auto w-auto"
            style={{ maxHeight: "80vh", maxWidth: "92vw" }}
          />

          {/* ── overlay layer — exactly the card's size ── */}
          <div className="pointer-events-none absolute inset-0">
            {/* legibility scrims (clipped to the rounded card) */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/35 to-transparent" />

            {/* editorial label, top-left */}
            <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 sm:text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                Veyra — seq. 02 / growth
              </p>
            </div>

            {/* ── TOP-RIGHT copy block ─────────────────────────────── */}
            <div
              ref={topRightRef}
              className="absolute right-4 top-[12%] max-w-[60%] text-right sm:right-6 sm:max-w-[15rem]"
              style={{ opacity: 0, transform: "translateY(26px)" }}
            >
              <div className="mb-3 ml-auto h-px w-10 bg-gradient-to-l from-[#D6FF3F]/80 to-transparent" />
              <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-[#D6FF3F] sm:text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                Growth, observed
              </p>
              <h2
                className="text-lg leading-[1.08] text-white sm:text-2xl lg:text-3xl"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
              >
                We don&apos;t force it.
                <br />
                <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">
                  We grow it.
                </span>
              </h2>
              <p className="mt-3 text-[10px] leading-relaxed text-white/75 sm:text-[12px]" style={{ textShadow: "0 1px 14px rgba(0,0,0,0.65)" }}>
                Real brands behave like living things — they need the right soil,
                light, and time. We tend the conditions until momentum takes root.
              </p>
            </div>

            {/* ── BOTTOM-RIGHT copy block ──────────────────────────── */}
            <div
              ref={bottomRightRef}
              className="absolute bottom-[12%] right-4 max-w-[60%] text-right sm:right-6 sm:max-w-[15rem]"
              style={{ opacity: 0, transform: "translateY(26px)" }}
            >
              <blockquote className="text-[11px] italic leading-relaxed text-white/90 sm:text-sm" style={{ textShadow: "0 1px 14px rgba(0,0,0,0.65)" }}>
                &ldquo;Every leaf on that vine is a decision we tested before we let
                it grow.&rdquo;
              </blockquote>
              <div className="mt-3 flex items-center justify-end gap-2">
                <span className="text-[9px] uppercase tracking-[0.25em] text-white/50 sm:text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>
                  Creative × Digital Lab
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] animate-pulse" />
              </div>
              <a
                href="#work"
                className="pointer-events-auto mt-3 inline-block rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm transition hover:border-[#D6FF3F]/70 hover:text-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                See the work →
              </a>
            </div>

            {/* ── scroll hint (fades out) ──────────────────────────── */}
            <div ref={hintRef} className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
                Scroll to grow
                <span className="h-6 w-px animate-pulse bg-white/40" />
              </div>
            </div>

            {/* ── bottom progress line (grows with the vine) ───────── */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
              <div ref={progressRef} className="h-full origin-left bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6]" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Spline showpiece ───────────────────────────────── */
function SplineShowpiece() {
  return (
    <section className="relative z-10 overflow-hidden border-t border-white/[0.06] px-6 py-32 md:px-10">
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>Interactive · 3D</p>
        </Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal delay={80}>
            <h2 className="max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Step inside the lab.</h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="max-w-sm text-sm leading-relaxed text-white/55">Drag, hover, poke — this one&apos;s alive. A tiny corner of the Veyra universe you can actually play with.</p>
          </Reveal>
        </div>
        <Reveal delay={180}>
          <div className="group relative mt-12 overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0D12]/80 backdrop-blur-sm shadow-[0_50px_140px_-40px_rgba(139,124,246,0.45)]">
            <div className="relative h-[58vh] min-h-[400px] w-full sm:h-[66vh] lg:h-[70vh]">
              <iframe src="https://my.spline.design/booleansinteractioncopycopy-tmPEv7BelAEG9pCQbWci6jvb-Ool/" frameBorder="0" loading="lazy" width="100%" height="100%" className="absolute inset-0 h-full w-full" title="Veyra 3D interaction" />
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 52%, rgba(11,13,18,0.55) 88%, rgba(11,13,18,0.9) 100%)" }} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0B0D12]/80 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B0D12]/80 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/5 transition duration-500 group-hover:ring-[#D6FF3F]/25" />
              <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6FF3F]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/80" style={{ fontFamily: "var(--font-mono)" }}>3D · Live</span>
              </div>
              <div className="pointer-events-none absolute bottom-5 right-5 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm" style={{ fontFamily: "var(--font-mono)" }}>Drag to explore</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── animated skill meter ───────────────────────────── */
function SkillBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] uppercase tracking-[0.15em] text-white/55" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
        <span className="text-[12px] tabular-nums" style={{ fontFamily: "var(--font-mono)", color }}>{value}</span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}66, ${color})`, transform: on ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: `transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}ms`, boxShadow: `0 0 12px ${color}55` }} />
      </div>
    </div>
  );
}

/* ─── animated portrait card ─────────────────────────── */
function PortraitCard({ accent, eyebrow, name, role, quote, bio, tags, skills, socials, imgSrc, imgAlt, objectPosition = "center 30%", glyphs, side, indexLabel }: { accent: Accent; eyebrow: string; name: string; role: string; quote: string; bio: string; tags: string[]; skills: { label: string; value: number }[]; socials: { l: string; h: string }[]; imgSrc: string; imgAlt: string; objectPosition?: string; glyphs: Glyph[]; side: "left" | "right"; indexLabel: string }) {
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
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.25 });
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
    return () => { wrap.removeEventListener("mousemove", onMove); wrap.removeEventListener("mouseleave", onLeave); };
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;
    if (imgRef.current) {
      gsap.fromTo(imgRef.current, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } });
    }
    gsap.utils.toArray<HTMLElement>(".pfloat", sectionRef.current).forEach((el) => {
      const s = parseFloat(el.dataset.speed || "1");
      gsap.to(el, { y: -80 * s, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }, { scope: sectionRef });

  const brackets = [
    { c: "border-l-2 border-t-2", o: "-left-3 -top-3", origin: "top left" },
    { c: "border-r-2 border-t-2", o: "-right-3 -top-3", origin: "top right" },
    { c: "border-b-2 border-l-2", o: "-bottom-3 -left-3", origin: "bottom left" },
    { c: "border-b-2 border-r-2", o: "-bottom-3 -right-3", origin: "bottom right" },
  ];

  const imageBlock = (
    <div className={side === "right" ? "lg:order-2" : "lg:order-1"}>
      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <span className="pointer-events-none absolute -left-5 top-1/2 hidden -translate-y-1/2 -rotate-90 whitespace-nowrap text-[11px] uppercase tracking-[0.4em] lg:block" style={{ fontFamily: "var(--font-mono)", color: `${color}80` }}>{indexLabel}</span>
        <div className="aura-blob pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] blur-3xl" style={{ background: `${color}26` }} />
        <div className="aura-blob aura-blob-2 pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] blur-3xl" style={{ background: `${accent === "lime" ? ACCENTS.purple : ACCENTS.lime}1f` }} />
        <div ref={tiltWrapRef} style={{ perspective: "1100px" }}>
          <div ref={cardRef} className="relative" style={{ transformStyle: "preserve-3d", transition: "transform 0.25s ease-out", willChange: "transform" }}>
            {brackets.map((b, i) => (
              <span key={i} className={`pointer-events-none absolute z-20 h-8 w-8 ${b.c} ${b.o}`} style={{ borderColor: color, transformOrigin: b.origin, transform: inView ? "scale(1)" : "scale(0)", opacity: inView ? 0.8 : 0, transition: `transform .6s cubic-bezier(.34,1.56,.64,1) ${0.15 + i * 0.08}s, opacity .4s ease ${0.15 + i * 0.08}s` }} />
            ))}
            <div ref={frameRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border shadow-[inset_0_0_90px_rgba(11,13,18,0.6)]" style={{ borderColor: `${color}33`, ["--gx" as any]: "50%", ["--gy" as any]: "30%", ["--glare" as any]: "0" }}>
              <img ref={imgRef} src={imgSrc} alt={imgAlt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-115 object-cover" style={{ objectPosition, willChange: "transform", filter: "contrast(1.06) saturate(0.95) brightness(0.97)" }} />
              <div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: `linear-gradient(150deg, ${color}cc, transparent 55%, ${accent === "lime" ? ACCENTS.purple : ACCENTS.lime}99)` }} />
              <div className="grain pointer-events-none absolute inset-0" />
              <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-white/40 to-transparent mix-blend-soft-light" />
              <div className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={{ background: "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.32), transparent 45%)", opacity: "var(--glare)" }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0B0D12]/85 to-transparent" />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: color }} />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/80" style={{ fontFamily: "var(--font-mono)" }}>Portrait / Live</span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm" style={{ fontFamily: "var(--font-mono)", color: `${color}cc` }}>Est. Veyra</div>
            </div>
            {glyphs.map((g, i) => (
              <div key={i} className="pfloat pointer-events-none absolute z-30" data-speed={g.speed} style={g.pos}>
                <div style={{ transform: `translateZ(${g.z}px)` }}>
                  <span className="float-slow block" style={{ animationDelay: g.delay, color: g.color, fontSize: g.size, lineHeight: 1, filter: `drop-shadow(0 0 14px ${g.color}66)` }}>{g.char}</span>
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
      <Reveal><span className="inline-block rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-mono)", borderColor: `${color}55`, color: `${color}dd` }}>{role}</span></Reveal>
      <Reveal delay={80}><h3 className="mt-6 text-5xl sm:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{name}</h3></Reveal>
      <Reveal delay={140}><p className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg">{bio}</p></Reveal>
      <Reveal delay={200}>
        <div className="mt-8 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/35" style={{ fontFamily: "var(--font-mono)" }}>Core skills</p>
          {skills.map((s, i) => (<SkillBar key={s.label} label={s.label} value={s.value} color={color} delay={i * 120} />))}
        </div>
      </Reveal>
      <Reveal delay={260}>
        <div className="mt-7 flex flex-wrap gap-2">
          {tags.map((t) => (<span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-white/55" style={{ fontFamily: "var(--font-mono)" }}>{t}</span>))}
        </div>
      </Reveal>
      <Reveal delay={320}><blockquote className="mt-8 border-l-2 pl-5 text-lg italic leading-relaxed text-white/75 sm:text-xl" style={{ borderColor: `${color}99` }}>&ldquo;{quote}&rdquo;</blockquote></Reveal>
      <Reveal delay={380}>
        <div className="mt-8 flex flex-wrap gap-3">
          {socials.map((s) => (
            <a key={s.l} href={s.h} className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-white/70 transition hover:text-white" style={{ fontFamily: "var(--font-mono)" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}99`)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}>{s.l}</a>
          ))}
        </div>
      </Reveal>
    </div>
  );

  return (
    <section ref={sectionRef} className="relative z-10 border-t border-white/[0.06] px-6 py-28 md:px-10">
      <div className="relative mx-auto max-w-7xl">
        <Reveal><p className="mb-4 text-[12px] uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)", color }}>{eyebrow}</p></Reveal>
        <Reveal delay={80}><h2 className="mb-14 max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{side === "left" ? "The vision behind the lab." : "The face behind the pixels."}</h2></Reveal>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">{imageBlock}{textBlock}</div>
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
  { tag: "Local SEO", title: "Google Business Profile", metric: "+210% map views", desc: "Listings tuned for the map pack — more calls, more directions, more walk-ins.", img: "/work/googlebusiness_profile.png", gradient: "from-[#D6FF3F]/40 to-[#8B7CF6]/20" },
  { tag: "Paid Media", title: "Performance Marketing", metric: "3.4× ROAS", desc: "Paid funnels built like lab experiments: hypothesis, test, scale, repeat.", img: "/work/performance_marketing.png", gradient: "from-[#8B7CF6]/40 to-[#D6FF3F]/20" },
  { tag: "Production", title: "Shooting Videos", metric: "40+ shoots / mo", desc: "Scroll-stopping short-form and brand films — shot, lit, and cut in-house.", img: "/work/Shooting.png", gradient: "from-[#D6FF3F]/30 to-[#8B7CF6]/30" },
  { tag: "Always-on", title: "Social Media Management", metric: "12M organic reach", desc: "Calendars, community, and content that keep the brand alive between launches.", img: "/work/socialmedia_management.png", gradient: "from-[#8B7CF6]/30 to-[#D6FF3F]/30" },
  { tag: "Organic", title: "Website SEO", metric: "+180% organic traffic", desc: "Technical + on-page SEO engineered to compound quietly, month over month.", img: "/work/Website_seo.png", gradient: "from-[#D6FF3F]/40 to-[#8B7CF6]/10" },
  { tag: "Full-funnel", title: "Performance + Content", metric: "−38% cost per lead", desc: "Creative that performs — ads and content tuned to the same north-star metric.", img: "/work/performance_marketing_content.png", gradient: "from-[#8B7CF6]/40 to-[#D6FF3F]/10" },
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

/* ─── Manifesto / Bottom Scroll Section ──────────────── */
function ManifestoSection() {
  return <BottomScrollSequence />;
}

/* ─── Mobile detection hook ─────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  
  return isMobile;
}

/* ═══════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const isMobile = useIsMobile();

  // If mobile, render the mobile-optimized version
  if (isMobile) {
    return <MobileExtend />;
  }

  // Otherwise, render the full desktop version with scroll animations
  return (
    <main className="relative">
      <AmbientTypeField />
      <ScrollProgress />

      {/* 1. CINEMATIC HERO — scroll-driven text reveal + static form */}
      <CinematicHero />

      {/* 2. HERO */}
      <section className="relative z-10 flex min-h-[88vh] items-center overflow-hidden border-t border-white/[0.06] px-6 md:px-10">
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <Reveal><p className="mb-5 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]/90" style={{ fontFamily: "var(--font-mono)" }}>Digital Marketing × Creative Lab</p></Reveal>
            <Reveal delay={80}><h1 className="veyra-shimmer text-7xl leading-[0.92] sm:text-8xl lg:text-[9rem]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>VEYRA</h1></Reveal>
            <Reveal delay={160}><p className="mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">We build brands, campaigns, and products that behave like living things — shaped, tested, and set loose in the world.</p></Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="#contact" className="rounded-full bg-[#D6FF3F] px-6 py-3 text-sm font-medium text-black transition hover:bg-white hover:scale-105">Start a project</a>
                <a href="#work" className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/85 transition hover:border-white/50 hover:scale-105">See our work</a>
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
      <section className="relative z-10 border-t border-white/[0.06] px-6 py-36 md:px-10 md:py-44">
        <div className="relative mx-auto max-w-5xl">
          <Reveal><p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>Our philosophy</p></Reveal>
          <Reveal delay={80}><h2 className="max-w-3xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Marketing is a science. <span className="text-white/30">Branding is an art.</span> <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">We practice both.</span></h2></Reveal>
          <Reveal delay={200}><div className="my-16 flex items-center gap-4"><div className="h-px flex-1 bg-gradient-to-r from-[#D6FF3F]/60 via-[#8B7CF6]/40 to-transparent origin-left" /><div className="h-2 w-2 rounded-full bg-[#D6FF3F] animate-pulse" /></div></Reveal>
          <div className="grid grid-cols-1 gap-0 md:grid-cols-3 md:gap-8">
            {philosophy.map((p, i) => (
              <ScrollParallax key={p.num} speed={0.12 + i * 0.06} direction="up">
                <Reveal delay={280 + i * 120}>
                  <div className="group relative rounded-2xl p-6 transition-colors duration-500 hover:bg-white/[0.02] md:p-8">
                    <p className="mb-4 text-5xl font-bold text-white/[0.04] transition-colors duration-500 group-hover:text-[#D6FF3F]/20" style={{ fontFamily: "var(--font-display)" }}>{p.num}</p>
                    <p className="text-base leading-relaxed text-white/55 transition-colors duration-500 group-hover:text-white/80 sm:text-lg">{p.text}</p>
                    <div className="mt-6 h-px w-12 bg-white/10 transition-all duration-500 group-hover:w-20 group-hover:bg-[#D6FF3F]/50" />
                  </div>
                </Reveal>
              </ScrollParallax>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CAPABILITIES */}
      <section id="capabilities" className="relative z-10 border-t border-white/[0.06] px-6 py-32 md:px-10">
        <div className="relative mx-auto max-w-7xl">
          <Reveal><p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#8B7CF6]" style={{ fontFamily: "var(--font-mono)" }}>What we build</p></Reveal>
          <Reveal delay={80}><h2 className="max-w-2xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Full-spectrum growth, run like a lab — not a portfolio of favors.</h2></Reveal>
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.06] sm:grid-cols-2">
            {capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 90}>
                <div className="group h-full bg-[#0B0D12]/80 backdrop-blur-sm p-8 transition-all duration-300 hover:bg-[#12141b]/90 md:p-10 relative overflow-hidden">
                  <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#D6FF3F]/0 transition-all duration-500 blur-[60px] group-hover:bg-[#D6FF3F]/10" />
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <p className="text-[12px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>{cap.tag}</p>
                      <span className="text-lg text-white/10 transition-all duration-300 group-hover:text-[#D6FF3F]/40 group-hover:scale-125">{cap.icon}</span>
                    </div>
                    <h3 className="mb-3 text-2xl transition group-hover:text-[#D6FF3F]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{cap.title}</h3>
                    <p className="max-w-sm text-[15px] leading-relaxed text-white/55">{cap.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SELECTED WORK */}
      <section id="work" className="relative z-10 border-t border-white/[0.06] px-6 py-32 md:px-10">
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><p className="mb-4 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>Selected work</p></Reveal>
              <Reveal delay={80}><h2 className="max-w-xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Results that outlive the campaign.</h2></Reveal>
            </div>
            <Reveal delay={120}><a href="#contact" className="whitespace-nowrap text-sm text-white/60 underline underline-offset-4 transition hover:text-white">View all case studies →</a></Reveal>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {work.map((w, i) => (
              <Reveal key={w.title} delay={i * 90}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D12]/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.15]">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img src={w.img} alt={w.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12141b] via-[#12141b]/10 to-transparent" />
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${w.gradient} opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-50`} />
                    <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm" style={{ fontFamily: "var(--font-mono)" }}>{w.tag}</span>
                    <span className="absolute right-4 top-4 text-[11px] tabular-nums text-white/45" style={{ fontFamily: "var(--font-mono)" }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="relative flex flex-1 flex-col p-6">
                    <h3 className="text-xl transition-colors duration-300 group-hover:text-[#D6FF3F] sm:text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{w.title}</h3>
                    <p className="mt-2 text-[13px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "#D6FF3F" }}>{w.metric}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{w.desc}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] transition-all duration-500 group-hover:w-full" />
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D12]/80 backdrop-blur-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {workStats.map((s) => (
                  <div key={s.label} className="border-white/[0.06] px-6 py-9 text-center [&:not(:nth-child(2n))]:border-r sm:[&:not(:nth-child(2n))]:border-r-0 sm:[&:not(:first-child)]:border-l">
                    <p className="bg-gradient-to-br from-white to-white/50 bg-clip-text text-3xl text-transparent sm:text-4xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{s.value}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] px-6 py-5 text-center">
                <p className="text-[12px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>…and <span className="text-[#D6FF3F]">100+ more happy customers</span> — and counting.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. CONTACT / CTA */}
      <section id="contact" className="relative z-10 border-t border-white/[0.06] px-6 py-32 md:px-10 overflow-hidden">
        <div className="relative mx-auto max-w-7xl">
          <Reveal><p className="mb-6 text-[12px] uppercase tracking-[0.25em] text-[#8B7CF6]" style={{ fontFamily: "var(--font-mono)" }}>Let&apos;s talk</p></Reveal>
          <Reveal delay={80}><h2 className="max-w-3xl text-4xl leading-[1.05] sm:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Let&apos;s build something<br />no one&apos;s seen yet.</h2></Reveal>
          <Reveal delay={160}>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <a href="mailto:veyracreativesdigitallab25@gmail.com" className="rounded-full bg-[#D6FF3F] px-7 py-4 text-sm font-medium text-black transition-all duration-300 hover:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(214,255,63,0.3)]">veyracreativesdigitallab25@gmail.com</a>
              <a href="https://wa.me/918928246726?text=Hi%20Veyra!%20I%27d%20love%20to%20start%20a%20project." target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-7 py-4 text-sm text-white/85 transition-all duration-300 hover:border-[#25D366]/70 hover:text-white hover:scale-105">Chat Right now!</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. SPLINE SHOWPIECE */}
      <SplineShowpiece />

      {/* 8. MEET THE FOUNDERS — intro */}
      <section className="relative z-10 overflow-hidden border-t border-white/[0.06] px-6 py-28 md:px-10">
        <div className="relative mx-auto max-w-7xl">
          <Reveal><p className="mb-5 text-[12px] uppercase tracking-[0.25em] text-[#D6FF3F]" style={{ fontFamily: "var(--font-mono)" }}>Meet the lab</p></Reveal>
          <Reveal delay={80}><h2 className="max-w-3xl text-4xl leading-[1.02] sm:text-6xl" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Two founders. One <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">obsession.</span></h2></Reveal>
          <Reveal delay={160}><p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">The people behind the pixels and the performance — strategy and craft, sitting at the same table.</p></Reveal>
        </div>
      </section>

      {/* 9. FOUNDER */}
      <PortraitCard accent="lime" side="left" eyebrow="The founder" indexLabel="Founder — Veyra Lab" name="Rutvi" role="Founder & Creative Director" imgSrc="/founder.jpg" imgAlt="Veyra founder portrait" objectPosition="center 28%" glyphs={founderGlyphs} bio="Started Veyra with a stubborn belief: that brands deserve more than templates and guesswork. Rutvi leads the studio's creative vision — translating messy ambitions into identities, products, and campaigns that actually move numbers. Part strategist, part art director, fully obsessed with the details most people scroll past." tags={["Vision", "Brand Strategy", "Creative Direction", "Storytelling"]} skills={founderSkills} quote="We're not here to make pretty things. We're here to make pretty things that pay the rent." socials={[{ l: "LinkedIn", h: "#" }, { l: "Twitter", h: "#" }, { l: "Email", h: "mailto:veyracreativesdigitallab@gmail.com" }]} />

      {/* 10. CO-FOUNDER */}
      <PortraitCard accent="purple" side="right" eyebrow="The co-founder" indexLabel="Co-Founder — Design Lead" name="Dibesh" role="Co-Founder & Design Lead" imgSrc="/cofounder.jpg" imgAlt="Veyra co-founder portrait" objectPosition="center 30%" glyphs={cofounderGlyphs} bio="The hand behind every interface that leaves the studio. Dibesh turns strategy into systems — pixels that behave, motion that means something, and design that holds together at every breakpoint. Quietly competitive, loudly detailed, and the reason our work feels inevitable." tags={["UI / UX", "Design Systems", "Motion", "Prototyping"]} skills={cofounderSkills} quote="Good design is invisible until you take it away. I make sure no one at Veyra ever finds out what that feels like." socials={[{ l: "Instagram", h: "#" }, { l: "Behance", h: "#" }, { l: "Dribbble", h: "#" }]} />

      {/* 11. MANIFESTO / VINE SCROLL (300 images, small framed card + slow text inside) */}
      <ManifestoSection />


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
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        .float-slow { animation: veyra-float 5s ease-in-out infinite; }
        @keyframes veyra-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .scan-line { animation: veyra-scan 4.5s ease-in-out infinite; }
        @keyframes veyra-scan {
          0% { transform: translateY(-120%); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(520%); opacity: 0; }
        }
        .aura-blob { animation: veyra-aura 9s ease-in-out infinite; }
        .aura-blob-2 { animation-delay: -4.5s; }
        @keyframes veyra-aura {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(12px, -10px) scale(1.08); }
        }
        .grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          opacity: 0.16;
        }
        .scale-115 { transform: scale(1.15); }
        .cinematic-scroll-line {
          animation: cinematic-bounce 1.8s ease-in-out infinite;
        }
        @keyframes cinematic-bounce {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); transform-origin: top; }
          50% { opacity: 0.7; transform: scaleY(1); transform-origin: top; }
        }
        @media (prefers-reduced-motion: reduce) {
          .veyra-shimmer { animation: none; background-position: 0% 50%; }
          .float-slow, .scan-line, .aura-blob, .cinematic-scroll-line { animation: none; }
        }
      `}</style>
    </main>
  );
}