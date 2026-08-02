"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// ───────────────────────────────────────────────────────────────
// VEYRA BRAND PALETTE — Lime + Purple + Off-white on deep charcoal
// (matches the home page so the site feels like one brand)
// ───────────────────────────────────────────────────────────────

const PALETTE = {
  bg: "#0B0D12",
  bgDeep: "#080A0E",
  lime: "#D6FF3F",
  purple: "#8B7CF6",
  cyan: "#6EE7D8",
  offwhite: "#F5F3EE",
  accent1: "#D6FF3F", // Lime
  accent2: "#8B7CF6", // Purple
  accent3: "#6EE7D8", // Soft cyan
  accent4: "#8B7CF6", // Purple
  accent5: "#D6FF3F", // Lime
  accent6: "#F5F3EE", // Off-white (bookend)
};

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

interface StoryPanel {
  phase: number;
  side: string;
  title: string;
  subtitle: string;
  description: string;
  subPoints?: string[];
  stat: string;
  statLabel: string;
  secondaryStat?: string;
  secondaryStatLabel?: string;
  accent: string;
  position: "left" | "right";
  lightColor: number;
  lightIntensity: number;
}

// ───────────────────────────────────────────────────────────────
// CONTENT — rewritten to be honest, specific, on-brand
// ───────────────────────────────────────────────────────────────

const storyPanels: StoryPanel[] = [
  {
    phase: 0,
    side: "front",
    title: "The Lab",
    subtitle: "Where it started",
    description:
      "Veyra began with two people and a shared frustration: marketing and design kept being treated like separate jobs. So we put them in the same room, gave them the same goals, and didn't let them leave until the work actually performed.",
    subPoints: [
      "Strategy and craft, owned by the same people",
      "No hand-offs, no telephone game, no diluted ideas",
    ],
    stat: "40+",
    statLabel: "Brands scaled",
    secondaryStat: "2",
    secondaryStatLabel: "Founders, one lab",
    accent: PALETTE.accent1,
    position: "right",
    lightColor: 0xd6ff3f,
    lightIntensity: 2.2,
  },
  {
    phase: 1,
    side: "right",
    title: "The Method",
    subtitle: "How we work",
    description:
      "We treat every project like an experiment. We form a hypothesis, build the smallest thing that can prove it, and let the numbers decide what's next — not opinions, not egos.",
    subPoints: [
      "Fixed-scope sprints, so you always know the cost",
      "If a launch underperforms, we keep iterating until it doesn't",
    ],
    stat: "14d",
    statLabel: "Avg. sprint length",
    secondaryStat: "0",
    secondaryStatLabel: "Surprise invoices",
    accent: PALETTE.accent2,
    position: "left",
    lightColor: 0x8b7cf6,
    lightIntensity: 2.4,
  },
  {
    phase: 1,
    side: "right",
    title: "The Process",
    subtitle: "From brief to shipped",
    description:
      "No hundred-page decks that gather dust. We audit what's real, decide what matters, build it, then measure what actually moved. You see progress every week — not a big reveal at the end.",
    subPoints: [
      "Audit → Strategy → Build → Measure",
      "Weekly demos instead of monthly status reports",
    ],
    stat: "4",
    statLabel: "Steps, no dead ends",
    secondaryStat: "100%",
    secondaryStatLabel: "Visibility, always",
    accent: PALETTE.accent3,
    position: "right",
    lightColor: 0x6ee7d8,
    lightIntensity: 2.3,
  },
  {
    phase: 2,
    side: "back",
    title: "The Team",
    subtitle: "Who shows up",
    description:
      "We stay small on purpose. A tight crew of senior builders — designers who write, developers who care about the story — with no layers between you and the people doing the work.",
    subPoints: [
      "Senior hands on every project",
      "The people you meet are the people who build",
    ],
    stat: "8",
    statLabel: "People in the lab",
    secondaryStat: "0",
    secondaryStatLabel: "Layers in between",
    accent: PALETTE.accent4,
    position: "left",
    lightColor: 0x8b7cf6,
    lightIntensity: 2.4,
  },
  {
    phase: 2,
    side: "back",
    title: "The Work",
    subtitle: "What it's done",
    description:
      "We've taken brands from a name on a napkin to a checkout that hums, and shaped products people genuinely stick with. The metric we care about most is the one that shows up in your revenue.",
    subPoints: [
      "E-commerce and SaaS, from seed to scale",
      "Rebuilds that quietly compound month over month",
    ],
    stat: "250+",
    statLabel: "Projects shipped",
    secondaryStat: "6",
    secondaryStatLabel: "Industries served",
    accent: PALETTE.accent5,
    position: "right",
    lightColor: 0xd6ff3f,
    lightIntensity: 2.4,
  },
  {
    phase: 3,
    side: "left",
    title: "The Promise",
    subtitle: "What we owe you",
    description:
      "We use the internet every day, so we build for people who do too. A few years and a lot of launches later, we're still the studio that treats your product like it's ours — and answers like it.",
    subPoints: [
      "We use every tool we recommend",
      "Your dashboard is our bedtime reading",
    ],
    stat: "98%",
    statLabel: "Would refer us",
    secondaryStat: "<2h",
    secondaryStatLabel: "Avg. reply time",
    accent: PALETTE.accent6,
    position: "left",
    lightColor: 0xf5f3ee,
    lightIntensity: 2.0,
  },
];

