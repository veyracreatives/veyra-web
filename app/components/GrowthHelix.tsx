"use client";

import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   GROWTH HELIX — "Veyra seq. 02 / growth"

   A fully procedural, asset-free replacement for the old 300-frame JPEG
   scroll sequence. Nothing is preloaded, nothing is fetched, nothing decodes:
   the helix, its leaves and the drifting motes are pure maths, so the section
   is painted on the very first frame instead of waiting on 300 HTTP requests.

   It renders a 3D double helix (growth / DNA) that grows out of the floor as
   you scroll, with a fake perspective projection, additive glow passes, a
   scrolling set of copy overlays and a pointer-driven camera tilt.

   Performance rules baked in:
     • one rAF loop, gated by IntersectionObserver (paused off-screen + on
       document hidden)
     • precomputed curve tables, zero per-frame allocation in the hot loop
     • sprites pre-rendered once, colour ramp baked into a lookup table
     • colour/state changes batched into bands instead of per segment
     • devicePixelRatio clamped to 2
   ═══════════════════════════════════════════════════════════════════════ */

const SCROLL_VH = 240; // scroll runway for the growth sequence (was 360vh)
const SAMPLES = 200; // points sampled along the strand
const TURNS = 3.1; // helix revolutions across the full height
const Y_TOP = -1.6; // world-space top of the strand
const Y_BOT = 1.8; // world-space bottom of the strand
const R_BASE = 0.66; // strand radius at the middle
const CAM_D = 4.8; // camera distance (perspective divisor)
const FOCAL = 3.1; // perspective focal length
const TILT = 0.2; // resting camera pitch, radians — gives the 3/4 view
const BANDS = 20; // colour batches per strand
const NODE_EVERY = 10; // sample step between glowing nodes
const LEAF_EVERY = 12; // sample step between leaves
const MOTES_MAX = 84; // ambient drifting particles (pointer devices)
const MOTES_MIN = 40; // …halved on phones / small canvases

const TAU = Math.PI * 2;

/* ─── colour ramp: root purple → lime → hot white tip ──── */
const STOPS: [number, number, number][] = [
  [92, 78, 190],
  [139, 124, 246],
  [214, 255, 63],
  [245, 243, 238],
];

function rampRGB(t: number): string {
  const c = Math.min(0.9999, Math.max(0, t)) * (STOPS.length - 1);
  const i = Math.floor(c);
  const f = c - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(
    a[1] + (b[1] - a[1]) * f
  )},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

/* Bake the ramp once — the render loop then only indexes into it. */
const LUT_SIZE = 64;
const RAMP_LUT: string[] = Array.from({ length: LUT_SIZE }, (_, i) =>
  rampRGB(i / (LUT_SIZE - 1))
);

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const ramp = (p: number, start: number, end: number) =>
  clamp01((p - start) / (end - start));

/* ─── pre-rendered sprites (drawn once, blitted forever) ─── */
const SPRITE = 96;

function sprite(
  draw: (c: CanvasRenderingContext2D, s: number) => void
): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SPRITE;
  const c = cv.getContext("2d");
  if (c) draw(c, SPRITE);
  return cv;
}

