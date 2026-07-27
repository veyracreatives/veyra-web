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
// REFINED COLOR PALETTE — Warm Gold + Deep Charcoal + Soft Ivory
// ───────────────────────────────────────────────────────────────

const PALETTE = {
  bg: "#0A0A0F",
  bgDeep: "#060609",
  gold: "#E8C547",
  goldSoft: "#D4A843",
  champagne: "#F2E6C9",
  ivory: "#FAF8F2",
  warmWhite: "#F5F0E8",
  coolSlate: "#8B9DAF",
  deepBlue: "#1A2332",
  accent1: "#E8C547", // Gold
  accent2: "#7BA3C9", // Soft Steel Blue
  accent3: "#C9A87C", // Warm Sand
  accent4: "#9B8EC9", // Muted Lavender
  accent5: "#6BBFA8", // Sage Teal
  accent6: "#E8C547", // Gold (bookend)
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
// CONTENT
// ───────────────────────────────────────────────────────────────

const storyPanels: StoryPanel[] = [
  {
    phase: 0,
    side: "front",
    title: "The Lab",
    subtitle: "Where marketing meets design",
    description:
      "Veyra started as a two-person experiment: what happens when a performance marketer and a designer refuse to work in separate rooms?",
    subPoints: [
      "Performance marketing that actually performs",
      "Design systems built for conversion, not just applause",
    ],
    stat: "40+",
    statLabel: "Brands launched",
    secondaryStat: "2×",
    secondaryStatLabel: "Faster to market",
    accent: PALETTE.accent1,
    position: "right",
    lightColor: 0xe8c547,
    lightIntensity: 2.2,
  },
  {
    phase: 1,
    side: "right",
    title: "The Method",
    subtitle: "Results over resumes",
    description:
      "We don't bill by the hour. We ship by the result. Every project is a bet on ourselves — if it doesn't convert, we fix it. For free.",
    subPoints: [
      "Fixed-price sprints. No timesheets.",
      "If metrics drop post-launch, we iterate until they don't.",
    ],
    stat: "6",
    statLabel: "Years running",
    secondaryStat: "14d",
    secondaryStatLabel: "Avg. sprint length",
    accent: PALETTE.accent2,
    position: "left",
    lightColor: 0x7ba3c9,
    lightIntensity: 2.6,
  },
  {
    phase: 1,
    side: "right",
    title: "The Process",
    subtitle: "From chaos to shipped in three acts",
    description:
      "We don't do discovery decks that collect dust. We audit, we strategize, we build. Then we measure what actually moved the needle.",
    subPoints: [
      "Audit → Strategy → Build → Measure",
      "Weekly demos, not monthly status reports",
    ],
    stat: "3",
    statLabel: "Steps to launch",
    secondaryStat: "100%",
    secondaryStatLabel: "Client visibility",
    accent: PALETTE.accent3,
    position: "right",
    lightColor: 0xc9a87c,
    lightIntensity: 2.4,
  },
  {
    phase: 2,
    side: "back",
    title: "The Team",
    subtitle: "Deliberately small, dangerously capable",
    description:
      "Twelve people. No middle managers. No account executives who can't use Figma. Just builders who give a damn.",
    subPoints: [
      "Senior-only. No juniors learning on your dime.",
      "Designers who write copy. Developers who care about UX.",
    ],
    stat: "12",
    statLabel: "People in the lab",
    secondaryStat: "0",
    secondaryStatLabel: "Middle managers",
    accent: PALETTE.accent4,
    position: "left",
    lightColor: 0x9b8ec9,
    lightIntensity: 2.5,
  },
  {
    phase: 2,
    side: "back",
    title: "The Work",
    subtitle: "Results that show up in revenue, not résumés",
    description:
      "We've launched brands from zero to eight figures. Rebuilt checkout flows that added millions. Designed products people actually stick with.",
    subPoints: [
      "E-commerce brands doing $10M+ annually",
      "SaaS startups scaling seed to Series B",
    ],
    stat: "$40M+",
    statLabel: "Revenue influenced",
    secondaryStat: "6",
    secondaryStatLabel: "Industries served",
    accent: PALETTE.accent5,
    position: "right",
    lightColor: 0x6bbfa8,
    lightIntensity: 2.6,
  },
  {
    phase: 3,
    side: "left",
    title: "The Promise",
    subtitle: "We use the internet. So we build for it.",
    description:
      "A few years, dozens of launches, and one very overworked coffee machine later — we're still the studio that behaves like people who actually use the internet.",
    subPoints: [
      "We dog-food every tool we recommend.",
      "Your analytics dashboard is our bedtime reading.",
    ],
    stat: "100%",
    statLabel: "Client retention",
    secondaryStat: "<2h",
    secondaryStatLabel: "Avg. response time",
    accent: PALETTE.accent6,
    position: "left",
    lightColor: 0xe8c547,
    lightIntensity: 2.0,
  },
];

// ───────────────────────────────────────────────────────────────
// REFINED SHADERS — Smoother, more elegant
// ───────────────────────────────────────────────────────────────

const iridescentVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uWaveIntensity;

  // Simplex noise
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
    
    // Gentler wave — more liquid, less jittery
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
    
    // Smooth fresnel
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
    fresnel = smoothstep(0.0, 1.0, fresnel);
    
    // Elegant iridescence — slower, more subtle shift
    float hueShift = dot(vWorldPosition, viewDir) * 0.3 + uTime * 0.05;
    hueShift = fract(hueShift); // Keep in 0-1 range for smooth cycling
    
    vec3 iridColor;
    float t1 = smoothstep(0.0, 0.33, hueShift);
    float t2 = smoothstep(0.33, 0.66, hueShift);
    float t3 = smoothstep(0.66, 1.0, hueShift);
    
    iridColor = mix(uIridescenceColor1, uIridescenceColor2, t1);
    iridColor = mix(iridColor, uIridescenceColor3, t2);
    iridColor = mix(iridColor, uIridescenceColor1, t3);
    
    // Base with subtle depth
    vec3 baseColor = uBaseColor * (1.0 - uMetalness * 0.2);
    vec3 color = baseColor;
    
    // Iridescence only at edges (fresnel-gated)
    color += iridColor * fresnel * uMetalness * 0.7;
    
    // Clearcoat highlight
    color += vec3(1.0, 0.98, 0.95) * fresnel * uClearcoat * 0.3;
    
    // Soft specular
    vec3 lightDir = normalize(vec3(3.0, 5.0, 8.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(normal, halfDir), 0.0);
    float specular = pow(specAngle, 80.0);
    color += vec3(1.0, 0.97, 0.9) * specular * 0.5 * uMetalness;
    
    // Secondary fill light
    vec3 fillDir = normalize(vec3(-4.0, -2.0, 6.0));
    vec3 fillHalf = normalize(fillDir + viewDir);
    float fillSpec = pow(max(dot(normal, fillHalf), 0.0), 40.0);
    color += uIridescenceColor2 * fillSpec * 0.15;
    
    // Ambient occlusion approximation
    float ao = 0.5 + 0.5 * normal.y;
    color *= mix(0.7, 1.0, ao);
    
    // Subtle rim glow
    color += uIridescenceColor1 * pow(fresnel, 4.0) * 0.15;
    
    // ACES tone mapping
    color = color * (2.51 * color + 0.03) / (color * (2.43 * color + 0.59) + 0.14);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Refined post-processing: subtle grain, gentle vignette, minimal RGB shift
const cinematicPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainIntensity: { value: 0.025 },
    uVignetteIntensity: { value: 0.45 },
    uVignetteSize: { value: 0.55 },
    uRgbShiftAmount: { value: 0.001 },
    uScrollProgress: { value: 0 },
    uWarmth: { value: 0.02 },
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
      
      // Very subtle RGB shift — only at edges
      float dist = length(uv - 0.5);
      float shift = uRgbShiftAmount * dist * dist;
      float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;
      vec3 color = vec3(r, g, b);
      
      // Warm color grade
      color.r += uWarmth;
      color.b -= uWarmth * 0.5;
      
      // Film grain — very subtle
      float grain = (random(uv * 800.0 + uTime * 100.0) - 0.5) * uGrainIntensity;
      color += grain;
      
      // Smooth vignette
      float vignette = 1.0 - smoothstep(uVignetteSize, 1.4, dist * 2.0);
      vignette = pow(vignette, 1.2);
      color *= mix(1.0, vignette, uVignetteIntensity);
      
      // Slight lift in shadows for cinematic feel
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

  const proxyRef = useRef({
    rotY: 0,
    rotX: 0,
    camX: 0,
    camY: 0,
    camZ: 24,
    mainR: 0.91,
    mainG: 0.77,
    mainB: 0.28,
    mainInt: 2.2,
    accentR: 0.48,
    accentG: 0.64,
    accentB: 0.79,
    accentInt: 0.8,
    rimR: 0.6,
    rimG: 0.55,
    rimB: 0.79,
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

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.012);

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
    renderer.setClearColor(0x0a0a0f, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Post-processing — refined chain
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Softer bloom
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

    // Cinematic post
    const postPass = new ShaderPass(cinematicPostShader);
    composer.addPass(postPass);

    // Lighting — warm, cinematic
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xe8c547, 2.2);
    mainLight.position.set(4, 6, 10);
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0x7ba3c9, 0.8, 60);
    accentLight.position.set(-10, 4, 6);
    scene.add(accentLight);

    const rimLight = new THREE.PointLight(0x9b8ec9, 0.4, 50);
    rimLight.position.set(8, -4, 8);
    scene.add(rimLight);

    const backLight = new THREE.SpotLight(0xf2e6c9, 0.6);
    backLight.position.set(0, 12, -12);
    backLight.lookAt(0, 0, 0);
    scene.add(backLight);

    const lights = { main: mainLight, accent: accentLight, rim: rimLight, back: backLight };

    // Text
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
      ctx.fillStyle = "#E8C547";
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
          uBaseColor: { value: new THREE.Color(0x1a1a2e) },
          uIridescenceColor1: { value: new THREE.Color(0xe8c547) },
          uIridescenceColor2: { value: new THREE.Color(0x7ba3c9) },
          uIridescenceColor3: { value: new THREE.Color(0x9b8ec9) },
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

        // Soft glow shell
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
          color: 0xe8c547,
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

    // Particles — refined, fewer, more elegant
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

      // Warm palette particles
      const colorChoice = seededRandom(s + 3);
      if (colorChoice < 0.5) {
        // Gold
        colors[i * 3] = 0.91;
        colors[i * 3 + 1] = 0.77;
        colors[i * 3 + 2] = 0.28;
      } else if (colorChoice < 0.75) {
        // Soft blue
        colors[i * 3] = 0.48;
        colors[i * 3 + 1] = 0.64;
        colors[i * 3 + 2] = 0.79;
      } else {
        // Warm ivory
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.79;
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

    // Ambient glow sphere — very subtle
    const glowSphereGeo = new THREE.SphereGeometry(14, 32, 32);
    const glowSphereMat = new THREE.MeshBasicMaterial({
      color: 0xe8c547,
      transparent: true,
      opacity: 0.015,
      side: THREE.BackSide,
    });
    const glowSphere = new THREE.Mesh(glowSphereGeo, glowSphereMat);
    scene.add(glowSphere);

    // Store refs
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
      const elapsed = (currentTime - startTime) / 1000; // Convert milliseconds to seconds
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

      // Smooth mouse
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.03;

      if (tMesh) {
        const uniforms = (tMesh.material as THREE.ShaderMaterial).uniforms;

        // Ultra-smooth rotation with lower lerp factor
        tMesh.rotation.y += (proxy.rotY - tMesh.rotation.y) * 0.035;
        tMesh.rotation.x += (proxy.rotX - tMesh.rotation.x) * 0.03;

        // Gentle floating
        const floatY = Math.sin(elapsed * 0.3) * 0.15;
        const floatX = Math.cos(elapsed * 0.2) * 0.05;
        tMesh.position.y += (floatY - tMesh.position.y) * 0.02;
        tMesh.position.x += (floatX - tMesh.position.x) * 0.02;

        // Subtle idle breathing
        const isIdle = scrollVelocityRef.current < 0.005;
        if (isIdle) {
          tMesh.rotation.z = Math.sin(elapsed * 0.25) * 0.004;
        } else {
          tMesh.rotation.z *= 0.95;
        }

        // Scale breathing
        const targetScale = proxy.textScale + Math.sin(elapsed * 0.4) * 0.005;
        tMesh.scale.setScalar(tMesh.scale.x + (targetScale - tMesh.scale.x) * 0.02);

        // Shader uniforms
        uniforms.uTime.value = elapsed;
        uniforms.uScrollVelocity.value += (scrollVelocityRef.current - uniforms.uScrollVelocity.value) * 0.05;

        // Sync glow mesh
        if (gMesh) {
          gMesh.rotation.copy(tMesh.rotation);
          gMesh.position.copy(tMesh.position);
          gMesh.scale.copy(tMesh.scale);
        }
      }

      // Camera — very smooth
      cam.position.x += (proxy.camX + mouseRef.current.x * 0.3 - cam.position.x) * 0.025;
      cam.position.y += (proxy.camY + mouseRef.current.y * 0.2 - cam.position.y) * 0.025;
      cam.position.z += (proxy.camZ - cam.position.z) * 0.025;
      cam.lookAt(0, 0, 0);

      // Light transitions — smooth
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

      // Particles — gentle drift
      if (ptcl) {
        const posArray = ptcl.geometry.attributes.position.array as Float32Array;
        const timeScale = elapsed * 0.08;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const px = posArray[idx];
          const py = posArray[idx + 1];
          const pz = posArray[idx + 2];

          // Gentle curl noise
          const curlX = Math.sin(py * 0.1 + timeScale) * Math.cos(pz * 0.08);
          const curlY = Math.cos(pz * 0.1 + timeScale) * Math.sin(px * 0.08);
          const curlZ = Math.sin(px * 0.1 + timeScale) * Math.cos(py * 0.08);

          velocities[idx] += curlX * 0.003;
          velocities[idx + 1] += curlY * 0.003;
          velocities[idx + 2] += curlZ * 0.002;

          // Mouse influence — very subtle
          const mx = mouseRef.current.x * 12;
          const my = -mouseRef.current.y * 12;
          const distToMouse = Math.sqrt((px - mx) ** 2 + (py - my) ** 2);
          if (distToMouse < 6) {
            const force = (6 - distToMouse) * 0.0005;
            velocities[idx] += (mx - px) * force;
            velocities[idx + 1] += (my - py) * force;
          }

          // Damping
          velocities[idx] *= 0.97;
          velocities[idx + 1] *= 0.97;
          velocities[idx + 2] *= 0.97;

          posArray[idx] += velocities[idx];
          posArray[idx + 1] += velocities[idx + 1];
          posArray[idx + 2] += velocities[idx + 2];

          // Soft bounds
          if (Math.abs(posArray[idx]) > 20) posArray[idx] *= -0.8;
          if (Math.abs(posArray[idx + 1]) > 20) posArray[idx + 1] *= -0.8;
          if (Math.abs(posArray[idx + 2]) > 10) posArray[idx + 2] *= -0.8;
        }

        ptcl.geometry.attributes.position.needsUpdate = true;
        ptcl.rotation.y = elapsed * 0.01;
      }

      // Glow sphere breathing
      if (gSphere) {
        gSphere.scale.setScalar(1 + Math.sin(elapsed * 0.4) * 0.03);
        gSphere.rotation.y = elapsed * 0.05;
      }

      // Post-processing
      if (pp) {
        pp.uniforms.uTime.value = elapsed;
        pp.uniforms.uScrollProgress.value += (smoothScrollProgressRef.current - pp.uniforms.uScrollProgress.value) * 0.03;
      }

      composer.render();
    };
    animate();

    // Mouse
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize
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

  // ─── SCROLL TRACKING — Smoother ──────────────────
  useEffect(() => {
    if (!isClient) return;
    let rafId: number;
    let lastY = window.scrollY;
    let vel = 0;

    const track = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastY);
      vel += (delta * 0.008 - vel) * 0.06; // Much smoother velocity
      scrollVelocityRef.current = Math.min(vel, 1.0); // Clamp
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

  // ─── GSAP SCROLL ANIMATIONS — Smoother choreography ───
  useGSAP(
    () => {
      if (!sceneRef.current?.textMesh || !scrollContainerRef.current) return;

      const proxy = proxyRef.current;

      // Master timeline — smooth, cinematic pacing
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2, // Higher scrub = smoother
        },
      });

      // Phase 0: Front — gentle intro
      masterTl.to(proxy, {
        rotY: Math.PI * 0.04,
        rotX: 0.02,
        camX: 0.3,
        camY: 0.1,
        camZ: 23,
        ease: "none",
      }, 0);

      // Transition → Right (smooth arc)
      masterTl.to(proxy, {
        rotY: -Math.PI * 0.5,
        rotX: -0.01,
        camX: -1.5,
        camY: -0.2,
        camZ: 20,
        mainR: 0.48,
        mainG: 0.64,
        mainB: 0.79,
        mainInt: 1.8,
        accentR: 0.48,
        accentG: 0.64,
        accentB: 0.79,
        accentInt: 2.5,
        rimR: 0.6,
        rimG: 0.55,
        rimB: 0.79,
        rimInt: 0.6,
        ease: "power1.inOut",
      }, 0.14);

      // Dwell on Right
      masterTl.to(proxy, {
        rotY: -Math.PI * 0.52,
        camX: -1.2,
        ease: "none",
      }, 0.28);

      // Transition → Back
      masterTl.to(proxy, {
        rotY: -Math.PI * 1.0,
        rotX: 0.01,
        camX: 1.0,
        camY: 0.2,
        camZ: 21,
        accentR: 0.6,
        accentG: 0.55,
        accentB: 0.79,
        accentInt: 1.5,
        rimR: 0.6,
        rimG: 0.55,
        rimB: 0.79,
        rimInt: 2.0,
        mainR: 0.79,
        mainG: 0.66,
        mainB: 0.49,
        mainInt: 1.5,
        ease: "power1.inOut",
      }, 0.42);

      // Dwell on Back
      masterTl.to(proxy, {
        rotY: -Math.PI * 1.03,
        camX: 1.2,
        ease: "none",
      }, 0.56);

      // Transition → Left
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
        mainR: 0.91,
        mainG: 0.77,
        mainB: 0.28,
        mainInt: 2.2,
        accentR: 0.91,
        accentG: 0.77,
        accentB: 0.28,
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

        // Gentle parallax
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

        // Panel entrance — smooth slide + fade
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

        // Staggered content reveal
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

        // Stat counters
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
      <main className="relative min-h-screen bg-[#0A0A0F]">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border border-[#E8C547]/30 border-t-[#E8C547]" />
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Loading Experience
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative bg-[#0A0A0F]">
      {/* Fixed 3D Canvas */}
      <div ref={containerRef} className="fixed inset-0 z-0 h-screen w-full">
        <canvas ref={canvasRef} className="h-full w-full" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border border-[#E8C547]/30 border-t-[#E8C547]" />
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Loading Experience
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scroll Content */}
      <div ref={scrollContainerRef} className="relative z-10">
        {/* Initial spacer */}
        <div className="h-screen" />

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
                    {/* Accent line */}
                    <div
                      className="mb-8 h-px w-12 transition-all duration-700"
                      style={{
                        background: `linear-gradient(90deg, ${panel.accent}, transparent)`,
                        marginLeft: panel.position === "right" ? "auto" : "0",
                        marginRight: panel.position === "left" ? "auto" : "0",
                      }}
                    />

                    {/* Subtitle */}
                    <p
                      className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em]"
                      style={{ color: panel.accent, opacity: 0.7 }}
                    >
                      {panel.subtitle}
                    </p>

                    {/* Title */}
                    <h2 className="mb-6 text-4xl font-light leading-[1.1] tracking-tight text-[#FAF8F2] sm:text-5xl lg:text-6xl">
                      {panel.title}
                    </h2>

                    {/* Description */}
                    <p className="mb-8 text-base leading-[1.8] text-white/45">
                      {panel.description}
                    </p>

                    {/* Sub points */}
                    {panel.subPoints && panel.subPoints.length > 0 && (
                      <ul
                        className={`mb-10 space-y-3 ${
                          panel.position === "right" ? "ml-auto" : ""
                        }`}
                        style={{ maxWidth: "340px" }}
                      >
                        {panel.subPoints.map((point, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm leading-relaxed text-white/35"
                          >
                            <span
                              className="mt-2 h-px w-3 shrink-0"
                              style={{ backgroundColor: panel.accent, opacity: 0.5 }}
                            />
                            <span>{point}</span>
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
                    <div
                      className="panel-stat flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 backdrop-blur-md"
                    >
                      <span
                        className="stat-number text-3xl font-light tracking-tight sm:text-4xl"
                        style={{ color: panel.accent }}
                        data-prefix={prefix}
                        data-value={numericValue}
                        data-suffix={suffix}
                      >
                        {panel.stat}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                        {panel.statLabel}
                      </span>
                    </div>

                    {panel.secondaryStat && (
                      <div className="panel-stat flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] px-5 py-3.5 backdrop-blur-md">
                        <span
                          className="stat-number text-xl font-light sm:text-2xl"
                          style={{ color: panel.accent, opacity: 0.8 }}
                          data-prefix={secPrefix}
                          data-value={secNumericValue}
                          data-suffix={secSuffix}
                        >
                          {panel.secondaryStat}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.12em] text-white/25">
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
    </main>
  );
}