// ───────────────────────────────────────────────────────────────
// SHADERS
// ───────────────────────────────────────────────────────────────

const iridescentVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uWaveIntensity;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float noise1 = snoise(pos * 1.5 + uTime * 0.15);
    float noise2 = snoise(pos * 3.0 - uTime * 0.1) * 0.3;
    float combinedNoise = (noise1 + noise2) * uWaveIntensity;
    pos += normal * combinedNoise;
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const iridescentFragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uIridescenceColor1;
  uniform vec3 uIridescenceColor2;
  uniform vec3 uIridescenceColor3;
  uniform float uFresnelPower;
  uniform float uMetalness;
  uniform float uRoughness;
  uniform float uClearcoat;
  uniform float uTime;
  uniform float uScrollVelocity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
    fresnel = smoothstep(0.0, 1.0, fresnel);
    float hueShift = dot(vWorldPosition, viewDir) * 0.3 + uTime * 0.05;
    hueShift = fract(hueShift);
    vec3 iridColor;
    float t1 = smoothstep(0.0, 0.33, hueShift);
    float t2 = smoothstep(0.33, 0.66, hueShift);
    float t3 = smoothstep(0.66, 1.0, hueShift);
    iridColor = mix(uIridescenceColor1, uIridescenceColor2, t1);
    iridColor = mix(iridColor, uIridescenceColor3, t2);
    iridColor = mix(iridColor, uIridescenceColor1, t3);
    vec3 baseColor = uBaseColor * (1.0 - uMetalness * 0.2);
    vec3 color = baseColor;
    color += iridColor * fresnel * uMetalness * 0.7;
    color += vec3(1.0, 0.98, 0.95) * fresnel * uClearcoat * 0.3;
    vec3 lightDir = normalize(vec3(3.0, 5.0, 8.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(normal, halfDir), 0.0);
    float specular = pow(specAngle, 80.0);
    color += vec3(1.0, 0.97, 0.9) * specular * 0.5 * uMetalness;
    vec3 fillDir = normalize(vec3(-4.0, -2.0, 6.0));
    vec3 fillHalf = normalize(fillDir + viewDir);
    float fillSpec = pow(max(dot(normal, fillHalf), 0.0), 40.0);
    color += uIridescenceColor2 * fillSpec * 0.15;
    float ao = 0.5 + 0.5 * normal.y;
    color *= mix(0.7, 1.0, ao);
    color += uIridescenceColor1 * pow(fresnel, 4.0) * 0.15;
    color = color * (2.51 * color + 0.03) / (color * (2.43 * color + 0.59) + 0.14);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const cinematicPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainIntensity: { value: 0.025 },
    uVignetteIntensity: { value: 0.45 },
    uVignetteSize: { value: 0.55 },
    uRgbShiftAmount: { value: 0.001 },
    uScrollProgress: { value: 0 },
    uWarmth: { value: 0.005 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainIntensity;
    uniform float uVignetteIntensity;
    uniform float uVignetteSize;
    uniform float uRgbShiftAmount;
    uniform float uScrollProgress;
    uniform float uWarmth;
    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float dist = length(uv - 0.5);
      float shift = uRgbShiftAmount * dist * dist;
      float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;
      vec3 color = vec3(r, g, b);
      color.r += uWarmth;
      color.b -= uWarmth * 0.5;
      float grain = (random(uv * 800.0 + uTime * 100.0) - 0.5) * uGrainIntensity;
      color += grain;
      float vignette = 1.0 - smoothstep(uVignetteSize, 1.4, dist * 2.0);
      vignette = pow(vignette, 1.2);
      color *= mix(1.0, vignette, uVignetteIntensity);
      color = color * 0.95 + 0.02;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// ───────────────────────────────────────────────────────────────
// COMPONENT
// ───────────────────────────────────────────────────────────────

export default function AboutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const scrollProgressRef = useRef(0);
  const smoothScrollProgressRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    textMesh: THREE.Mesh | null;
    glowMesh: THREE.Mesh | null;
    particles: THREE.Points | null;
    glowSphere: THREE.Mesh | null;
    lights: {
      main: THREE.DirectionalLight;
      accent: THREE.PointLight;
      rim: THREE.PointLight;
      back: THREE.SpotLight;
    };
    postPass: ShaderPass | null;
  } | null>(null);

  // Brand light colors (0–1 RGB): lime / purple / cyan
  const proxyRef = useRef({
    rotY: 0,
    rotX: 0,
    camX: 0,
    camY: 0,
    camZ: 24,
    mainR: 0.839,
    mainG: 1.0,
    mainB: 0.247,
    mainInt: 2.2,
    accentR: 0.545,
    accentG: 0.486,
    accentB: 0.965,
    accentInt: 0.8,
    rimR: 0.431,
    rimG: 0.906,
    rimB: 0.847,
    rimInt: 0.4,
    caBoost: 0,
    textScale: 1,
  });

  // ─── CLIENT CHECK ─────────────────────────────────
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ─── THREE.JS INIT ────────────────────────────────
  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d12, 0.012);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0d12, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8,
      0.5,
      0.9
    );
    bloomPass.threshold = 0.25;
    bloomPass.strength = 0.7;
    bloomPass.radius = 0.8;
    composer.addPass(bloomPass);

    const postPass = new ShaderPass(cinematicPostShader);
    composer.addPass(postPass);

    // Lighting — brand-tinted, cinematic
    const ambientLight = new THREE.AmbientLight(0x12141b, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xd6ff3f, 2.2);
    mainLight.position.set(4, 6, 10);
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0x8b7cf6, 0.8, 60);
    accentLight.position.set(-10, 4, 6);
    scene.add(accentLight);

    const rimLight = new THREE.PointLight(0x6ee7d8, 0.4, 50);
    rimLight.position.set(8, -4, 8);
    scene.add(rimLight);

    const backLight = new THREE.SpotLight(0xf5f3ee, 0.6);
    backLight.position.set(0, 12, -12);
    backLight.lookAt(0, 0, 0);
    scene.add(backLight);

    const lights = { main: mainLight, accent: accentLight, rim: rimLight, back: backLight };

    const textSize = 2.0;
    const textDepth = 0.3;
    const bevelThickness = 0.04;
    const bevelSize = 0.025;

    const loader = new FontLoader();
    let textMesh: THREE.Mesh | null = null;
    let glowMesh: THREE.Mesh | null = null;

    const createFallbackText = () => {
      const textCanvas = document.createElement("canvas");
      textCanvas.width = 1024;
      textCanvas.height = 256;
      const ctx = textCanvas.getContext("2d")!;
      ctx.fillStyle = "#D6FF3F";
      ctx.font = "bold 180px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VEYRA", 512, 128);

      const texture = new THREE.CanvasTexture(textCanvas);
      const geometry = new THREE.PlaneGeometry(12, 3);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      return mesh;
    };

    const fontUrl = "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";

    loader.load(
      fontUrl,
      (font) => {
        if (textMesh) scene.remove(textMesh);

        const textGeo = new TextGeometry("VEYRA", {
          font,
          size: textSize,
          depth: textDepth,
          curveSegments: 32,
          bevelEnabled: true,
          bevelThickness,
          bevelSize,
          bevelOffset: 0,
          bevelSegments: 10,
        });
        textGeo.computeBoundingBox();
        const centerOffset = -0.5 * (textGeo.boundingBox!.max.x - textGeo.boundingBox!.min.x);
        textGeo.translate(centerOffset, 0, 0);

        const textUniforms = {
          uTime: { value: 0 },
          uWaveIntensity: { value: 0.015 },
          uBaseColor: { value: new THREE.Color(0x12141b) },
          uIridescenceColor1: { value: new THREE.Color(0xd6ff3f) },
          uIridescenceColor2: { value: new THREE.Color(0x8b7cf6) },
          uIridescenceColor3: { value: new THREE.Color(0x6ee7d8) },
          uFresnelPower: { value: 2.8 },
          uMetalness: { value: 0.9 },
          uRoughness: { value: 0.2 },
          uClearcoat: { value: 0.8 },
          uScrollVelocity: { value: 0 },
        };

        const textMaterial = new THREE.ShaderMaterial({
          uniforms: textUniforms,
          vertexShader: iridescentVertexShader,
          fragmentShader: iridescentFragmentShader,
          side: THREE.DoubleSide,
        });

        textMesh = new THREE.Mesh(textGeo, textMaterial);
        textMesh.position.set(0, 0, 0);
        scene.add(textMesh);

        const glowGeo = new TextGeometry("VEYRA", {
          font,
          size: textSize + 0.05,
          depth: textDepth + 0.05,
          curveSegments: 16,
          bevelEnabled: true,
          bevelThickness: bevelThickness + 0.03,
          bevelSize: bevelSize + 0.02,
          bevelOffset: 0,
          bevelSegments: 4,
        });
        glowGeo.computeBoundingBox();
        const glowCenterOffset = -0.5 * (glowGeo.boundingBox!.max.x - glowGeo.boundingBox!.min.x);
        glowGeo.translate(glowCenterOffset, 0, 0);

        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xd6ff3f,
          transparent: true,
          opacity: 0.05,
          side: THREE.BackSide,
        });

        glowMesh = new THREE.Mesh(glowGeo, glowMaterial);
        scene.add(glowMesh);

        sceneRef.current!.textMesh = textMesh;
        sceneRef.current!.glowMesh = glowMesh;
        setIsLoaded(true);
      },
      undefined,
      () => {
        textMesh = createFallbackText();
        sceneRef.current!.textMesh = textMesh;
        sceneRef.current!.glowMesh = textMesh;
        setIsLoaded(true);
      }
    );

    // Particles — brand palette
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < particleCount; i++) {
      const s = i * 7.3;
      positions[i * 3] = (seededRandom(s) - 0.5) * 40;
      positions[i * 3 + 1] = (seededRandom(s + 1) - 0.5) * 40;
      positions[i * 3 + 2] = (seededRandom(s + 2) - 0.5) * 20;
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      const colorChoice = seededRandom(s + 3);
      if (colorChoice < 0.5) {
        // Lime
        colors[i * 3] = 0.84;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.25;
      } else if (colorChoice < 0.75) {
        // Purple
        colors[i * 3] = 0.545;
        colors[i * 3 + 1] = 0.486;
        colors[i * 3 + 2] = 0.965;
      } else {
        // Off-white
        colors[i * 3] = 0.96;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.93;
      }
      sizes[i] = 0.02 + seededRandom(s + 4) * 0.04;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const glowSphereGeo = new THREE.SphereGeometry(14, 32, 32);
    const glowSphereMat = new THREE.MeshBasicMaterial({
      color: 0x8b7cf6,
      transparent: true,
      opacity: 0.015,
      side: THREE.BackSide,
    });
    const glowSphere = new THREE.Mesh(glowSphereGeo, glowSphereMat);
    scene.add(glowSphere);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      composer,
      textMesh: null,
      glowMesh: null,
      particles,
      glowSphere,
      lights,
      postPass,
    };

    // ─── ANIMATION LOOP ─────────────────────────────
    let startTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      const currentTime = performance.now();
      const elapsed = (currentTime - startTime) / 1000;
      frameCount++;

      const {
        textMesh: tMesh,
        glowMesh: gMesh,
        particles: ptcl,
        glowSphere: gSphere,
        lights: l,
        postPass: pp,
        camera: cam,
      } = sceneRef.current!;

      const proxy = proxyRef.current;

      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.03;

      if (tMesh) {
        const uniforms = (tMesh.material as THREE.ShaderMaterial).uniforms;

        tMesh.rotation.y += (proxy.rotY - tMesh.rotation.y) * 0.035;
        tMesh.rotation.x += (proxy.rotX - tMesh.rotation.x) * 0.03;

        const floatY = Math.sin(elapsed * 0.3) * 0.15;
        const floatX = Math.cos(elapsed * 0.2) * 0.05;
        tMesh.position.y += (floatY - tMesh.position.y) * 0.02;
        tMesh.position.x += (floatX - tMesh.position.x) * 0.02;

        const isIdle = scrollVelocityRef.current < 0.005;
        if (isIdle) {
          tMesh.rotation.z = Math.sin(elapsed * 0.25) * 0.004;
        } else {
          tMesh.rotation.z *= 0.95;
        }

        const targetScale = proxy.textScale + Math.sin(elapsed * 0.4) * 0.005;
        tMesh.scale.setScalar(tMesh.scale.x + (targetScale - tMesh.scale.x) * 0.02);

        uniforms.uTime.value = elapsed;
        uniforms.uScrollVelocity.value += (scrollVelocityRef.current - uniforms.uScrollVelocity.value) * 0.05;

        if (gMesh) {
          gMesh.rotation.copy(tMesh.rotation);
          gMesh.position.copy(tMesh.position);
          gMesh.scale.copy(tMesh.scale);
        }
      }

      cam.position.x += (proxy.camX + mouseRef.current.x * 0.3 - cam.position.x) * 0.025;
      cam.position.y += (proxy.camY + mouseRef.current.y * 0.2 - cam.position.y) * 0.025;
      cam.position.z += (proxy.camZ - cam.position.z) * 0.025;
      cam.lookAt(0, 0, 0);

      const lerpSpeed = 0.025;
      l.main.color.r += (proxy.mainR - l.main.color.r) * lerpSpeed;
      l.main.color.g += (proxy.mainG - l.main.color.g) * lerpSpeed;
      l.main.color.b += (proxy.mainB - l.main.color.b) * lerpSpeed;
      l.main.intensity += (proxy.mainInt - l.main.intensity) * lerpSpeed;

      l.accent.color.r += (proxy.accentR - l.accent.color.r) * lerpSpeed;
      l.accent.color.g += (proxy.accentG - l.accent.color.g) * lerpSpeed;
      l.accent.color.b += (proxy.accentB - l.accent.color.b) * lerpSpeed;
      l.accent.intensity += (proxy.accentInt - l.accent.intensity) * lerpSpeed;

      l.rim.color.r += (proxy.rimR - l.rim.color.r) * lerpSpeed;
      l.rim.color.g += (proxy.rimG - l.rim.color.g) * lerpSpeed;
      l.rim.color.b += (proxy.rimB - l.rim.color.b) * lerpSpeed;
      l.rim.intensity += (proxy.rimInt - l.rim.intensity) * lerpSpeed;

      if (ptcl) {
        const posArray = ptcl.geometry.attributes.position.array as Float32Array;
        const timeScale = elapsed * 0.08;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const px = posArray[idx];
          const py = posArray[idx + 1];
          const pz = posArray[idx + 2];

          const curlX = Math.sin(py * 0.1 + timeScale) * Math.cos(pz * 0.08);
          const curlY = Math.cos(pz * 0.1 + timeScale) * Math.sin(px * 0.08);
          const curlZ = Math.sin(px * 0.1 + timeScale) * Math.cos(py * 0.08);

          velocities[idx] += curlX * 0.003;
          velocities[idx + 1] += curlY * 0.003;
          velocities[idx + 2] += curlZ * 0.002;

          const mx = mouseRef.current.x * 12;
          const my = -mouseRef.current.y * 12;
          const distToMouse = Math.sqrt((px - mx) ** 2 + (py - my) ** 2);
          if (distToMouse < 6) {
            const force = (6 - distToMouse) * 0.0005;
            velocities[idx] += (mx - px) * force;
            velocities[idx + 1] += (my - py) * force;
          }

          velocities[idx] *= 0.97;
          velocities[idx + 1] *= 0.97;
          velocities[idx + 2] *= 0.97;

          posArray[idx] += velocities[idx];
          posArray[idx + 1] += velocities[idx + 1];
          posArray[idx + 2] += velocities[idx + 2];

          if (Math.abs(posArray[idx]) > 20) posArray[idx] *= -0.8;
          if (Math.abs(posArray[idx + 1]) > 20) posArray[idx + 1] *= -0.8;
          if (Math.abs(posArray[idx + 2]) > 10) posArray[idx + 2] *= -0.8;
        }

        ptcl.geometry.attributes.position.needsUpdate = true;
        ptcl.rotation.y = elapsed * 0.01;
      }

      if (gSphere) {
        gSphere.scale.setScalar(1 + Math.sin(elapsed * 0.4) * 0.03);
        gSphere.rotation.y = elapsed * 0.05;
      }

      if (pp) {
        pp.uniforms.uTime.value = elapsed;
        pp.uniforms.uScrollProgress.value += (smoothScrollProgressRef.current - pp.uniforms.uScrollProgress.value) * 0.03;
      }

      composer.render();
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      composer.dispose();
    };
  }, [isClient]);

  // ─── SCROLL TRACKING ──────────────────
  useEffect(() => {
    if (!isClient) return;
    let rafId: number;
    let lastY = window.scrollY;
    let vel = 0;

    const track = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastY);
      vel += (delta * 0.008 - vel) * 0.06;
      scrollVelocityRef.current = Math.min(vel, 1.0);
      lastY = currentY;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const rawProgress = maxScroll > 0 ? currentY / maxScroll : 0;
      scrollProgressRef.current = rawProgress;
      smoothScrollProgressRef.current += (rawProgress - smoothScrollProgressRef.current) * 0.04;

      rafId = requestAnimationFrame(track);
    };
    rafId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafId);
  }, [isClient]);

  // ─── GSAP SCROLL ANIMATIONS ───
  useGSAP(
    () => {
      if (!sceneRef.current?.textMesh || !scrollContainerRef.current) return;

      const proxy = proxyRef.current;

      // Intro hero fades out as you start scrolling
      gsap.to(".about-intro", {
        opacity: 0,
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: ".about-intro",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Master timeline — brand light choreography (lime → purple → cyan → lime)
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // Phase 0: Front — gentle intro (stays lime)
      masterTl.to(proxy, {
        rotY: Math.PI * 0.04,
        rotX: 0.02,
        camX: 0.3,
        camY: 0.1,
        camZ: 23,
        ease: "none",
      }, 0);

      // Transition → Right (purple key, cyan accent)
      masterTl.to(proxy, {
        rotY: -Math.PI * 0.5,
        rotX: -0.01,
        camX: -1.5,
        camY: -0.2,
        camZ: 20,
        mainR: 0.545,
        mainG: 0.486,
        mainB: 0.965,
        mainInt: 1.8,
        accentR: 0.431,
        accentG: 0.906,
        accentB: 0.847,
        accentInt: 2.5,
        rimR: 0.545,
        rimG: 0.486,
        rimB: 0.965,
        rimInt: 0.6,
        ease: "power1.inOut",
      }, 0.14);

      // Dwell on Right
      masterTl.to(proxy, {
        rotY: -Math.PI * 0.52,
        camX: -1.2,
        ease: "none",
      }, 0.28);

      // Transition → Back (cyan rim, off-white key)
      masterTl.to(proxy, {
        rotY: -Math.PI * 1.0,
        rotX: 0.01,
        camX: 1.0,
        camY: 0.2,
        camZ: 21,
        accentR: 0.545,
        accentG: 0.486,
        accentB: 0.965,
        accentInt: 1.5,
        rimR: 0.431,
        rimG: 0.906,
        rimB: 0.847,
        rimInt: 2.0,
        mainR: 0.961,
        mainG: 0.953,
        mainB: 0.933,
        mainInt: 1.5,
        ease: "power1.inOut",
      }, 0.42);

      // Dwell on Back
      masterTl.to(proxy, {
        rotY: -Math.PI * 1.03,
        camX: 1.2,
        ease: "none",
      }, 0.56);

      // Transition → Left (back to lime)
      masterTl.to(proxy, {
        rotY: -Math.PI * 1.5,
        rotX: 0,
        camX: 0,
        camY: 0,
        camZ: 23,
        rimR: 0.4,
        rimG: 0.4,
        rimB: 0.4,
        rimInt: 0.3,
        mainR: 0.839,
        mainG: 1.0,
        mainB: 0.247,
        mainInt: 2.2,
        accentR: 0.839,
        accentG: 1.0,
        accentB: 0.247,
        accentInt: 1.0,
        ease: "power1.inOut",
      }, 0.72);

      // Final settle
      masterTl.to(proxy, {
        rotY: -Math.PI * 1.52,
        rotX: 0.01,
        camZ: 24,
        ease: "none",
      }, 0.88);

      // ─── PER-PANEL ANIMATIONS ───────────────────────
      const sections = gsap.utils.toArray<HTMLElement>(".story-panel-section");

      sections.forEach((section) => {
        const panel = section.querySelector(".story-panel");
        const wrapper = section.querySelector(".panel-content-wrapper");
        const isLeft = section.dataset.position === "left";

        if (wrapper) {
          gsap.fromTo(
            wrapper,
            { y: 40 },
            {
              y: -50,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 2,
              },
            }
          );
        }

        if (panel) {
          gsap.fromTo(
            panel,
            {
              x: isLeft ? -80 : 80,
              opacity: 0,
              scale: 0.97,
            },
            {
              x: 0,
              opacity: 1,
              scale: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 82%",
                end: "top 45%",
                scrub: 1,
              },
            }
          );
        }

        const content = section.querySelector(".panel-content");
        if (content) {
          gsap.fromTo(
            content.children,
            { y: 25, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.06,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 78%",
                end: "top 48%",
                scrub: 0.8,
              },
            }
          );
        }

        const statEls = section.querySelectorAll<HTMLElement>(".panel-stat");
        statEls.forEach((stat) => {
          const numEl = stat.querySelector<HTMLElement>(".stat-number");
          if (!numEl) return;

          const raw = numEl.dataset.value;
          const prefix = numEl.dataset.prefix || "";
          const suffix = numEl.dataset.suffix || "";
          const numericValue = parseFloat(raw || "0");
          if (Number.isNaN(numericValue)) return;

          const counter = { val: 0 };
          gsap.to(counter, {
            val: numericValue,
            duration: 1.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: stat,
              start: "top 88%",
              toggleActions: "play none none none",
            },
            onUpdate: () => {
              const rounded = Number.isInteger(numericValue)
                ? Math.round(counter.val)
                : parseFloat(counter.val.toFixed(1));
              numEl.textContent = `${prefix}${rounded}${suffix}`;
            },
          });

          gsap.fromTo(
            stat,
            { scale: 0.94, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: {
                trigger: stat,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      });
    },
    { scope: scrollContainerRef, dependencies: [isLoaded] }
  );

  // ─── SSR FALLBACK ────────────────────────────────
  if (!isClient) {
    return (
      <main className="relative min-h-screen bg-[#0B0D12]">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border border-[#D6FF3F]/30 border-t-[#D6FF3F]" />
            <p className="text-xs uppercase tracking-[0.25em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
              Loading Experience
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative bg-[#0B0D12]">
      {/* Fixed 3D Canvas */}
      <div ref={containerRef} className="fixed inset-0 z-0 h-screen w-full">
        <canvas ref={canvasRef} className="h-full w-full" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D12]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border border-[#D6FF3F]/30 border-t-[#D6FF3F]" />
              <p className="text-xs uppercase tracking-[0.25em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                Loading Experience
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scroll Content */}
      <div ref={scrollContainerRef} className="relative z-10">
        {/* ── INTRO / SCROLL HINT ── */}
        <section className="about-intro relative flex h-screen flex-col items-center justify-center px-6 text-center">
          <div className="max-w-2xl">
            <p
              className="mb-6 text-[11px] uppercase tracking-[0.35em] text-[#D6FF3F]/80"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              About Veyra
            </p>
            <h1
              className="text-5xl leading-[1.05] tracking-tight text-[#F5F3EE] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              The story behind{" "}
              <span className="bg-gradient-to-r from-[#D6FF3F] to-[#8B7CF6] bg-clip-text text-transparent">
                the lab
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-md text-base leading-relaxed text-white/45">
              Two founders, one room, and a stubborn belief that great brands are
              grown — not assembled. Here&apos;s who we are and how we work.
            </p>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div
              className="flex flex-col items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/40"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Scroll for more
              <span className="scroll-cue relative h-10 w-px overflow-hidden bg-white/10">
                <span className="scroll-cue-dot absolute left-0 h-4 w-px bg-[#D6FF3F]" />
              </span>
            </div>
          </div>
        </section>

        {/* Story Panels */}
        {storyPanels.map((panel, index) => {
          const numericMatch = panel.stat.match(/([<$]?)([0-9]+)(.*)/);
          const prefix = numericMatch?.[1] || "";
          const numericValue = numericMatch?.[2] || "0";
          const suffix = numericMatch?.[3] || "";

          const secNumericMatch = panel.secondaryStat?.match(/([<$]?)([0-9]+)(.*)/);
          const secPrefix = secNumericMatch?.[1] || "";
          const secNumericValue = secNumericMatch?.[2] || "0";
          const secSuffix = secNumericMatch?.[3] || "";

          return (
            <section
              key={`${panel.side}-${index}`}
              className="story-panel-section relative min-h-screen px-6 py-24 md:px-12 lg:px-20"
              data-position={panel.position}
              data-phase={panel.phase}
            >
              <div
                className={`story-panel mx-auto flex max-w-7xl min-h-[80vh] items-center ${
                  panel.position === "left" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`panel-content-wrapper max-w-lg ${
                    panel.position === "left" ? "text-left" : "text-right"
                  }`}
                >
                  <div className="panel-content">
                    {/* Index + accent line */}
                    <div
                      className={`mb-8 flex items-center gap-3 ${
                        panel.position === "right" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {panel.position === "left" && (
                        <span
                          className="text-[11px] tabular-nums"
                          style={{ color: panel.accent, opacity: 0.7, fontFamily: "var(--font-mono)" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                      <div
                        className="h-px w-12 transition-all duration-700"
                        style={{ background: `linear-gradient(90deg, ${panel.accent}, transparent)` }}
                      />
                      {panel.position === "right" && (
                        <span
                          className="text-[11px] tabular-nums"
                          style={{ color: panel.accent, opacity: 0.7, fontFamily: "var(--font-mono)" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Subtitle */}
                    <p
                      className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em]"
                      style={{ color: panel.accent, opacity: 0.7, fontFamily: "var(--font-mono)" }}
                    >
                      {panel.subtitle}
                    </p>

                    {/* Title */}
                    <h2
                      className="mb-6 text-4xl leading-[1.1] tracking-tight text-[#F5F3EE] sm:text-5xl lg:text-6xl"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                    >
                      {panel.title}
                    </h2>

                    {/* Description */}
                    <p className="mb-8 text-base leading-[1.8] text-white/45">
                      {panel.description}
                    </p>

{/* Sub points */}
{panel.subPoints && panel.subPoints.length > 0 && (
  <ul
    className={`mb-10 space-y-3.5 ${
      panel.position === "right" ? "ml-auto" : ""
    }`}
    style={{ maxWidth: "340px" }}
  >
    {panel.subPoints.map((point, i) => (
      <li
        key={i}
        className={`flex items-start gap-3 text-sm leading-relaxed text-white/40 ${
          panel.position === "right" ? "flex-row-reverse text-right" : "text-left"
        }`}
      >
        {/* marker — sits on the outer edge, points toward the text */}
        <span
          aria-hidden="true"
          className="mt-[0.62em] h-px w-4 shrink-0"
          style={{
            background: `linear-gradient(${
              panel.position === "right" ? "270deg" : "90deg"
            }, ${panel.accent}, transparent)`,
            opacity: 0.7,
          }}
        />
        <span className="flex-1">{point}</span>
      </li>
    ))}
  </ul>
)}
                  </div>

                  {/* Stats */}
                  <div
                    className={`panel-stats flex flex-wrap items-center gap-3 ${
                      panel.position === "right" ? "justify-end" : ""
                    }`}
                  >
                    <div className="panel-stat flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 backdrop-blur-md">
                      <span
                        className="stat-number text-3xl tracking-tight sm:text-4xl"
                        style={{ color: panel.accent, fontFamily: "var(--font-display)", fontWeight: 600 }}
                        data-prefix={prefix}
                        data-value={numericValue}
                        data-suffix={suffix}
                      >
                        {panel.stat}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-[0.15em] text-white/30"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {panel.statLabel}
                      </span>
                    </div>

                    {panel.secondaryStat && (
                      <div className="panel-stat flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] px-5 py-3.5 backdrop-blur-md">
                        <span
                          className="stat-number text-xl sm:text-2xl"
                          style={{ color: panel.accent, opacity: 0.8, fontFamily: "var(--font-display)", fontWeight: 600 }}
                          data-prefix={secPrefix}
                          data-value={secNumericValue}
                          data-suffix={secSuffix}
                        >
                          {panel.secondaryStat}
                        </span>
                        <span
                          className="text-[9px] uppercase tracking-[0.12em] text-white/25"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {panel.secondaryStatLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* End spacer */}
        <div className="h-[40vh]" />
      </div>

      <style jsx global>{`
        .scroll-cue-dot {
          animation: veyra-scroll-cue 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @keyframes veyra-scroll-cue {
          0% { top: -40%; opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-cue-dot { animation: none; top: 0; opacity: 1; }
        }
      `}</style>
    </main>
  );
}