function glowSprite(r: number, g: number, b: number) {
  return sprite((c, s) => {
    const h = s / 2;
    const grad = c.createRadialGradient(h, h, 0, h, h, h);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.18, `rgba(${r},${g},${b},0.62)`);
    grad.addColorStop(0.46, `rgba(${r},${g},${b},0.16)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    c.fillStyle = grad;
    c.fillRect(0, 0, s, s);
  });
}

function leafSprite() {
  return sprite((c, s) => {
    const h = s / 2;
    c.translate(h, h);

    // soft bloom behind the leaf
    const bloom = c.createRadialGradient(0, 0, 0, 0, 0, h * 0.9);
    bloom.addColorStop(0, "rgba(214,255,63,0.30)");
    bloom.addColorStop(1, "rgba(214,255,63,0)");
    c.fillStyle = bloom;
    c.fillRect(-h, -h, s, s);

    // leaf body — pointed tip toward +x
    const grad = c.createLinearGradient(0, 0, h * 0.95, 0);
    grad.addColorStop(0, "rgba(139,124,246,0.95)");
    grad.addColorStop(0.45, "rgba(214,255,63,0.98)");
    grad.addColorStop(1, "rgba(245,243,238,0.9)");
    c.beginPath();
    c.moveTo(-h * 0.42, 0);
    c.bezierCurveTo(-h * 0.1, -h * 0.42, h * 0.5, -h * 0.36, h * 0.86, 0);
    c.bezierCurveTo(h * 0.5, h * 0.36, -h * 0.1, h * 0.42, -h * 0.42, 0);
    c.fillStyle = grad;
    c.fill();

    // centre vein
    c.beginPath();
    c.moveTo(-h * 0.4, 0);
    c.lineTo(h * 0.8, 0);
    c.strokeStyle = "rgba(11,13,18,0.45)";
    c.lineWidth = s * 0.018;
    c.stroke();
  });
}

/* ─── deterministic pseudo-random (stable between reloads) ─── */
function rand(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export default function GrowthHelix() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // scroll-choreographed copy, kept identical in voice to the old sequence
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── curve tables: computed once, never again ───────────── */
    const SPAN = Y_BOT - Y_TOP;
    const thetaBase = new Float32Array(SAMPLES);
    const yBase = new Float32Array(SAMPLES);
    const radius = new Float32Array(SAMPLES);
    for (let i = 0; i < SAMPLES; i++) {
      const u = i / (SAMPLES - 1);
      thetaBase[i] = u * TURNS * TAU;
      yBase[i] = Y_BOT - u * SPAN;
      // spindle profile — pinched at the root and at the growing tip
      radius[i] = R_BASE * (0.58 + 0.42 * Math.sin(Math.PI * u));
    }

    /* ── scratch buffers for the projected points ───────────── */
    const ax = new Float32Array(SAMPLES);
    const ay = new Float32Array(SAMPLES);
    const bx = new Float32Array(SAMPLES);
    const by = new Float32Array(SAMPLES);
    const depthA = new Float32Array(SAMPLES);
    const depthB = new Float32Array(SAMPLES);

    /* ── ambient motes ──────────────────────────────────────── */
    const moteX = new Float32Array(MOTES_MAX);
    const moteY = new Float32Array(MOTES_MAX);
    const moteZ = new Float32Array(MOTES_MAX);
    const moteSpin = new Float32Array(MOTES_MAX);
    const moteSize = new Float32Array(MOTES_MAX);
    for (let i = 0; i < MOTES_MAX; i++) {
      const a = rand(i + 1) * TAU;
      const b = (rand(i + 91) - 0.5) * 2.1;
      const rad = 1.5 + rand(i + 181) * 2.1;
      moteX[i] = Math.cos(a) * Math.cos(b) * rad;
      moteY[i] = Math.sin(b) * rad * 0.85;
      moteZ[i] = Math.sin(a) * Math.cos(b) * rad;
      moteSpin[i] = 0.05 + rand(i + 271) * 0.22;
      moteSize[i] = 0.5 + rand(i + 361) * 1.6;
    }

    /* ── sprites ────────────────────────────────────────────── */
    const lime = glowSprite(214, 255, 63);
    const purple = glowSprite(139, 124, 246);
    const white = glowSprite(245, 243, 238);
    const leaf = leafSprite();

    /* ── sizing ─────────────────────────────────────────────── */
    let cssW = 0;
    let cssH = 0;
    let moteCount = MOTES_MAX;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const finePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (w === cssW && h === cssH) return;
      cssW = w;
      cssH = h;
      // phones are fill-rate bound, not CPU bound — thin the motes out there
      moteCount = !finePointer || w < 480 ? MOTES_MIN : MOTES_MAX;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── animation state ────────────────────────────────────── */
    let progress = 0; // eased, drives the growth
    let target = 0; // raw scroll progress
    let rot = 0; // ambient rotation
    let tiltX = 0; // eased pointer x (-1 … 1)
    let tiltY = 0; // eased pointer y
    let pointerX = 0;
    let pointerY = 0;
    let visible = false;
    let raf = 0;
    let last = 0;

    /* Pointer tilt is a desktop nicety. On touch it would fire mid-scroll and
       throw the camera around while the user is trying to read the page. */
    const onPointerMove = (e: PointerEvent) => {
      if (!finePointer) return;
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (finePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    /* ── scroll offset, cached so the loop never forces a layout ── */
    let secTop = 0;
    let secHeight = 0;
    const remeasure = () => {
      const r = section.getBoundingClientRect();
      secTop = r.top + window.scrollY;
      secHeight = r.height;
    };
    remeasure();

    /* ── render ─────────────────────────────────────────────── */
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      /* ease everything → buttery, no scroll snapping */
      const runnable = secHeight - window.innerHeight;
      target = runnable > 0 ? clamp01((window.scrollY - secTop) / runnable) : 0;

      const ease = reduceMotion ? 0.5 : 0.085;
      progress += (target - progress) * ease;
      tiltX += (pointerX - tiltX) * 0.05;
      tiltY += (pointerY - tiltY) * 0.05;
      if (!reduceMotion) rot += dt * 0.17;

      const w = cssW;
      const h = cssH;
      if (!w || !h) return;

      const cx = w / 2;
      const cy = h * 0.5;
      /* Width-aware so the strand keeps the same on-screen height whether the
         frame is a wide desktop rectangle or a tall phone one. */
      const unit = Math.min(w * 0.42, h * 0.335);
      const scMax = (FOCAL / CAM_D) * unit;
      const phase = rot + tiltX * 0.35;
      const pitch = TILT + tiltY * 0.16;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);

      const grown = Math.max(1, Math.round(progress * (SAMPLES - 1)));
      const p = clamp01(progress);

      /* ── backdrop ── */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0B0D12";
      ctx.fillRect(0, 0, w, h);

      /* deep field glow — grows with the helix */
      ctx.globalCompositeOperation = "lighter";
      const bloomA = 0.1 + p * 0.26;
      ctx.globalAlpha = bloomA;
      const bloomR = unit * (3.4 + p * 1.5);
      ctx.drawImage(purple, cx - bloomR, cy - bloomR, bloomR * 2, bloomR * 2);
      ctx.globalAlpha = bloomA * 0.9;
      const bloomR2 = unit * (2.2 + p * 1.1);
      ctx.drawImage(lime, cx - bloomR2, cy - bloomR2, bloomR2 * 2, bloomR2 * 2);

      /* ── project every sample once ── */
      for (let i = 0; i < grown; i++) {
        const th = thetaBase[i] + phase;
        const r = radius[i];
        const x = Math.cos(th) * r;
        const z0 = Math.sin(th) * r;
        const y0 = yBase[i];

        // strand A
        const yA = y0 * cp - z0 * sp;
        const zA = y0 * sp + z0 * cp;
        const dA = zA + CAM_D;
        const sA = (FOCAL / dA) * unit;
        ax[i] = cx + x * sA;
        ay[i] = cy + yA * sA;
        depthA[i] = sA / scMax;

        // strand B — same point rotated by π about the axis
        const yB = y0 * cp + z0 * sp;
        const zB = y0 * sp - z0 * cp;
        const dB = zB + CAM_D;
        const sB = (FOCAL / dB) * unit;
        bx[i] = cx - x * sB;
        by[i] = cy + yB * sB;
        depthB[i] = sB / scMax;
      }

      /* root marker on the floor (same projection, z = 0) */
      const rootDepth = FOCAL / (Y_BOT * sp + CAM_D) * unit;
      const rootY = cy + Y_BOT * cp * rootDepth;

      /* ── drifting motes ── */
      const moteAngle = rot * 0.55;
      const cm = Math.cos(moteAngle);
      const sm = Math.sin(moteAngle);
      for (let i = 0; i < moteCount; i++) {
        const mx0 = moteX[i] * cm - moteZ[i] * sm;
        const mz0 = moteX[i] * sm + moteZ[i] * cm;
        const my0 =
          moteY[i] +
          (reduceMotion ? 0 : Math.sin(rot * moteSpin[i] * 7 + i) * 0.2);
        const d = mz0 + CAM_D;
        if (d <= 0.2) continue;
        const s = (FOCAL / d) * unit;
        const sx = cx + mx0 * s;
        const sy = cy + (my0 * cp - mz0 * sp) * s;
        if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;
        const depth = s / scMax;
        const size = moteSize[i] * 26 * depth;
        ctx.globalAlpha = 0.1 + depth * 0.34;
        ctx.drawImage(lime, sx - size / 2, sy - size / 2, size, size);
      }

      /* ── soft glow pass (wide, additive) ── */
      ctx.globalAlpha = 0.11;
      ctx.lineWidth = 7;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(214,255,63,1)";
      for (let s = 0; s < 2; s++) {
        const px = s === 0 ? ax : bx;
        const py = s === 0 ? ay : by;
        ctx.beginPath();
        ctx.moveTo(px[0], py[0]);
        for (let i = 1; i < grown; i++) ctx.lineTo(px[i], py[i]);
        ctx.stroke();
      }

      /* ── crisp strands, colour-batched ── */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.7;
      for (let b = 0; b < BANDS; b++) {
        const i0 = Math.floor((b / BANDS) * grown);
        const i1 = Math.floor(((b + 1) / BANDS) * grown);
        if (i1 - i0 < 2) continue;
        const uMid = (i0 + i1) / 2 / (SAMPLES - 1);
        ctx.strokeStyle = RAMP_LUT[Math.min(LUT_SIZE - 1, (uMid * (LUT_SIZE - 1)) | 0)];
        for (let s = 0; s < 2; s++) {
          const px = s === 0 ? ax : bx;
          const py = s === 0 ? ay : by;
          ctx.beginPath();
          ctx.moveTo(px[i0], py[i0]);
          for (let i = i0 + 1; i <= i1 && i < grown; i++) ctx.lineTo(px[i], py[i]);
          ctx.stroke();
        }
      }

      /* ── ladder rungs between the strands ── */
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(139,124,246,1)";
      for (let i = 0; i < grown; i += NODE_EVERY) {
        const depth = (depthA[i] + depthB[i]) * 0.5;
        ctx.globalAlpha = 0.05 + depth * 0.14;
        ctx.beginPath();
        ctx.moveTo(ax[i], ay[i]);
        ctx.lineTo(bx[i], by[i]);
        ctx.stroke();
      }

      /* ── nodes ── */
      for (let i = 0; i < grown; i += NODE_EVERY) {
        const dA = Math.min(1, depthA[i]);
        const dB = Math.min(1, depthB[i]);
        const sizeA = (0.018 + 0.055 * dA) * unit;
        ctx.globalAlpha = 0.2 + dA * 0.7;
        ctx.drawImage(lime, ax[i] - sizeA, ay[i] - sizeA, sizeA * 2, sizeA * 2);
        const sizeB = (0.018 + 0.055 * dB) * unit;
        ctx.globalAlpha = 0.2 + dB * 0.7;
        ctx.drawImage(purple, bx[i] - sizeB, by[i] - sizeB, sizeB * 2, sizeB * 2);
      }

      /* ── leaves sprouting off the front strand ── */
      ctx.globalCompositeOperation = "source-over";
      for (let i = LEAF_EVERY; i < grown; i += LEAF_EVERY) {
        const sprout = clamp01((p - i / (SAMPLES - 1)) / 0.14);
        if (sprout <= 0) continue;
        const depth = Math.min(1, depthA[i]);
        const size = (0.1 + 0.13 * depth) * unit * sprout;
        const ang = thetaBase[i] + phase + Math.PI * 0.5;
        ctx.globalAlpha = 0.4 + depth * 0.5;
        ctx.save();
        ctx.translate(ax[i], ay[i]);
        ctx.rotate(ang);
        ctx.drawImage(leaf, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      /* ── growing tip + root glow ── */
      ctx.globalCompositeOperation = "lighter";
      const tipX = ax[grown - 1];
      const tipY = ay[grown - 1];
      const tipR = unit * 0.95;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(white, tipX - tipR, tipY - tipR, tipR * 2, tipR * 2);
      const coreR = unit * 0.22;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(lime, tipX - coreR, tipY - coreR, coreR * 2, coreR * 2);

      const rootR = unit * (1.1 + p * 0.7);
      ctx.globalAlpha = 0.28;
      ctx.drawImage(purple, cx - rootR, rootY - rootR, rootR * 2, rootR * 2);

      /* ── floor rings at the base ── */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const rr = unit * (0.45 + i * 0.5) * (0.55 + p * 0.45);
        ctx.beginPath();
        ctx.ellipse(cx, rootY, rr, rr * 0.2, 0, 0, TAU);
        ctx.stroke();
      }

      /* ── copy choreography ── */
      if (topRightRef.current) {
        const t = ramp(p, 0.12, 0.34);
        topRightRef.current.style.opacity = String(t);
        topRightRef.current.style.transform = `translateY(${(1 - t) * 26}px)`;
      }
      if (bottomRightRef.current) {
        const t = ramp(p, 0.5, 0.74);
        bottomRightRef.current.style.opacity = String(t);
        /* This block is anchored to the bottom edge, so it has to rise into
           place — sliding down would push it outside the frame and get clipped
           by the card's overflow on short/narrow screens. */
        bottomRightRef.current.style.transform = `translateY(${(t - 1) * 26}px)`;
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(clamp01(1 - p / 0.1));
      }
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p})`;
      }
    };

    /* ── start / stop ───────────────────────────────────────── */
    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    start();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          remeasure();
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(section);

    // content above can shift without firing a window resize — re-read the
    // cached offset whenever the page height changes
    const bodyRo = new ResizeObserver(remeasure);
    bodyRo.observe(document.body);

    const onResize = () => {
      remeasure();
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", remeasure);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      bodyRo.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", remeasure);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-[#0B0D12]"
      style={{ height: `${SCROLL_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#0B0D12] p-3 sm:p-6">
        {/* ── the framed viewport — portrait on phones, 16:10 from sm up ── */}
        <div
          className="relative aspect-[4/5] max-h-[86vh] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 sm:aspect-[16/10] sm:max-h-[82vh]"
          style={{ width: "min(92vw, 1040px)" }}
        >
          <canvas ref={canvasRef} className="block h-full w-full" />

          {/* ── overlay layer — exactly the frame's size ── */}
          <div className="pointer-events-none absolute inset-0">
            {/* legibility scrims — full-width bands on mobile, plus the
                right-hand wash that carries the desktop overlay copy */}
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black/75 via-black/30 to-transparent sm:h-1/3 sm:from-black/45 sm:via-black/10" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent sm:h-1/3 sm:from-black/55 sm:via-black/15" />
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-black/35 to-transparent sm:block" />

            {/* editorial label, top-left */}
            <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
              <p
                className="text-[9px] uppercase tracking-[0.3em] text-white/40 sm:text-[10px]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Veyra — seq. 02 / growth
              </p>
            </div>

            {/* ── TOP copy block — full-width/left on mobile, right-aligned from sm ── */}
            <div
              ref={topRightRef}
              className="absolute left-4 right-4 top-[13%] text-left sm:right-6 sm:max-w-[15rem] sm:text-right"
              style={{ opacity: 0, transform: "translateY(26px)" }}
            >
              <div className="mb-3 h-px w-10 bg-gradient-to-r from-[#D6FF3F]/80 to-transparent sm:ml-auto sm:bg-gradient-to-l sm:to-transparent" />
              <p
                className="mb-2 text-[9px] uppercase tracking-[0.3em] text-[#D6FF3F] sm:text-[10px]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Growth, observed
              </p>
              <h2
                className="text-[17px] leading-[1.06] text-white sm:text-2xl sm:leading-[1.08] lg:text-3xl"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  textShadow: "0 2px 24px rgba(0,0,0,0.6)",
                }}
              >
                We don&apos;t force it.
                <br />
                <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">
                  We grow it.
                </span>
              </h2>
              <p
                className="mt-3 text-[10px] leading-[1.5] text-white/75 sm:text-[12px] sm:leading-relaxed"
                style={{ textShadow: "0 1px 14px rgba(0,0,0,0.65)" }}
              >
                Real brands behave like living things — they need the right soil,
                light, and time. We tend the conditions until momentum takes root.
              </p>
            </div>

            {/* ── BOTTOM copy block ── */}
            <div
              ref={bottomRightRef}
              className="absolute bottom-4 left-4 right-4 text-left sm:bottom-[12%] sm:right-6 sm:max-w-[15rem] sm:text-right"
              style={{ opacity: 0, transform: "translateY(26px)" }}
            >
              <blockquote
                className="text-[11px] italic leading-relaxed text-white/90 sm:text-sm"
                style={{ textShadow: "0 1px 14px rgba(0,0,0,0.65)" }}
              >
                &ldquo;Every leaf on that helix is a decision we tested before we
                let it grow.&rdquo;
              </blockquote>
              <div className="mt-3 flex items-center gap-2 sm:justify-end">
                <span
                  className="text-[9px] uppercase tracking-[0.25em] text-white/50 sm:text-[10px]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Creative × Digital Lab
                </span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D6FF3F]" />
              </div>
              <a
                href="#work"
                className="pointer-events-auto mt-3 inline-block rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm transition hover:border-[#D6FF3F]/70 hover:text-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                See the work →
              </a>
            </div>

            {/* ── scroll hint — hidden on mobile, where the copy already
                   occupies the bottom band and the runway is short ── */}
            <div
              ref={hintRef}
              className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 sm:block"
            >
              <div
                className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Scroll to grow
                <span className="h-6 w-px animate-pulse bg-white/40" />
              </div>
            </div>

            {/* ── progress line ── */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
              <div
                ref={progressRef}
                className="h-full origin-left bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6]"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}