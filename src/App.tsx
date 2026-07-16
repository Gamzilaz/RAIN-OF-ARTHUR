import React, { useState, useEffect, useRef } from "react";
import {
  CloudRain,
  CloudLightning,
  CloudFog,
  Sun,
  Flame,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Sparkles,
  Github,
  Compass,
  Info,
  ArrowUp,
  ArrowDown,
  Upload
} from "lucide-react";

import Raindrops, { RaindropsOptions } from "./lib/raindrops";
import RainRenderer, { RainRendererOptions } from "./lib/rain-renderer";
import {
  generateDropAlpha,
  generateDropColor,
  generateDropShine
} from "./lib/texture-generator";
import WeatherAudioSynthesizer from "./lib/audio-synthesizer";
import { random } from "./lib/random";
import DEFAULT_BACKGROUND_IMAGE from "./assets/images/misty_rainy_forest_1781780284992.jpg";

// Immersive Preset Coordinates & Imagery (using premium copyright-free Unsplash bokeh & nature scenes)
interface WeatherPreset {
  id: string;
  label: string;
  description: string;
  imgUrl: string;
  themeColor: string; // Tailwind color class
  accentGlow: string; // CSS Box shadow glow style
  bgBrightness: number;
  audioWindLevel: number;
  audioRainLevel: number;
  flashChance: number;
  bgBlur?: number;
  raindrops: Partial<RaindropsOptions>;
  renderer: Partial<RainRendererOptions>;
}

const PRESETS: WeatherPreset[] = [
  {
    id: "rain",
    label: "Forest Monsoon",
    description: "Deep forest monsoon storm pouring over misty cedar pines",
    imgUrl: DEFAULT_BACKGROUND_IMAGE,
    themeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    accentGlow: "shadow-[0_0_20px_rgba(34,211,238,0.2)]",
    bgBrightness: 1.05,
    audioWindLevel: 0.15,
    audioRainLevel: 0.65,
    flashChance: 0.0,
    raindrops: {
      minR: 12,
      maxR: 44,
      rainChance: 0.35,
      rainLimit: 6,
      dropletsRate: 50,
      dropletsSize: [2, 4.5],
      trailRate: 1.2,
      trailScaleRange: [0.22, 0.38],
      collisionRadius: 0.55,
      collisionRadiusIncrease: 0.005,
    },
    renderer: {
      minRefraction: 256,
      maxRefraction: 512,
      brightness: 1.05,
      alphaMultiply: 15,
      alphaSubtract: 4,
      renderShadow: true,
      parallaxBg: 8,
      parallaxFg: 24,
    }
  },
  {
    id: "storm",
    label: "Thunder Rift",
    description: "Electric blue lighting lighting up the dark foggy woodlands",
    imgUrl: DEFAULT_BACKGROUND_IMAGE,
    themeColor: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    accentGlow: "shadow-[0_0_20px_rgba(139,92,246,0.2)]",
    bgBrightness: 0.75,
    audioWindLevel: 0.55,
    audioRainLevel: 0.85,
    flashChance: 0.08,
    raindrops: {
      minR: 18,
      maxR: 58,
      rainChance: 0.45,
      rainLimit: 10,
      dropletsRate: 90,
      dropletsSize: [2.5, 5.5],
      trailRate: 2.2,
      trailScaleRange: [0.25, 0.45],
      collisionRadius: 0.45,
      collisionRadiusIncrease: 0.015,
    },
    renderer: {
      minRefraction: 180,
      maxRefraction: 600,
      brightness: 0.85,
      alphaMultiply: 18,
      alphaSubtract: 5,
      renderShadow: true,
      parallaxBg: 12,
      parallaxFg: 30,
    }
  },
  {
    id: "drizzle",
    label: "Misty Emerald",
    description: "Gentle morning rain drifting through a quiet valley clearing",
    imgUrl: DEFAULT_BACKGROUND_IMAGE,
    themeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    accentGlow: "shadow-[0_0_20px_rgba(52,211,153,0.2)]",
    bgBrightness: 1.15,
    audioWindLevel: 0.1,
    audioRainLevel: 0.25,
    flashChance: 0.0,
    raindrops: {
      minR: 8,
      maxR: 24,
      rainChance: 0.12,
      rainLimit: 2,
      dropletsRate: 15,
      dropletsSize: [1.5, 3.2],
      trailRate: 0.6,
      trailScaleRange: [0.15, 0.3],
      collisionRadius: 0.7,
      collisionRadiusIncrease: 0.002,
    },
    renderer: {
      minRefraction: 200,
      maxRefraction: 380,
      brightness: 1.15,
      alphaMultiply: 10,
      alphaSubtract: 3,
      renderShadow: false,
      parallaxBg: 5,
      parallaxFg: 12,
    }
  },
  {
    id: "fallout",
    label: "Amber Haze",
    description: "Warm golden twilight mist settling over rainy mountain woods",
    imgUrl: DEFAULT_BACKGROUND_IMAGE,
    themeColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    accentGlow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    bgBrightness: 1.0,
    audioWindLevel: 0.45,
    audioRainLevel: 0.42,
    flashChance: 0.0,
    raindrops: {
      minR: 20,
      maxR: 52,
      rainChance: 0.28,
      rainLimit: 4,
      dropletsRate: 35,
      dropletsSize: [2.0, 5.0],
      trailRate: 3.0,
      trailScaleRange: [0.2, 0.42],
      collisionRadius: 0.5,
      collisionRadiusIncrease: 0.0,
    },
    renderer: {
      minRefraction: 300,
      maxRefraction: 620,
      brightness: 1.0,
      alphaMultiply: 12,
      alphaSubtract: 3,
      renderShadow: true,
      parallaxBg: 6,
      parallaxFg: 18,
    }
  },
  {
    id: "sunny",
    label: "After Shower",
    description: "Bright sunbeams warming up fresh rain drops in a valley meadow",
    imgUrl: DEFAULT_BACKGROUND_IMAGE,
    themeColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    accentGlow: "shadow-[0_0_20px_rgba(234,179,8,0.2)]",
    bgBrightness: 1.35,
    audioWindLevel: 0.05,
    audioRainLevel: 0.0,
    flashChance: 0.0,
    raindrops: {
      minR: 15,
      maxR: 45,
      rainChance: 0.0, // sun is clear of falling rain
      rainLimit: 0,
      dropletsRate: 0,
      trailRate: 0.0,
    },
    renderer: {
      minRefraction: 256,
      maxRefraction: 500,
      brightness: 1.35,
      alphaMultiply: 6,
      alphaSubtract: 2.2,
      renderShadow: true,
      parallaxBg: 4,
      parallaxFg: 16,
    }
  }
];

interface CyclePhase {
  id: string;
  presetId: string;
  nameRu: string;
  nameEn: string;
  durationMs: number;
  allowLightning?: boolean;
  rainChance: number;
  maxR: number;
  dropletsRate: number;
  dropFallMultiplier: number;
  trailRate: number;
  windVelocity: number;
  brightness: number;
  bgBlur: number;
  audioRainLevel: number;
  audioWindLevel: number;
  raining: boolean;
  evaporationRate?: number;
}

const CYCLE_PHASES: CyclePhase[] = [
  {
    id: "phase_day",
    presetId: "sunny",
    nameRu: "1. Сухо",
    nameEn: "1. Dry",
    durationMs: 15000,
    rainChance: 0.0,
    maxR: 20,
    dropletsRate: 0,
    dropFallMultiplier: 1.0,
    trailRate: 0.0,
    windVelocity: 0.0,
    brightness: 1.30,
    bgBlur: 0,
    audioRainLevel: 0.0,
    audioWindLevel: 0.05,
    raining: false,
    evaporationRate: 3.0
  },
  {
    id: "phase_overcast",
    presetId: "storm",
    nameRu: "2. Сгущающиеся тучи",
    nameEn: "2. Clouds Gathering",
    durationMs: 15000,
    rainChance: 0.02,
    maxR: 14,
    dropletsRate: 3,
    dropFallMultiplier: 0.35,
    trailRate: 0.0,
    windVelocity: 0.1,
    brightness: 0.85,
    bgBlur: 0,
    audioRainLevel: 0.05,
    audioWindLevel: 0.25,
    raining: true,
    evaporationRate: 0.5
  },
  {
    id: "phase_active_rain",
    presetId: "rain",
    nameRu: "3. Активный дождь",
    nameEn: "3. Active Rain",
    durationMs: 18000,
    rainChance: 0.14,
    maxR: 20,
    dropletsRate: 45,
    dropFallMultiplier: 0.85,
    trailRate: 0.05,
    windVelocity: 0.05,
    brightness: 0.78,
    bgBlur: 0,
    audioRainLevel: 0.45,
    audioWindLevel: 0.2,
    raining: true,
    evaporationRate: 0.0
  },
  {
    id: "phase_thunderstorm",
    presetId: "storm",
    nameRu: "4. Гроза с молниями",
    nameEn: "4. Thunderstorm",
    durationMs: 22000,
    allowLightning: true,
    rainChance: 0.52,
    maxR: 56,
    dropletsRate: 95,
    dropFallMultiplier: 1.8,
    trailRate: 3.0,
    windVelocity: 0.35,
    brightness: 0.58,
    bgBlur: 0,
    audioRainLevel: 0.90,
    audioWindLevel: 0.65,
    raining: true,
    evaporationRate: 0.0
  },
  {
    id: "phase_after_thunderstorm",
    presetId: "drizzle",
    nameRu: "5. После грозы",
    nameEn: "5. After Thunderstorm",
    durationMs: 16000,
    rainChance: 0.0,
    maxR: 28,
    dropletsRate: 0,
    dropFallMultiplier: 0.5,
    trailRate: 0.2,
    windVelocity: 0.05,
    brightness: 1.05,
    bgBlur: 0,
    audioRainLevel: 0.1,
    audioWindLevel: 0.1,
    raining: true,
    evaporationRate: 3.0
  },
  {
    id: "phase_evening",
    presetId: "sunny",
    nameRu: "6. Высыхание",
    nameEn: "6. Drying Glass",
    durationMs: 16000,
    rainChance: 0.0,
    maxR: 28,
    dropletsRate: 0,
    dropFallMultiplier: 0.3,
    trailRate: 0.0,
    windVelocity: 0.02,
    brightness: 0.65,
    bgBlur: 0,
    audioRainLevel: 0.0,
    audioWindLevel: 0.06,
    raining: false,
    evaporationRate: 10.0
  }
];

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

interface LightningBolt {
  mainPath: string;
  branches: string[];
  strikeX: number;
}

function generateLightning(width: number, height: number, strikeX: number): LightningBolt {
  const startX = strikeX * width;
  const segments = 35 + Math.floor(Math.random() * 10);
  const startY = -150; // Start comfortably above the screen
  const endY = height + 150; // End comfortably below the screen
  const stepY = (endY - startY) / segments;
  
  let currentX = startX;
  let currentY = startY;
  let mainPath = `M ${startX} ${startY}`;

  for (let i = 1; i <= segments; i++) {
    const nextY = currentY + stepY;
    // Extremely narrow vertical jagging (staying as a powerful vertical column, no wide horizontal drifts)
    const driftStrength = width * 0.0075;
    const nextX = currentX + (Math.random() - 0.5) * driftStrength;
    
    mainPath += ` L ${nextX} ${nextY}`;
    currentX = nextX;
    currentY = nextY;
  }

  // Pure single-strike vertical beam with zero external horizontal branches
  return { mainPath, branches: [], strikeX };
}

export default function App() {
  // Theme & Preset State
  const [activePreset, setActivePreset] = useState<WeatherPreset>(PRESETS[4]); // Start with SUNNY per request (сначала сухое стекло)
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>("");

  // Dynamic Weather Automation Loop
  const [isCycleActive, setIsCycleActive] = useState<boolean>(true);
  const [cycleSpeed, setCycleSpeed] = useState<number>(1.0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [phases, setPhases] = useState<CyclePhase[]>(() => {
    try {
      const saved = localStorage.getItem("weather_cycle_v4");
      if (saved) {
        const parsed = JSON.parse(saved) as CyclePhase[];
        return parsed.map(stored => {
          const original = CYCLE_PHASES.find(cp => cp.id === stored.id);
          return original ? { 
            ...stored, 
            nameRu: original.nameRu, 
            nameEn: original.nameEn,
          } : stored;
        });
      }
    } catch (_) {}
    return CYCLE_PHASES;
  });
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("weather_cycle_v4");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[0]) return parsed[0].durationMs;
      }
    } catch (_) {}
    return CYCLE_PHASES[0].durationMs;
  });
  const [editingPhaseId, setEditingPhaseId] = useState<string>("phase_day");
  const [currentBgUrl, setCurrentBgUrl] = useState<string>(DEFAULT_BACKGROUND_IMAGE);

  // Control Slider States (mapped dynamically)
  const [rainChance, setRainChance] = useState<number>(0.35);
  const [minR, setMinR] = useState<number>(12);
  const [maxR, setMaxR] = useState<number>(44);
  const [rainLimit, setRainLimit] = useState<number>(6);
  const [globalTimeScale, setGlobalTimeScale] = useState<number>(1.0);
  const [refractionStrength, setRefractionStrength] = useState<number>(380); // mid refraction
  const [brightnessVal, setBrightnessVal] = useState<number>(1.05);
  const brightnessValRef = useRef<number>(brightnessVal);
  useEffect(() => {
    brightnessValRef.current = brightnessVal;
  }, [brightnessVal]);
  const [renderShadow, setRenderShadow] = useState<boolean>(true);
  const [bgBlur, setBgBlur] = useState<number>(0);
  const bgBlurRef = useRef<number>(0);
  const [windVelocityState, setWindVelocityState] = useState<number>(0);
  const setWindVelocity = (val: number | ((prev: number) => number)) => {
    setWindVelocityState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      return Math.max(-0.4, Math.min(0.4, next));
    });
  };
  const windVelocity = windVelocityState;

  // Advanced physical parameters state tracking
  const [dropletsRate, setDropletsRate] = useState<number>(50);
  const [dropFallMultiplier, setDropFallMultiplier] = useState<number>(1.0);
  const [trailRate, setTrailRate] = useState<number>(1.0);
  const [evaporationRate, setEvaporationRate] = useState<number>(0.0);
  const [audioRainLevel, setAudioRainLevel] = useState<number>(0.3);
  const [audioWindLevel, setAudioWindLevel] = useState<number>(0.1);

  // Audio & Immersive Toggles
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.3);
  const [thunderVolume, setThunderVolume] = useState<number>(0.8);

  const grozaExtensionsRef = useRef<{ groza1: string; groza2: string }>({
    groza1: 'mp3',
    groza2: 'mp3'
  });

  const playThunderSound = (type: 'groza1' | 'groza2', volume: number) => {
    const ext = grozaExtensionsRef.current[type];
    const filePath = `/audio/${type}.${ext}`;
    if (synthRef.current) {
      // The Web Audio API synthesizer's thunderGain already scales by thunderVolume.
      // Therefore, the gain node for this file should only apply the intrinsic/relative volume of the file itself (0.675 or 1.0),
      // otherwise it would be scaled by thunderVolume twice (producing a quiet, quadratic volume curve).
      const relativeVolume = type === 'groza1' ? 0.675 : 1.0;
      synthRef.current.playFile(filePath, relativeVolume).catch((err) => {
        console.warn(`Web Audio API playFile failed for ${type}:`, err);
      });
    } else {
      try {
        const a = new Audio(filePath);
        a.volume = type === 'groza1' ? volume * 0.675 : volume;
        a.play().catch((err) => {
          console.warn(`Audio play failed for ${type}:`, err);
        });
      } catch (err) {
        console.error(`Error playing sound ${type}:`, err);
      }
    }
  };
  const [lightningActive, setLightningActive] = useState<boolean>(false);
  const [lightningData, setLightningData] = useState<{
    mainPath: string;
    branches: string[];
    strikeX: number;
    strikeY: number;
    intensity: number;
    opacity: number;
    visible: boolean;
  } | null>(null);
  const [isControllerCollapsed, setIsControllerCollapsed] = useState<boolean>(false);
  const [autoGlide, setAutoGlide] = useState<boolean>(true);
  const [pointerMode, setPointerMode] = useState<"draw" | "drag">("draw");

  // Telemetry metric states (pure styling to satisfy literal dashboard data request)
  const [activeRaindropsCount, setActiveRaindropsCount] = useState<number>(0);
  const [calculatedFps, setCalculatedFps] = useState<number>(60);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation Library Handles
  const raindropsRef = useRef<Raindrops | null>(null);
  const rendererRef = useRef<RainRenderer | null>(null);
  const synthRef = useRef<WeatherAudioSynthesizer | null>(null);

  // Double buffer canvases for sharp (foreground) and blurred (background) textures
  const canvasSharpRef = useRef<HTMLCanvasElement | null>(null);
  const canvasBlurRef = useRef<HTMLCanvasElement | null>(null);

  // Procedural assets generated on load
  const dropAlphaRef = useRef<HTMLCanvasElement | null>(null);
  const dropColorRef = useRef<HTMLCanvasElement | null>(null);
  const dropShineRef = useRef<HTMLCanvasElement | null>(null);

  // Parallax Target values
  const targetParallax = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGyroEnabled, setIsGyroEnabled] = useState<boolean>(false);
  const [showGyroPrompt, setShowGyroPrompt] = useState<boolean>(false);

  // FPS calculations
  const lastFpsTime = useRef<number>(Date.now());
  const frameCounter = useRef<number>(0);

  const [customPreset, setCustomPreset] = useState<WeatherPreset | null>(null);

  // References for crossfading
  const prevImgRef = useRef<HTMLImageElement | null>(null);
  const transitionAnimRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeDpi, setActiveDpi] = useState<number>(window.devicePixelRatio || 1);

  // 1. Setup Procedural Assets & Initial Load on Mount
  useEffect(() => {
    dropAlphaRef.current = generateDropAlpha();
    dropColorRef.current = generateDropColor();
    dropShineRef.current = generateDropShine();

    // Lazy initialization of Audio Synth
    synthRef.current = new WeatherAudioSynthesizer();

    // Trigger initial WebGL simulation boot
    initializeSimulation(PRESETS[4]);

    return () => {
      if (raindropsRef.current) raindropsRef.current.destroy();
      if (rendererRef.current) rendererRef.current.destroy();
      if (synthRef.current) synthRef.current.destroy();
      if (transitionAnimRef.current) cancelAnimationFrame(transitionAnimRef.current);
    };
  }, []);

  // 2. Setup Mousemove parallax listener
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      targetParallax.current = {
        x: (event.clientX / w) * 2 - 1,
        y: (event.clientY / h) * 2 - 1
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Initial check for gyroscope availability
    if (window.DeviceOrientationEvent) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setShowGyroPrompt(true);
      } else {
        setIsGyroEnabled(true);
      }
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // 3. Robust gyroscope parallax listener for mobile
  useEffect(() => {
    if (!isGyroEnabled) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // beta: -180 to 180 (front/back tilt)
      // gamma: -90 to 90 (left/right tilt)
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;

      // Sensitivity factor
      const sensitivity = 0.15;
      
      // Calculate raw offsets
      // Centering beta around 50 degrees for natural holding posture
      let rawX = gamma * sensitivity;
      let rawY = (beta - 50) * sensitivity;

      // FIX FOR VERTICAL JITTER: 
      // When beta is near 90 (vertical) or -90, the gamma value (roll) 
      // often flips or jitters wildly. We dampen the horizontal shift 
      // as the device approaches vertical orientation.
      const verticalDampen = Math.max(0, 1.0 - Math.abs(Math.sin(beta * Math.PI / 180.0)) * 0.5);
      rawX *= verticalDampen;

      targetParallax.current = {
        x: Math.max(-6.0, Math.min(6.0, rawX)),
        y: Math.max(-6.0, Math.min(6.0, rawY))
      };
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [isGyroEnabled]);

  const requestGyroPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setIsGyroEnabled(true);
          setShowGyroPrompt(false);
        }
      } catch (error) {
        console.error("Gyroscope permission denied", error);
      }
    }
  };

  // 2.5. Automatic Weather Looping Engine
  useEffect(() => {
    if (!isCycleActive) return;

    const interval = setInterval(() => {
      setPhaseTimeLeft((prev) => {
        // Progress countdown based on speed factor
        const nextTime = prev - 100 * cycleSpeed;
        if (nextTime <= 0) {
          const nextIndex = (currentPhaseIndex + 1) % phases.length;
          setCurrentPhaseIndex(nextIndex);
          return phases[nextIndex]?.durationMs || 15000;
        }
        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isCycleActive, cycleSpeed, phases, currentPhaseIndex]);

  // 2.6. Continuous mid-point to mid-point smooth interpolation engine
  useEffect(() => {
    if (!isCycleActive) return;

    const currentPhase = phases[currentPhaseIndex];
    if (!currentPhase) return;

    const prevIndex = (currentPhaseIndex - 1 + phases.length) % phases.length;
    const prevPhase = phases[prevIndex];

    const nextIndex = (currentPhaseIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];

    const Dc = currentPhase.durationMs;
    const Ec = Dc - phaseTimeLeft; // elapsed time in current phase

    let targetPhaseRef: CyclePhase;
    let nextPhaseRef: CyclePhase;
    let k = 0; // interpolation progress [0, 1]
    let targetPhaseIdx = 0;
    let nextPhaseIdx = 0;

    if (Ec < Dc / 2) {
      // First half of current phase: transitioning from mid of prevPhase to mid of currentPhase
      targetPhaseRef = prevPhase;
      nextPhaseRef = currentPhase;
      targetPhaseIdx = prevIndex;
      nextPhaseIdx = currentPhaseIndex;
      const Ttrans = (prevPhase.durationMs / 2) + (Dc / 2);
      const Telapsed = (prevPhase.durationMs / 2) + Ec;
      k = Ttrans > 0 ? Math.min(1, Math.max(0, Telapsed / Ttrans)) : 1.0;
    } else {
      // Second half of current phase: transitioning from mid of currentPhase to mid of nextPhase
      targetPhaseRef = currentPhase;
      nextPhaseRef = nextPhase;
      targetPhaseIdx = currentPhaseIndex;
      nextPhaseIdx = nextIndex;
      const Ttrans = (Dc / 2) + (nextPhase.durationMs / 2);
      const Telapsed = Ec - (Dc / 2);
      k = Ttrans > 0 ? Math.min(1, Math.max(0, Telapsed / Ttrans)) : 0.0;
    }

    // Cosine ease-in-out interpolation for natural flow
    const ease = (1 - Math.cos(k * Math.PI)) / 2;

    const lerpValue = (start: number | undefined, end: number | undefined, defaultValue: number) => {
      const s = start ?? defaultValue;
      const e = end ?? defaultValue;
      return s + (e - s) * ease;
    };

    // Calculate interpolated values for all dynamic states
    const currentRainChance = lerpValue(targetPhaseRef.rainChance, nextPhaseRef.rainChance, 0.3);
    const currentMaxR = lerpValue(targetPhaseRef.maxR, nextPhaseRef.maxR, 40);
    
    // Helper to calculate minR for a given phase
    const getPhaseMinR = (phase: CyclePhase) => {
      const targetPreset = PRESETS.find(p => p.id === phase.presetId) || PRESETS[4];
      return phase.maxR < 22 ? 6 : (targetPreset.raindrops.minR ?? 10);
    };

    const startMinRVal = getPhaseMinR(targetPhaseRef);
    const endMinRVal = getPhaseMinR(nextPhaseRef);
    const currentMinR = lerpValue(startMinRVal, endMinRVal, 10);

    // Helper to calculate rainLimit for a given phase
    const getPhaseRainLimit = (phase: CyclePhase) => {
      const targetPreset = PRESETS.find(p => p.id === phase.presetId) || PRESETS[4];
      return phase.id === "phase_day" || phase.id === "phase_morning" || phase.id === "phase_evening"
        ? 0
        : (targetPreset.raindrops.rainLimit ?? 3);
    };

    const startRainLimitVal = getPhaseRainLimit(targetPhaseRef);
    const endRainLimitVal = getPhaseRainLimit(nextPhaseRef);
    const currentRainLimit = lerpValue(startRainLimitVal, endRainLimitVal, 3);

    const currentDropletsRate = lerpValue(targetPhaseRef.dropletsRate, nextPhaseRef.dropletsRate, 50);
    const currentDropFallMultiplier = lerpValue(targetPhaseRef.dropFallMultiplier, nextPhaseRef.dropFallMultiplier, 1.0);
    const currentTrailRate = lerpValue(targetPhaseRef.trailRate, nextPhaseRef.trailRate, 1.0);
    
    // --- STABLE AND COHESIVE CYCLIC WIND ENGINE ---
    let startWind = targetPhaseRef.windVelocity;
    let endWind = nextPhaseRef.windVelocity;

    if (isCycleActive) {
      if (!cycleWindValuesRef.current || cycleWindValuesRef.current.length !== phases.length) {
        const values: number[] = [];
        // Roll a single random sign for the entire weather cycle loop so it only builds up in one direction!
        const cycleSign = Math.random() < 0.5 ? -1 : 1;

        for (let i = 0; i < phases.length; i++) {
          const p = phases[i];
          
          if (p.id === "phase_day") {
            values.push(cycleSign * 0.01); // 0.1 UI (practically calm)
          } else if (p.id === "phase_overcast") {
            values.push(cycleSign * 0.10); // 1.0 UI (mild wind)
          } else if (p.id === "phase_active_rain") {
            values.push(cycleSign * 0.20); // 2.0 UI (moderate wind)
          } else if (p.id === "phase_thunderstorm") {
            // Peak storm: wind reaches the cinematic limit of 3 (UI 3.0)
            values.push(cycleSign * 0.30); // 3.0 UI
          } else if (p.id === "phase_after_thunderstorm") {
            values.push(cycleSign * 0.15); // 1.5 UI (calming breeze)
          } else if (p.id === "phase_evening") {
            values.push(cycleSign * 0.05); // 0.5 UI (gentle evening wind)
          } else {
            // Fallback for custom stages: map to rainChance but keep it strictly capped at 0.30
            const rainChance = p.rainChance ?? 0;
            const stormFactor = Math.min(1.0, rainChance / 0.52);
            values.push(cycleSign * (0.01 + 0.29 * stormFactor));
          }
        }
        cycleWindValuesRef.current = values;
      }
      startWind = cycleWindValuesRef.current[targetPhaseIdx] ?? 0;
      endWind = cycleWindValuesRef.current[nextPhaseIdx] ?? 0;
    }

    const currentWindVelocity = lerpValue(startWind, endWind, 0.0);
    const currentBrightness = lerpValue(targetPhaseRef.brightness, nextPhaseRef.brightness, 1.0);
    const currentBgBlur = lerpValue(targetPhaseRef.bgBlur, nextPhaseRef.bgBlur, 5);
    const currentEvaporationRate = lerpValue(targetPhaseRef.evaporationRate, nextPhaseRef.evaporationRate, 0.0);
    const currentRainVol = lerpValue(targetPhaseRef.audioRainLevel, nextPhaseRef.audioRainLevel, 0.3);
    const currentWindVol = lerpValue(targetPhaseRef.audioWindLevel, nextPhaseRef.audioWindLevel, 0.1);

    // Apply values to React State
    setRainChance(currentRainChance);
    setMinR(Math.round(currentMinR));
    setMaxR(Math.round(currentMaxR));
    setRainLimit(Math.round(currentRainLimit));
    setDropletsRate(Math.round(currentDropletsRate));
    setDropFallMultiplier(currentDropFallMultiplier);
    setTrailRate(currentTrailRate);
    setWindVelocity(currentWindVelocity);
    setBrightnessVal(currentBrightness);
    setBgBlur(Math.round(currentBgBlur));
    setEvaporationRate(currentEvaporationRate);
    setAudioRainLevel(currentRainVol);
    setAudioWindLevel(currentWindVol);

    // Dynamic refraction strength
    const startMaxRef = targetPhaseRef.id === "phase_thunderstorm" ? 600 : 450;
    const endMaxRef = nextPhaseRef.id === "phase_thunderstorm" ? 600 : 450;
    const currentRefraction = lerpValue(startMaxRef, endMaxRef, 450);
    setRefractionStrength(Math.round(currentRefraction) - 100);

    // Update active synthesizer volumes in real-time
    if (synthRef.current && isAudioEnabled) {
      synthRef.current.setRainIntensity(currentRainVol);
      synthRef.current.setWindIntensity(currentWindVol);
    }

    if (raindropsRef.current) {
      // Keep raining option enabled if current phase or next phase allows it
      raindropsRef.current.options.raining = targetPhaseRef.raining || nextPhaseRef.raining;
    }

  }, [isCycleActive, currentPhaseIndex, phaseTimeLeft, phases, isAudioEnabled]);

  // 3. Robust simulation engine initialization
  const initializeSimulation = (preset: WeatherPreset) => {
    setLoading(true);
    setErrorText("");

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = DEFAULT_BACKGROUND_IMAGE;

    const handleLoad = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let dpi = window.devicePixelRatio || 1;
      
      // Performance Cap for high-res mobile devices (DPI 3x is overkill for GPU shaders)
      if (isMobile && dpi > 2.0) {
        dpi = 1.5; // Cap at 1.5 - 2.0 for significantly better FPS
      }
      setActiveDpi(dpi);
      
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);

      // Ensure canvas element dimensions match viewport
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      canvasEl.width = w * dpi;
      canvasEl.height = h * dpi;
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;

      // Prepare Double Buffer Canvases
      const sharpCanvas = canvasSharpRef.current || document.createElement("canvas");
      sharpCanvas.width = 384;
      sharpCanvas.height = 256;
      const sharpCtx = sharpCanvas.getContext("2d")!;
      sharpCtx.clearRect(0, 0, 384, 256);
      sharpCtx.filter = "none";
      sharpCtx.drawImage(baseImg, 0, 0, 384, 256);
      canvasSharpRef.current = sharpCanvas;

      const blurCanvas = canvasBlurRef.current || document.createElement("canvas");
      blurCanvas.width = 384;
      blurCanvas.height = 256;
      const blurCtx = blurCanvas.getContext("2d")!;
      blurCtx.clearRect(0, 0, 384, 256);
      blurCtx.filter = `blur(${bgBlurRef.current}px)`; // creates realistic out-of-focus background
      blurCtx.drawImage(baseImg, -10, -10, 404, 276);
      canvasBlurRef.current = blurCanvas;

      prevImgRef.current = baseImg;

      // Clean up previous simulation cycles
      if (raindropsRef.current) {
        raindropsRef.current.destroy();
      }
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }

      // Initialize sound system sliders matching loaded preset
      setRainChance(preset.raindrops.rainChance ?? 0.3);
      setMinR(preset.raindrops.minR ?? 10);
      setMaxR(preset.raindrops.maxR ?? 40);
      setRainLimit(preset.raindrops.rainLimit ?? 6);
      setBrightnessVal(preset.renderer.brightness ?? 1.0);
      setRefractionStrength((preset.renderer.maxRefraction ?? 512) - 100);
      setDropletsRate(preset.raindrops.dropletsRate ?? 50);
      setDropFallMultiplier(preset.raindrops.dropFallMultiplier ?? 1.0);
      setTrailRate(preset.raindrops.trailRate ?? 1.0);
      setEvaporationRate(preset.raindrops.evaporationRate ?? 0.0);

      try {
        // Spin Raindrops physics loop
        raindropsRef.current = new Raindrops(
          canvasEl.width,
          canvasEl.height,
          dpi,
          dropAlphaRef.current!,
          dropColorRef.current!,
          {
            ...preset.raindrops,
            rainChance: preset.raindrops.rainChance ?? 0.3,
            maxR: preset.raindrops.maxR ?? 40,
            globalTimeScale: globalTimeScale,
            autoShrink: !autoGlide
          }
        );

        // Fill initial starting drops (e.g., 45 drops immediately scattered)
        if (preset.id !== "sunny") {
          for (let i = 0; i < 45; i++) {
            raindropsRef.current.addDrop(
              raindropsRef.current.createDrop({
                x: random(canvasEl.width / dpi),
                y: random(canvasEl.height / dpi),
                r: random(10, preset.raindrops.maxR ?? 40)
              })
            );
          }
        }

        // Spin WebGL rain-renderer loop
        rendererRef.current = new RainRenderer(
          canvasEl,
          raindropsRef.current.canvas,
          canvasSharpRef.current,
          canvasBlurRef.current,
          dropShineRef.current,
          {
            ...preset.renderer,
            brightness: preset.renderer.brightness ?? 1.0,
            renderShadow: renderShadow,
            minRefraction: 10,
            maxRefraction: refractionStrength,
            parallaxFg: 0,
            parallaxBg: 15,
          }
        );

        // Hook up smooth parallax updating inside the RAF render ticker
        const originalDraw = rendererRef.current.draw.bind(rendererRef.current);
        rendererRef.current.draw = function () {
          if (rendererRef.current) {
            rendererRef.current.parallaxX += (targetParallax.current.x - rendererRef.current.parallaxX) * 0.4;
            rendererRef.current.parallaxY += (targetParallax.current.y - rendererRef.current.parallaxY) * 0.4;

            // Track active raindrops telemetry count for visual dashboard
            if (raindropsRef.current) {
              setActiveRaindropsCount(raindropsRef.current.drops.length);
            }

            // Calculate FPS metrics
            frameCounter.current += 1;
            const now = Date.now();
            if (now - lastFpsTime.current >= 1000) {
              setCalculatedFps(Math.round((frameCounter.current * 1000) / (now - lastFpsTime.current)));
              frameCounter.current = 0;
              lastFpsTime.current = now;
            }
          }
          originalDraw();
        };

        // Propagate dynamic sound values
        if (synthRef.current && isAudioEnabled) {
          synthRef.current.setRainIntensity(preset.audioRainLevel);
          synthRef.current.setWindIntensity(preset.audioWindLevel);
        }

        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setErrorText("Shader setup failed: Compile or linking error detected in GPU context.");
        setLoading(false);
      }
    };

    const handleError = () => {
      setErrorText("Error downloading context wallpaper. Asset URL failed.");
      setLoading(false);
    };

    baseImg.addEventListener("load", handleLoad);
    baseImg.addEventListener("error", handleError);
  };

  // 4. Smooth Transition engine between weather presets (lerp values and draw crossfaded backgrounds)
  const transitionToPreset = async (target: WeatherPreset, keepCurrentBg: boolean = false, forceBgUrl?: string) => {
    try {
      const startRainChance = rainChance;
      const startMinR = minR;
      const startMaxR = maxR;
      const startRainLimit = rainLimit;
      const startRefraction = refractionStrength;
      const startBrightness = brightnessVal;
      const startBgBlur = bgBlurRef.current;

      const previous = activePreset;
      const startWind = previous.audioWindLevel;
      const startRain = previous.audioRainLevel;

      // Calculate a randomized minor wind velocity offset for this specific weather simulation block
      const windOffset = (target.raindrops.rainChance ?? 0) > 0 ? (Math.random() - 0.5) * 0.12 : 0;

      // Cancel any ongoing transitions to avoid animation clashing
      if (transitionAnimRef.current) {
        cancelAnimationFrame(transitionAnimRef.current);
      }

      // Preload target background image in memory to ensure fluid transitions
      let nextImg: HTMLImageElement;
      const bgToLoad = forceBgUrl || ((target.id === "custom" && target.imgUrl) ? target.imgUrl : (currentBgUrl || DEFAULT_BACKGROUND_IMAGE));
      const isSameBg = prevImgRef.current && (bgToLoad === prevImgRef.current.src || bgToLoad === prevImgRef.current.getAttribute('src'));
      if ((keepCurrentBg || isSameBg) && prevImgRef.current) {
        nextImg = prevImgRef.current;
      } else {
        nextImg = await loadImage(bgToLoad);
      }
      const prevImg = prevImgRef.current;

      // Keep rain rendering active unless it's a fully dry, clear day/morning phase
      const isDryTarget = target.id === "phase_day" || target.id === "phase_morning" || target.id === "sunny_dry" || (target.id === "sunny" && !isCycleActive);
      if (isDryTarget) {
        if (raindropsRef.current) {
          raindropsRef.current.options.raining = false;
        }
      } else {
        if (raindropsRef.current) {
          raindropsRef.current.options.raining = (target.raindrops.rainChance ?? 0) > 0 || (target.raindrops.raining ?? true);
        }
      }

      setActivePreset(target);

      const duration = 1500; // 1.5 seconds smooth cinematic transition
      const startTime = performance.now();

      const animateTransition = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Cubic Ease-In-Out
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const targetBgBlur = 0;
        const currentBgBlur = 0;

        // Perform elegant pixel crossfade onto sharp foreground canvas
        const sharpCanvas = canvasSharpRef.current;
        const blurCanvas = canvasBlurRef.current;
        if (sharpCanvas && blurCanvas) {
          const sharpCtx = sharpCanvas.getContext("2d")!;
          const blurCtx = blurCanvas.getContext("2d")!;

          // Sharp render
          sharpCtx.clearRect(0, 0, 384, 256);
          if (prevImg && ease < 1.0) {
            sharpCtx.globalAlpha = 1.0 - ease;
            sharpCtx.drawImage(prevImg, 0, 0, 384, 256);
          }
          sharpCtx.globalAlpha = ease;
          sharpCtx.drawImage(nextImg, 0, 0, 384, 256);

          // Blurry render with realistic depth blur filter
          blurCtx.clearRect(0, 0, 384, 256);
          blurCtx.filter = `blur(${currentBgBlur}px)`;
          if (prevImg && ease < 1.0) {
            blurCtx.globalAlpha = 1.0 - ease;
            blurCtx.drawImage(prevImg, -10, -10, 404, 276);
          }
          blurCtx.globalAlpha = ease;
          blurCtx.drawImage(nextImg, -10, -10, 404, 276);

          // Restore normal composite states
          sharpCtx.globalAlpha = 1.0;
          blurCtx.globalAlpha = 1.0;
        }

        // Inform WebGL renderer to upload modified backbuffer canvas textures
        if (rendererRef.current) {
          rendererRef.current.updateTextures();
        }

        // Interpolate slider states and uniforms smoothly
        const targetRainChance = target.raindrops.rainChance ?? 0.3;
        const targetMinR = target.raindrops.minR ?? 10;
        const targetMaxR = target.raindrops.maxR ?? 40;
        const targetRainLimit = target.raindrops.rainLimit ?? 6;
        const targetRefraction = (target.renderer.maxRefraction ?? 512) - 100;
        const targetBrightness = target.renderer.brightness ?? 1.0;

        const currentRainChance = lerp(startRainChance, targetRainChance, ease);
        const currentMinR = lerp(startMinR, targetMinR, ease);
        const currentMaxR = lerp(startMaxR, targetMaxR, ease);
        const currentRainLimit = lerp(startRainLimit, targetRainLimit, ease);
        const currentRefraction = lerp(startRefraction, targetRefraction, ease);
        const currentBrightness = lerp(startBrightness, targetBrightness, ease);

        setRainChance(currentRainChance);
        setMinR(Math.round(currentMinR));
        setMaxR(Math.round(currentMaxR));
        setRainLimit(Math.round(currentRainLimit));
        setRefractionStrength(Math.round(currentRefraction));
        setBrightnessVal(currentBrightness);
        setBgBlur(0);

        // Update active properties on current simulation frame
        if (raindropsRef.current) {
          raindropsRef.current.options.rainChance = currentRainChance;
          raindropsRef.current.options.minR = currentMinR;
          raindropsRef.current.options.maxR = currentMaxR;
          raindropsRef.current.options.rainLimit = currentRainLimit;

          // Interpolate other custom raindrop parameters!
          const startDropFall = previous.raindrops.dropFallMultiplier ?? 1.0;
          const targetDropFall = target.raindrops.dropFallMultiplier ?? 1.0;
          const currentDropFall = lerp(startDropFall, targetDropFall, ease);
          raindropsRef.current.options.dropFallMultiplier = currentDropFall;
          setDropFallMultiplier(currentDropFall);

          const startTrailRate = previous.raindrops.trailRate ?? 1.0;
          const targetTrailRate = target.raindrops.trailRate ?? 1.0;
          const currentTrailRate = lerp(startTrailRate, targetTrailRate, ease);
          raindropsRef.current.options.trailRate = currentTrailRate;
          setTrailRate(currentTrailRate);

          const startDropletsRate = previous.raindrops.dropletsRate ?? 50;
          const targetDropletsRate = target.raindrops.dropletsRate ?? 50;
          const currentDropletsRate = lerp(startDropletsRate, targetDropletsRate, ease);
          raindropsRef.current.options.dropletsRate = currentDropletsRate;
          setDropletsRate(currentDropletsRate);

          const startEvap = previous.raindrops.evaporationRate ?? 0.0;
          const targetEvap = target.raindrops.evaporationRate ?? 0.0;
          const currentEvap = lerp(startEvap, targetEvap, ease);
          raindropsRef.current.options.evaporationRate = currentEvap;
          setEvaporationRate(currentEvap);

          const startWindVelocity = previous.raindrops.windVelocity ?? 0.0;
          const targetWindVelocity = (target.raindrops.windVelocity ?? 0.0) + windOffset;
          const currentWindVelocity = lerp(startWindVelocity, targetWindVelocity, ease);
          setWindVelocity(currentWindVelocity);
          raindropsRef.current.options.windVelocity = currentWindVelocity;
        }

        if (rendererRef.current) {
          rendererRef.current.options.renderShadow = target.renderer.renderShadow ?? true;
          rendererRef.current.updateOptions({
            brightness: currentBrightness,
            minRefraction: 10,
            maxRefraction: currentRefraction,
            renderShadow: target.renderer.renderShadow ?? true
          });
        }

        // Smooth audio synthesizer interpolation
        if (synthRef.current && isAudioEnabled) {
          const currentRainVol = lerp(startRain, target.audioRainLevel, ease);
          const currentWindVol = lerp(startWind, target.audioWindLevel, ease);
          synthRef.current.setRainIntensity(currentRainVol);
          synthRef.current.setWindIntensity(currentWindVol);
        }

        if (progress < 1) {
          transitionAnimRef.current = requestAnimationFrame(animateTransition);
        } else {
          transitionAnimRef.current = null;
          prevImgRef.current = nextImg;
          if (raindropsRef.current) {
            Object.assign(raindropsRef.current.options, target.raindrops);
            if (target.raindrops.raining === undefined) {
              raindropsRef.current.options.raining = (target.raindrops.rainChance ?? 0) > 0;
            }
          }
        }
      };

      transitionAnimRef.current = requestAnimationFrame(animateTransition);
    } catch (err) {
      console.error("Transition failed: ", err);
    }
  };

  // 5. File image upload change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be uploaded again if needed
    event.target.value = '';

    const url = URL.createObjectURL(file);
    const custom: WeatherPreset = {
      id: "custom",
      label: "Custom",
      description: "Atmosphere backdropped with your uploaded custom image file",
      imgUrl: url,
      themeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      accentGlow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
      bgBrightness: 1.0,
      audioWindLevel: 0.25,
      audioRainLevel: 0.45,
      flashChance: 0.0,
      raindrops: {
        minR: 12,
        maxR: 44,
        rainChance: 0.3,
        rainLimit: 6,
        dropletsRate: 40,
        dropletsSize: [2, 4.5],
        trailRate: 1.2,
        trailScaleRange: [0.22, 0.38],
        collisionRadius: 0.55,
        collisionRadiusIncrease: 0.005,
      },
      renderer: {
        minRefraction: 256,
        maxRefraction: 512,
        brightness: 1.0,
        alphaMultiply: 15,
        alphaSubtract: 4,
        renderShadow: true,
        parallaxBg: 8,
        parallaxFg: 24,
      }
    };
    setCustomPreset(custom);
    setCurrentBgUrl(url);
    transitionToPreset(custom);
  };

  // 4. Update dynamic variables on already running instances
  useEffect(() => {
    if (raindropsRef.current) {
      raindropsRef.current.options.rainChance = rainChance;
      raindropsRef.current.options.minR = minR;
      raindropsRef.current.options.maxR = maxR;
      raindropsRef.current.options.rainLimit = rainLimit;
      raindropsRef.current.options.globalTimeScale = globalTimeScale;
      raindropsRef.current.options.autoShrink = !autoGlide;
      raindropsRef.current.options.windVelocity = windVelocity;
      raindropsRef.current.options.dropletsRate = dropletsRate;
      raindropsRef.current.options.dropFallMultiplier = dropFallMultiplier;
      raindropsRef.current.options.trailRate = trailRate;
      raindropsRef.current.options.evaporationRate = evaporationRate;
      raindropsRef.current.options.raining = rainChance > 0.001;
    }
    if (rendererRef.current) {
      rendererRef.current.updateOptions({
        brightness: brightnessVal,
        renderShadow: renderShadow,
        minRefraction: 10,
        maxRefraction: refractionStrength
      });
    }
  }, [
    rainChance,
    minR,
    maxR,
    rainLimit,
    globalTimeScale,
    refractionStrength,
    brightnessVal,
    renderShadow,
    autoGlide,
    windVelocity,
    dropletsRate,
    dropFallMultiplier,
    trailRate,
    evaporationRate
  ]);

  // Handle Dynamic Background Blur Update
  useEffect(() => {
    bgBlurRef.current = bgBlur;
    if (prevImgRef.current && canvasBlurRef.current && !transitionAnimRef.current) {
      const blurCtx = canvasBlurRef.current.getContext("2d")!;
      blurCtx.clearRect(0, 0, 384, 256);
      blurCtx.filter = `blur(${bgBlur}px)`;
      blurCtx.drawImage(prevImgRef.current, -10, -10, 404, 276);
      if (rendererRef.current) {
        rendererRef.current.updateTextures();
      }
    }
  }, [bgBlur]);

  // Handle Resize Events cleanly
  useEffect(() => {
    let resizeTimer: number;
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      // Debounce window resize to optimize performance compiles
      resizeTimer = window.setTimeout(() => {
        // Trigger clean WebGL canvas adjust matching the active preset
        initializeSimulation(activePreset);
      }, 500);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(resizeTimer);
    };
  }, [activePreset]);

  const isCycleActiveRef = useRef(isCycleActive);
  const currentPhaseIndexRef = useRef(currentPhaseIndex);
  const activePresetRef = useRef(activePreset);
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const thunderVolumeRef = useRef(thunderVolume);
  const phasesRef = useRef(phases);
  const triggerManualLightningRef = useRef(triggerManualLightning);
  const playThunderSoundRef = useRef(playThunderSound);

  const lastLightningTimeRef = useRef<number>(0);
  const lastDistantThunderTimeRef = useRef<number>(0);

  // Pre-rolled wind values for weather cycle phases to ensure slow organic transitions
  const cycleWindValuesRef = useRef<number[]>([]);

  // Reset pre-rolled wind values when cycle starts/stops or phases are updated
  useEffect(() => {
    cycleWindValuesRef.current = [];
  }, [isCycleActive, phases]);

  // Cinematic cycle-driven lightning schedule refs
  const phaseTimeLeftRef = useRef<number>(phaseTimeLeft);
  const lastTrackedPhaseIdxRef = useRef<number>(-1);
  const phase3TargetTimeRef = useRef<number>(-1);
  const phase3FiredRef = useRef<boolean>(false);
  const phase4TargetTimesRef = useRef<number[]>([]);
  const phase4FiredRef = useRef<boolean[]>([]);

  useEffect(() => {
    isCycleActiveRef.current = isCycleActive;
    phaseTimeLeftRef.current = phaseTimeLeft;

    // Detect phase transitions to pre-roll cinematic strikes
    if (currentPhaseIndex !== lastTrackedPhaseIdxRef.current) {
      lastTrackedPhaseIdxRef.current = currentPhaseIndex;
      
      // Reset pre-rolled wind values when cycling back to index 0 to roll a new direction for the new loop!
      if (currentPhaseIndex === 0) {
        cycleWindValuesRef.current = [];
      }
      
      // Phase 3 (Active Rain): Exactly 1 strike towards the end (e.g. between 1500ms and 5500ms left of 18000ms duration)
      if (currentPhaseIndex === 2) {
        phase3FiredRef.current = false;
        phase3TargetTimeRef.current = Math.random() * 4000 + 1500;
        console.log(`Cinematic: Phase 3 entered. Pre-rolled strike target at ${phase3TargetTimeRef.current.toFixed(0)}ms remaining`);
      }
      
      // Phase 4 (Thunderstorm): At most 2 strikes randomly spaced
      if (currentPhaseIndex === 3) {
        phase4FiredRef.current = [false, false];
        // Strike 1 in the first half (timeLeft between 11000ms and 20000ms of 22000ms duration)
        const strike1 = Math.random() * 9000 + 11000;
        // Strike 2 in the second half (timeLeft between 1500ms and 10000ms)
        const strike2 = Math.random() * 8500 + 1500;
        phase4TargetTimesRef.current = [strike1, strike2];
        console.log(`Cinematic: Phase 4 entered. Pre-rolled strikes targets at ${strike1.toFixed(0)}ms and ${strike2.toFixed(0)}ms remaining`);
      }
    }

    currentPhaseIndexRef.current = currentPhaseIndex;
    activePresetRef.current = activePreset;
    isAudioEnabledRef.current = isAudioEnabled;
    thunderVolumeRef.current = thunderVolume;
    phasesRef.current = phases;
    triggerManualLightningRef.current = triggerManualLightning;
    playThunderSoundRef.current = playThunderSound;
  });

  // Storm/thunder automatic intervals and cooldowns coordination loop (runs every 200ms for high precision)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const isAudio = isAudioEnabledRef.current;

      const isCycle = isCycleActiveRef.current;
      const pIdx = currentPhaseIndexRef.current;
      const preset = activePresetRef.current;
      const phasesArr = phasesRef.current;

      // --- 1. Lightning Bolt + Flash (groza2) ---
      let shouldAllowLightning = false;
      let lightningCooldownMs = 12000; // default 12s
      let lightningProbPerSec = 0.08;   // default 24s total avg period (cooldown 12s + 12.5s random)

      if (isCycle) {
        // --- CINEMATIC CYCLE LIGHTNING SCHEDULER ---
        if (pIdx === 2) {
          // Phase 3 (Active Rain): Exactly 1 strike towards the end
          if (!phase3FiredRef.current && phaseTimeLeftRef.current <= phase3TargetTimeRef.current) {
            phase3FiredRef.current = true;
            if (triggerManualLightningRef.current) {
              triggerManualLightningRef.current(false);
            }
          }
        } else if (pIdx === 3) {
          // Phase 4 (Thunderstorm): At most 2 strikes randomly spaced
          for (let i = 0; i < phase4TargetTimesRef.current.length; i++) {
            if (!phase4FiredRef.current[i] && phaseTimeLeftRef.current <= phase4TargetTimesRef.current[i]) {
              phase4FiredRef.current[i] = true;
              if (triggerManualLightningRef.current) {
                triggerManualLightningRef.current(false);
              }
            }
          }
        }
      } else {
        const id = preset.id;
        shouldAllowLightning = id === "storm" || id === "phase_thunderstorm" || id === "phase_active_rain";
        if (shouldAllowLightning) {
          // Much more frequent and responsive automatic strikes for Thunder Rift mode
          lightningCooldownMs = 12000;
          lightningProbPerSec = 0.08;
        }

        if (shouldAllowLightning) {
          if (now - lastLightningTimeRef.current >= lightningCooldownMs) {
            const lightningProbPerTick = lightningProbPerSec * 0.2; // Scaled for 200ms tick
            if (Math.random() <= lightningProbPerTick) {
              lastLightningTimeRef.current = now;
              if (triggerManualLightningRef.current) {
                triggerManualLightningRef.current(false);
              }
            }
          }
        }
      }

      // --- 2. Distant Rumble sound ONLY (groza1) ---
      let inThunderMode = false;
      let rumbleCooldownMs = 30000; // default 30s
      let rumbleProbPerSec = 0.0333; // default 60s total avg period (cooldown 30s + 30s random)

      if (isCycle) {
        if ([2, 3, 4].includes(pIdx)) {
          inThunderMode = true;
          // Scale down for short cycle phases (Phases 3 and 4)
          rumbleCooldownMs = 8000;    // 8s cooldown
          rumbleProbPerSec = 0.0833;  // 20s total avg period (1 / (20 - 8) = 0.0833)
        }
      } else {
        const id = preset.id;
        if (['rain', 'storm', 'drizzle', 'fallout', 'phase_active_rain', 'phase_thunderstorm', 'phase_after_thunderstorm'].includes(id)) {
          inThunderMode = true;
          if (id === "storm") {
            // Strictly as requested for Thunder Rift preset: 60s period, 30s cooldown
            rumbleCooldownMs = 30000;
            rumbleProbPerSec = 0.0333; // 1 / (60 - 30) = 0.0333
          } else {
            rumbleCooldownMs = 30000;
            rumbleProbPerSec = 0.0333;
          }
        }
      }

      if (inThunderMode && isAudio) {
        if (now - lastDistantThunderTimeRef.current >= rumbleCooldownMs) {
          const rumbleProbPerTick = rumbleProbPerSec * 0.2; // Scaled for 200ms tick
          if (Math.random() <= rumbleProbPerTick) {
            lastDistantThunderTimeRef.current = now;
            if (playThunderSoundRef.current) {
              // Play pure groza1
              playThunderSoundRef.current('groza1', thunderVolumeRef.current);
            }
          }
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // 5. Sound System coordination hook
  useEffect(() => {
    if (synthRef.current) {
      if (isAudioEnabled) {
        synthRef.current.start();
        synthRef.current.setVolume(masterVolume);
        synthRef.current.setThunderVolume(thunderVolume);
        
        const rainV = isCycleActive ? audioRainLevel : activePreset.audioRainLevel;
        const windV = isCycleActive ? audioWindLevel : activePreset.audioWindLevel;
        
        synthRef.current.setRainIntensity(rainV);
        synthRef.current.setWindIntensity(windV);
      } else {
        synthRef.current.stop();
      }
    }
  }, [isAudioEnabled, masterVolume, thunderVolume, activePreset, isCycleActive, audioRainLevel, audioWindLevel]);

  // Manual striking trigger (simulates thunderstorm)
  function triggerManualLightning(isManual: boolean = false) {
    if (lightningActive) return;

    // Reset automatic lightning cooldown when a strike occurs
    lastLightningTimeRef.current = Date.now();

    const strikeX = 0.05 + Math.random() * 0.90; // strike coordinates (always inside canvas)
    const strikeY = 0.0 + Math.random() * 0.15;  // flash origin mostly near the top
    const maxIntensity = 0.75 + Math.random() * 0.25; // strike strength scale [0.75, 1.0] (super powerful!)
    const intensity = maxIntensity * (0.1 + Math.random() * 0.9); // Randomize strength from 10% to 100%
    
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Randomize strike type (single, double, or triple)
    const strikeTypeRand = Math.random();
    let numBolts = 1;
    let frames: Array<{ brightnessShift: number; opacity: number; boltIndex: number | null }> = [];

    if (strikeTypeRand < 0.55) {
      // 1. Single strike (55% chance)
      numBolts = 1;
      frames = [
        { brightnessShift: intensity * 2.85, opacity: 1.0,  boltIndex: 0 },
        { brightnessShift: intensity * 1.5,  opacity: 0.6,  boltIndex: 0 },
        { brightnessShift: intensity * 0.6,  opacity: 0.25, boltIndex: 0 },
        { brightnessShift: intensity * 0.18, opacity: 0.08, boltIndex: 0 },
      ];
    } else if (strikeTypeRand < 0.90) {
      // 2. Double strike (35% chance, two back-to-back pulses in the same area)
      numBolts = 2;
      frames = [
        // Pulse 1
        { brightnessShift: intensity * 2.85, opacity: 1.0,  boltIndex: 0 },
        { brightnessShift: intensity * 1.2,  opacity: 0.5,  boltIndex: 0 },
        { brightnessShift: intensity * 0.35, opacity: 0.15, boltIndex: 0 },
        // Brief Gap
        { brightnessShift: intensity * 0.08, opacity: 0.0,  boltIndex: null },
        { brightnessShift: intensity * 0.04, opacity: 0.0,  boltIndex: null },
        // Pulse 2 (quick repeat)
        { brightnessShift: intensity * 2.35, opacity: 0.95, boltIndex: 1 },
        { brightnessShift: intensity * 1.3,  opacity: 0.6,  boltIndex: 1 },
        { brightnessShift: intensity * 0.60, opacity: 0.25, boltIndex: 1 },
        { brightnessShift: intensity * 0.18, opacity: 0.08, boltIndex: 1 },
      ];
    } else {
      // 3. Triple strike (10% chance, three rapid sequential discharges)
      numBolts = 3;
      frames = [
        // Pulse 1
        { brightnessShift: intensity * 2.85, opacity: 1.0,  boltIndex: 0 },
        { brightnessShift: intensity * 1.2,  opacity: 0.5,  boltIndex: 0 },
        { brightnessShift: intensity * 0.3,  opacity: 0.15, boltIndex: 0 },
        // Gap 1
        { brightnessShift: intensity * 0.04, opacity: 0.0,  boltIndex: null },
        { brightnessShift: intensity * 0.02, opacity: 0.0,  boltIndex: null },
        // Pulse 2
        { brightnessShift: intensity * 2.15, opacity: 0.88, boltIndex: 1 },
        { brightnessShift: intensity * 1.0,  opacity: 0.45, boltIndex: 1 },
        { brightnessShift: intensity * 0.25, opacity: 0.12, boltIndex: 1 },
        // Gap 2
        { brightnessShift: intensity * 0.04, opacity: 0.0,  boltIndex: null },
        { brightnessShift: intensity * 0.02, opacity: 0.0,  boltIndex: null },
        // Pulse 3
        { brightnessShift: intensity * 2.65, opacity: 0.98, boltIndex: 2 },
        { brightnessShift: intensity * 1.5,  opacity: 0.65, boltIndex: 2 },
        { brightnessShift: intensity * 0.8,  opacity: 0.3,  boltIndex: 2 },
        { brightnessShift: intensity * 0.35, opacity: 0.12, boltIndex: 2 },
        { brightnessShift: intensity * 0.12, opacity: 0.04, boltIndex: 2 },
      ];
    }

    // Add a smooth, soft decay tail for the after-glow
    const decaySteps = 30 + Math.floor(Math.random() * 20);
    let lastBrightness = frames[frames.length - 1].brightnessShift;
    let lastOpacity = frames[frames.length - 1].opacity;

    // Smoother fadeout 1.5x slower
    for (let i = 0; i < decaySteps; i++) {
      lastBrightness *= 0.92;
      lastOpacity *= 0.90;
      frames.push({ brightnessShift: lastBrightness, opacity: lastOpacity, boltIndex: null });
    }
    frames.push({ brightnessShift: 0, opacity: 0, boltIndex: null });

    // Determine if the lightning is visible (front-of-glass) or "behind the canvas" (invisible bolt SVG)
    // Now always visible on the canvas
    const isVisible = true;

    // Pre-generate slightly jittered bolts so repeat discharges look organic and alive
    const bolts: Array<{ mainPath: string; branches: string[] }> = [];
    for (let s = 0; s < numBolts; s++) {
      const jitterX = (Math.random() - 0.5) * 0.035;
      const boltStrikeX = strikeX + jitterX;
      bolts.push(generateLightning(w, h, boltStrikeX));
    }

    setLightningActive(true);
    setLightningData({
      mainPath: bolts[0].mainPath,
      branches: bolts[0].branches,
      strikeX: strikeX,
      strikeY: strikeY,
      intensity: intensity,
      opacity: isVisible ? 1.0 : 0.0,
      visible: isVisible
    });

    if (synthRef.current && (isAudioEnabled || isManual)) {
      if (!isAudioEnabled && isManual) {
        setIsAudioEnabled(true);
        synthRef.current.start();
        synthRef.current.setVolume(masterVolume);
        synthRef.current.setThunderVolume(thunderVolume);
        synthRef.current.setRainIntensity(activePreset.audioRainLevel);
        synthRef.current.setWindIntensity(activePreset.audioWindLevel);
      }
      synthRef.current.triggerThunder(intensity);
    }

    if (isAudioEnabled || isManual) {
      playThunderSound('groza2', thunderVolume);
    }

    // Step through pre-programmed subscale lightning frames at ultra fast 15ms ticks
    let currentStep = 0;
    const interval = setInterval(() => {
      try {
        if (currentStep >= frames.length) {
          clearInterval(interval);
          setLightningActive(false);
          setLightningData(null);
          if (rendererRef.current) {
            rendererRef.current.updateOptions({ 
              brightness: brightnessValRef.current,
              flashColor: [0.0, 0.0, 0.0]
            });
          }
          return;
        }

        const frameData = frames[currentStep];
        const webglBrightness = brightnessValRef.current + frameData.brightnessShift;

        // Map corresponding jitter bolt path if visible and active
        if (frameData.boltIndex !== null && isVisible) {
          const activeBolt = bolts[frameData.boltIndex];
          const boltX = strikeX + (frameData.boltIndex - (numBolts - 1)/2) * 0.015;
          setLightningData((current) => {
            if (!current) return null;
            return {
              ...current,
              mainPath: activeBolt.mainPath,
              branches: activeBolt.branches,
              strikeX: boltX,
              intensity: intensity,
              opacity: frameData.opacity,
              visible: isVisible
            };
          });
        } else {
          // Just fade the lightning opacity during gas decay
          setLightningData((current) => {
            if (!current) return null;
            return {
              ...current,
              opacity: frameData.opacity
            };
          });
        }

        if (rendererRef.current) {
          // Compute electric purple additive blend
          let flashColor: [number, number, number] = [0.0, 0.0, 0.0];
          if (webglBrightness > brightnessValRef.current) {
            const delta = webglBrightness - brightnessValRef.current;
            // Additive deep magical electrical violet illumination
            flashColor = [
              0.65 * delta, // R
              0.38 * delta, // G
              1.85 * delta  // B
            ];
          }
          rendererRef.current.updateOptions({ 
            brightness: webglBrightness,
            flashColor: flashColor,
            flashPos: [strikeX, strikeY]
          });
        }

        currentStep++;
      } catch (err) {
        console.error("Error in lightning animation interval:", err);
        clearInterval(interval);
        setLightningActive(false);
        setLightningData(null);
        if (rendererRef.current) {
          rendererRef.current.updateOptions({ 
            brightness: brightnessValRef.current,
            flashColor: [0.0, 0.0, 0.0]
          });
        }
      }
    }, 15);
  };

  // Hotkeys (Space for lightning, 1..7 for phase jump)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if the user is typing or interacting with input elements
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        // Blur active element to prevent browser click event on any focused buttons
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        triggerManualLightning(true);
      } else if (e.key >= '1' && e.key <= '7') {
        const idx = parseInt(e.key) - 1;
        if (idx < phases.length) {
          if (!isCycleActive) {
            setIsCycleActive(true);
          }
          const targetPhase = phases[idx];
          setCurrentPhaseIndex(idx);
          setPhaseTimeLeft(targetPhase.durationMs);
          
          // Smoothly crossfade and transition to target phase preset values
          const targetPreset = PRESETS.find(p => p.id === targetPhase.presetId) || PRESETS[4];
          const calculatedMinR = targetPhase.maxR < 22 ? 6 : (targetPreset.raindrops.minR ?? 10);
          setMinR(calculatedMinR);
          transitionToPreset({
            ...targetPreset,
            id: targetPhase.id,
            audioRainLevel: targetPhase.audioRainLevel,
            audioWindLevel: targetPhase.audioWindLevel,
            raindrops: {
              ...targetPreset.raindrops,
              rainChance: targetPhase.rainChance,
              maxR: targetPhase.maxR,
              rainLimit: targetPhase.rainLimit,
            },
            renderer: {
              ...targetPreset.renderer,
              brightness: targetPhase.brightness,
            }
          }, true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phases, isCycleActive, triggerManualLightning, transitionToPreset]);

  // 6. Draw/Click handler on dynamic pane
  const handlePointerAction = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !raindropsRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const dpi = window.devicePixelRatio || 1;
    
    // Scale client coordinate down to localized virtual size
    const x = (event.clientX - rect.left) * dpi;
    const y = (event.clientY - rect.top) * dpi;

    // Check click mode representation
    const radiusSize = pointerMode === "draw" ? random(16, 28) : random(8, 14);
    
    raindropsRef.current.addDrop(
      raindropsRef.current.createDrop({
        x: x / dpi,
        y: y / dpi,
        r: radiusSize,
        momentum: pointerMode === "drag" ? 0.8 : 0.0,
        spreadX: 1.2,
        spreadY: 1.2
      })
    );
  };

  // Clean canvas wiping
  const handleClearCanvas = () => {
    if (raindropsRef.current) {
      raindropsRef.current.clearDrops();
    }
  };

  // Save current dynamic slider adjustments to the specified phase
  const handleSaveToPhase = (phaseId: string) => {
    setPhases((prev) => {
      const updated = prev.map((p) => {
        if (p.id === phaseId) {
          return {
            ...p,
            rainChance: rainChance,
            maxR: maxR,
            brightness: brightnessVal,
            bgBlur: bgBlur,
            // Do not save the animated windVelocity when weather autocycle is active
            ...(isCycleActive ? {} : { windVelocity: windVelocity }),
          };
        }
        return p;
      });
      localStorage.setItem("weather_cycle_v4", JSON.stringify(updated));
      return updated;
    });
  };

  // Reset a single phase to its original default
  const handleResetSinglePhase = (phaseId: string) => {
    const original = CYCLE_PHASES.find((p) => p.id === phaseId);
    if (!original) return;
    setPhases((prev) => {
      const updated = prev.map((p) => (p.id === phaseId ? { ...original } : p));
      localStorage.setItem("weather_cycle_v4", JSON.stringify(updated));
      return updated;
    });
  };

  // Reset all phases to structural defaults
  const handleResetAllPhases = () => {
    setPhases(CYCLE_PHASES);
    localStorage.removeItem("weather_cycle_v4");
    setPhaseTimeLeft(CYCLE_PHASES[0].durationMs);
    setCurrentPhaseIndex(0);
    setEditingPhaseId("phase_day");
    setCurrentBgUrl(DEFAULT_BACKGROUND_IMAGE);
    setCustomPreset(null);
  };

  // Slider resets
  const handleResetParameters = () => {
    setRainChance(activePreset.raindrops.rainChance ?? 0.3);
    setMaxR(activePreset.raindrops.maxR ?? 40);
    setGlobalTimeScale(1.0);
    setBrightnessVal(activePreset.renderer.brightness ?? 1.0);
    setRefractionStrength((activePreset.renderer.maxRefraction ?? 512) - 100);
    setRenderShadow(activePreset.renderer.renderShadow ?? true);
    setAutoGlide(true);
  };

  const handleMovePhase = (direction: "up" | "down") => {
    const idx = phases.findIndex((p) => p.id === editingPhaseId);
    if (idx < 0) return;

    if (direction === "up" && idx > 0) {
      const newPhases = [...phases];
      [newPhases[idx - 1], newPhases[idx]] = [newPhases[idx], newPhases[idx - 1]];
      setPhases(newPhases);
      localStorage.setItem("weather_cycle_v4", JSON.stringify(newPhases));
      
      if (currentPhaseIndex === idx) setCurrentPhaseIndex(idx - 1);
      else if (currentPhaseIndex === idx - 1) setCurrentPhaseIndex(idx);
    } else if (direction === "down" && idx < phases.length - 1) {
      const newPhases = [...phases];
      [newPhases[idx + 1], newPhases[idx]] = [newPhases[idx], newPhases[idx + 1]];
      setPhases(newPhases);
      localStorage.setItem("weather_cycle_v4", JSON.stringify(newPhases));
      
      if (currentPhaseIndex === idx) setCurrentPhaseIndex(idx + 1);
      else if (currentPhaseIndex === idx + 1) setCurrentPhaseIndex(idx);
    }
  };

  // Immersive sound button activation
  const toggleSound = () => {
    setIsAudioEnabled((prev) => {
      const nextVal = !prev;
      if (synthRef.current) {
        if (nextVal) {
          synthRef.current.start();
          synthRef.current.setVolume(masterVolume);
          synthRef.current.setThunderVolume(thunderVolume);
          const rainV = isCycleActive ? audioRainLevel : activePreset.audioRainLevel;
          const windV = isCycleActive ? audioWindLevel : activePreset.audioWindLevel;
          synthRef.current.setRainIntensity(rainV);
          synthRef.current.setWindIntensity(windV);
        } else {
          synthRef.current.stop();
        }
      }
      return nextVal;
    });
  };

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      
      {/* 1. Master WebGL Simulation Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerAction}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointerAction(e); // user is dragging
        }}
        className="absolute inset-0 cursor-crosshair z-0 block"
        style={{ touchAction: "none" }}
      />

      {/* Gyroscope Permission Prompt for iOS */}
      {showGyroPrompt && !isGyroEnabled && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl max-w-sm text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-white text-lg font-semibold mb-2">Enable Mobile Immersion</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Use your phone's gyroscope to experience the interactive 3D parallax effect while moving your device.
            </p>
            <button
              onClick={requestGyroPermission}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-3 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer"
            >
              Activate Parallax
            </button>
            <button
              onClick={() => setShowGyroPrompt(false)}
              className="w-full mt-2 text-zinc-500 hover:text-zinc-300 text-xs py-2 cursor-pointer"
            >
              Continue without gyro
            </button>
          </div>
        </div>
      )}

      {/* Lightning Storm dynamic flash & procedural bolt overlay */}
      {lightningActive && lightningData && (
        <>
          {/* Soft violet/purple localized radial gradient background flash (centered at the source location) */}
          <div 
            className="absolute inset-0 pointer-events-none z-10 mix-blend-screen transition-opacity duration-75"
            style={{
              background: `radial-gradient(150% 150% at ${lightningData.strikeX * 100}% ${lightningData.strikeY * 100}%, rgba(167, 139, 250, ${(lightningData.opacity * 0.55 * lightningData.intensity).toFixed(3)}) 0%, rgba(139, 92, 246, ${(lightningData.opacity * 0.22 * lightningData.intensity).toFixed(3)}) 50%, rgba(124, 58, 237, 0.0) 100%)`
            }}
          />

          {/* Procedural Lightning Vector Overlay (styled with a thick out-of-focus CSS blur to put it deep behind the wet glass plane) */}
          {lightningData.visible && (
            <svg
              className="absolute inset-0 pointer-events-none z-10 w-full h-full"
              style={{ mixBlendMode: "screen", filter: "blur(18px) contrast(1.15)" }}
            >
              <defs>
                {/* Core Neon Glow effect filter */}
                <filter id="lightningGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="6" result="glow1" />
                  <feGaussianBlur stdDeviation="16" result="glow2" />
                  <feMerge>
                    <feMergeNode in="glow2" />
                    <feMergeNode in="glow1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Thicker Ionized Gas Atmosphere Blur */}
                <filter id="lightningThickGlow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="35" result="glowMedium" />
                  <feMerge>
                    <feMergeNode in="glowMedium" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Massive Atmospheric Sky Washout Blur */}
                <filter id="lightningSuperLarge" x="-300%" y="-300%" width="700%" height="700%">
                  <feGaussianBlur stdDeviation="90" result="skyWash" />
                  <feMerge>
                    <feMergeNode in="skyWash" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* A. Massive ambient background sky-spanning purple flash fog */}
              <path
                d={lightningData.mainPath}
                fill="none"
                stroke="rgba(139, 92, 246, 0.42)"
                strokeWidth={120 * lightningData.intensity}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={lightningData.opacity * 0.9}
                filter="url(#lightningSuperLarge)"
              />

              {/* B. Thick soft ionized deep purple gas sheath */}
              <path
                d={lightningData.mainPath}
                fill="none"
                stroke="rgba(167, 139, 250, 0.55)"
                strokeWidth={45 * lightningData.intensity}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={lightningData.opacity}
                filter="url(#lightningThickGlow)"
              />

              {/* C. Secondary bright hot lavender gas channel */}
              <path
                d={lightningData.mainPath}
                fill="none"
                stroke="#c084fc"
                strokeWidth={20 * lightningData.intensity}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={lightningData.opacity}
                filter="url(#lightningGlow)"
              />

              {/* D. High-voltage plasma blinding white core of the main strike */}
              <path
                d={lightningData.mainPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth={6.0 * lightningData.intensity}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={lightningData.opacity}
              />

              {/* E. Heavy branching discharges with matching layers */}
              {lightningData.branches.map((bPath, index) => (
                <g key={index}>
                  {/* Secondary branch glow */}
                  <path
                    d={bPath}
                    fill="none"
                    stroke="rgba(167, 139, 250, 0.52)"
                    strokeWidth={14 * lightningData.intensity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={lightningData.opacity * 0.75}
                    filter="url(#lightningGlow)"
                  />
                  {/* Branch inner bright plasma channel */}
                  <path
                    d={bPath}
                    fill="none"
                    stroke="#faf5ff"
                    strokeWidth={2.2 * lightningData.intensity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={lightningData.opacity * 0.9}
                  />
                </g>
              ))}
            </svg>
          )}
        </>
      )}

      {/* 2. Glassmorphic header control bar */}
      <header className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-end px-6 z-20 pointer-events-none">
        {/* System metrics tags */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-300 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/5 rounded-full px-4 py-1.5 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-400">FPS:</span>
            <span className="font-bold text-white">{calculatedFps}</span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Drops:</span>
            <span className="font-bold text-white">{activeRaindropsCount}</span>
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin" />
            <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-zinc-300 mt-6 animate-pulse">
            Configuring WebGL program & pre-rendering textures...
          </p>
          <p className="text-xs text-cyan-400/60 font-mono mt-1.5">
            Re-indexing refractive indices
          </p>
        </div>
      )}

      {/* Runtime compile errors fallback UI */}
      {errorText && (
        <div className="absolute inset-0 bg-zinc-950 backdrop-blur-lg flex flex-col items-center justify-center z-50 px-6 text-center">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl max-w-md">
            <Flame className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h2 className="text-white text-lg font-bold">Hardware Acceleration Error</h2>
            <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{errorText}</p>
            <p className="text-xs text-zinc-500 mt-3 font-mono">
              Ensure WebGL is enabled in your browser preferences.
            </p>
          </div>
        </div>
      )}

      {/* 3. Sliding Translucent Glass Parameter Controller */}
      <section
        className={`absolute right-4 top-20 z-30 transition-all duration-300 max-h-[82vh] w-80 md:w-85 overflow-y-auto rounded-3xl bg-black/55 backdrop-blur-xl border border-white/10 p-5 text-white flex flex-col gap-5 ${activePreset.accentGlow} shadow-2xl ${
          isControllerCollapsed ? "translate-x-[92%] opacity-60" : "translate-x-0"
        }`}
      >
        {/* Toggle collapsible header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <button
            onClick={() => setIsControllerCollapsed((p) => !p)}
            className="flex items-center gap-2 hover:text-cyan-300 transition-colors pointer-events-auto"
          >
            {isControllerCollapsed ? (
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            )}
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
              {isControllerCollapsed ? "Expand Cockpit" : "Control Cockpit"}
            </span>
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={handleResetParameters}
              title="Reset Settings"
              className="p-1 px-2 text-[10px] uppercase font-mono tracking-wider rounded-md border border-white/10 hover:bg-white/5 hover:text-white transition group flex items-center gap-1 text-zinc-400"
            >
              <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
              Reset
            </button>
            <button
              onClick={handleClearCanvas}
              title="Clear Drops"
              className="p-1 px-2 text-[10px] uppercase font-mono tracking-wider rounded-md border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 transition flex items-center gap-1 text-zinc-400"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        {/* Dynamic Weather Automation Deck */}
        <div className="bg-zinc-950/45 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-3 shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                {isCycleActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isCycleActive ? "bg-cyan-400" : "bg-zinc-600"}`}></span>
              </span>
              Авто-Цикл Погоды
            </span>
            
            <button
              onClick={() => {
                setIsCycleActive((c) => !c);
                // Reset phase timer when toggled back on
                if (!isCycleActive) {
                  setPhaseTimeLeft(phases[currentPhaseIndex].durationMs);
                }
              }}
              className={`p-1 px-2.5 rounded-lg border flex items-center gap-1 transition text-[10px] font-mono font-bold ${
                isCycleActive
                  ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400"
                  : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {isCycleActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              {isCycleActive ? "АКТИВЕН" : "ПАУЗА"}
            </button>
          </div>

          {isCycleActive ? (
            <div className="flex flex-col gap-2 p-2 bg-black/20 rounded-xl border border-white/5">
              <div className="flex justify-between items-start text-xs">
                <div className="flex flex-col">
                  <span className="font-semibold text-cyan-300">
                    {phases[currentPhaseIndex]?.nameRu ?? ""}
                  </span>
                  <span className="text-[9px] text-zinc-500 leading-none mt-0.5">
                    {phases[currentPhaseIndex]?.nameEn ?? ""}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 mt-0.5 whitespace-nowrap">
                  {Math.ceil(phaseTimeLeft / 1000)} сек
                </span>
              </div>

              {/* Seamless Phase Timeline progress bar */}
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-400 h-full rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(34,211,238,0.35)]"
                  style={{
                    width: `${Math.max(0, Math.min(100, (1 - phaseTimeLeft / (phases[currentPhaseIndex]?.durationMs || 10000)) * 100))}%`
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-500 italic bg-white/2 p-2 rounded-xl text-center">
              Выберите пресет снизу или запустите автоматический цикл погоды
            </div>
          )}

          {/* Phase Customization Manager (Настройка этапов) */}
          <div className="flex flex-col gap-2 p-2.5 bg-black/35 rounded-xl border border-white/5 text-[11px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1">
              <span className="font-semibold text-zinc-300 font-mono tracking-wide uppercase text-[9px]">Настройка этапов цикла</span>
              <button
                onClick={handleResetAllPhases}
                className="text-[9px] text-zinc-500 hover:text-red-400 uppercase font-mono tracking-wider flex items-center gap-0.5 transition"
                title="Сбросить все этапы до заводских настроек"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Сбросить все
              </button>
            </div>

            {/* Micro selector for the stage to edit */}
            <div className="flex flex-col gap-1">
              <label className="text-zinc-500 text-[9px]">Выбрать этап для настройки:</label>
              <div className="flex gap-1.5 items-center">
                <select
                  value={editingPhaseId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setEditingPhaseId(pId);
                  // Load chosen phase's values into sliders so user can customize it directly!
                  const targetPhase = phases.find(p => p.id === pId);
                  if (targetPhase) {
                    const targetPreset = PRESETS.find(p => p.id === targetPhase.presetId) || PRESETS[4];
                    const calculatedMinR = targetPhase.maxR < 22 ? 6 : (targetPreset.raindrops.minR ?? 10);
                    setRainChance(targetPhase.rainChance);
                    setMinR(calculatedMinR);
                    setMaxR(targetPhase.maxR);
                    setBrightnessVal(targetPhase.brightness);
                    setBgBlur(targetPhase.bgBlur);
                    setWindVelocity(targetPhase.windVelocity);
                    
                    // If cycle is paused, we can also immediately trigger transition to let them see the look!
                    if (!isCycleActive) {
                      transitionToPreset({
                        ...targetPreset,
                        id: targetPhase.id,
                        audioRainLevel: targetPhase.audioRainLevel,
                        audioWindLevel: targetPhase.audioWindLevel,
                        bgBlur: targetPhase.bgBlur,
                        raindrops: {
                          ...targetPreset.raindrops,
                          minR: calculatedMinR,
                          maxR: targetPhase.maxR,
                          rainChance: targetPhase.rainChance,
                          dropletsRate: targetPhase.dropletsRate,
                          dropFallMultiplier: targetPhase.dropFallMultiplier,
                          trailRate: targetPhase.trailRate,
                          windVelocity: targetPhase.windVelocity,
                          evaporationRate: targetPhase.evaporationRate ?? 0,
                        },
                        renderer: {
                          ...targetPreset.renderer,
                          brightness: targetPhase.brightness,
                        }
                      }, true);
                    }
                  }
                }}
                className="bg-zinc-900 border border-white/10 rounded-lg p-1 text-zinc-300 outline-none cursor-pointer focus:border-cyan-500/50 flex-1 min-w-0 text-ellipsis"
              >
                {phases.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    {idx + 1}. {p.nameRu} ({p.durationMs / 1000}с)
                  </option>
                ))}
              </select>
              <div className="flex gap-1 items-center shrink-0">
                <button
                  onClick={() => handleMovePhase("up")}
                  disabled={phases.findIndex(p => p.id === editingPhaseId) === 0}
                  className="p-1 px-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded border border-white/10 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  title="Переместить вверх по списку"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-zinc-300" />
                </button>
                <button
                  onClick={() => handleMovePhase("down")}
                  disabled={phases.findIndex(p => p.id === editingPhaseId) === phases.length - 1}
                  className="p-1 px-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded border border-white/10 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  title="Переместить вниз по списку"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-300" />
                </button>
              </div>
              </div>
            </div>

            {/* Display action buttons for selected stage */}
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={() => {
                  handleSaveToPhase(editingPhaseId);
                  // Flash visual state confirmation
                  const savedBtn = document.getElementById("btn-save-feedback");
                  if (savedBtn) {
                    savedBtn.textContent = "СОХРАНЕНО!";
                    savedBtn.className = "p-1.5 text-[10px] rounded-lg font-mono font-bold uppercase transition bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 col-span-2 text-center";
                    setTimeout(() => {
                      savedBtn.textContent = "Сохранить текущие ползунки";
                      savedBtn.className = "p-1.5 text-[10px] rounded-lg font-mono font-bold uppercase transition bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 col-span-2 text-center";
                    }, 1200);
                  }
                }}
                id="btn-save-feedback"
                className="p-1.5 text-[10px] rounded-lg font-mono font-bold uppercase transition bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 col-span-2 text-center"
                title="Сохранить текущие параметры ползунков и симулятора в выбранный этап"
              >
                Сохранить текущие ползунки
              </button>
              
              <button
                onClick={() => {
                  handleResetSinglePhase(editingPhaseId);
                  // Load reset parameters back to sliders as visual feedback
                  const original = CYCLE_PHASES.find(p => p.id === editingPhaseId);
                  if (original) {
                    const originalPreset = PRESETS.find(p => p.id === original.presetId) || PRESETS[4];
                    const originalMinR = original.maxR < 22 ? 6 : (originalPreset.raindrops.minR ?? 10);
                    setRainChance(original.rainChance);
                    setMinR(originalMinR);
                    setMaxR(original.maxR);
                    setBrightnessVal(original.brightness);
                    setBgBlur(original.bgBlur);
                    setWindVelocity(original.windVelocity);
                  }
                  const resetBtn = document.getElementById("btn-reset-feedback");
                  if (resetBtn) {
                    resetBtn.textContent = "СБРОШЕНО!";
                    setTimeout(() => {
                      resetBtn.textContent = "Сбросить этап";
                    }, 1200);
                  }
                }}
                id="btn-reset-feedback"
                className="p-1 text-[9px] rounded-md font-mono transition bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-center"
                title="Сбросить выбранный этап до оригинальных заводских настроек"
              >
                Сбросить этап
              </button>

              <button
                onClick={() => {
                  // Direct transition to chosen stage for testing it
                  const targetPhase = phases.find(p => p.id === editingPhaseId);
                  if (targetPhase) {
                    const idx = phases.findIndex(p => p.id === editingPhaseId);
                    setCurrentPhaseIndex(idx);
                    setPhaseTimeLeft(targetPhase.durationMs);
                    
                    const targetPreset = PRESETS.find(p => p.id === targetPhase.presetId) || PRESETS[4];
                    const calculatedMinR = targetPhase.maxR < 22 ? 6 : (targetPreset.raindrops.minR ?? 10);
                    setMinR(calculatedMinR);
                    transitionToPreset({
                      ...targetPreset,
                      id: targetPhase.id,
                      audioRainLevel: targetPhase.audioRainLevel,
                      audioWindLevel: targetPhase.audioWindLevel,
                      bgBlur: targetPhase.bgBlur,
                      raindrops: {
                        ...targetPreset.raindrops,
                        minR: calculatedMinR,
                        maxR: targetPhase.maxR,
                        rainChance: targetPhase.rainChance,
                        dropletsRate: targetPhase.dropletsRate,
                        dropFallMultiplier: targetPhase.dropFallMultiplier,
                        trailRate: targetPhase.trailRate,
                        windVelocity: targetPhase.windVelocity,
                        evaporationRate: targetPhase.evaporationRate ?? 0,
                      },
                      renderer: {
                        ...targetPreset.renderer,
                        brightness: targetPhase.brightness,
                      }
                    }, true);
                  }
                }}
                className="p-1 text-[9px] rounded-md font-mono transition bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 hover:bg-indigo-500/20 text-center"
                title="Мгновенно включить этот этап в симуляции"
              >
                Запустить этап
              </button>
            </div>
          </div>

          {/* Speed Selector Slider (Скорость смены) */}
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider">Скорость смены</span>
              <span className="font-mono text-cyan-400 font-bold text-[11px] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/15">
                {cycleSpeed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="15.0"
              step="0.2"
              value={cycleSpeed}
              onChange={(e) => setCycleSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              title="Регулировка скорости прогона погодного цикла для удобства тестирования"
            />
            <span className="text-[8.5px] text-zinc-500 font-mono text-right italic leading-none">
              Ускорьте до 15x для быстрой проверки переходов
            </span>
          </div>
        </div>

        {/* Preset Selector Container */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            Active Atmosphere Presets
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {PRESETS.map((preset) => {
              const isActive = preset.id === activePreset.id;
              const Icon = (() => {
                switch (preset.id) {
                  case "rain": return CloudRain;
                  case "storm": return CloudLightning;
                  case "drizzle": return CloudFog;
                  case "fallout": return Flame;
                  case "sunny": return Sun;
                  default: return CloudRain;
                }
              })();

              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setIsCycleActive(false);
                    transitionToPreset(preset);
                  }}
                  className={`relative p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all outline-none border focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                    isActive
                      ? `${preset.themeColor} border-current border`
                      : "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/20 text-zinc-400"
                  }`}
                  title={`${preset.label}: ${preset.description}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-sans font-semibold tracking-wide truncate max-w-full justify-center">
                    {preset.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}


          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-xs font-semibold text-cyan-300 tracking-wide">
              {isCycleActive ? (phases[currentPhaseIndex]?.nameRu ?? "Цикл") : activePreset.label}
            </span>
            <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
              {isCycleActive ? (phases[currentPhaseIndex]?.nameEn ?? "") : activePreset.description}
            </p>
          </div>
        </div>

        {/* Ambient Synthesizer Deck */}
        <div className="flex flex-col gap-3 pb-2 border-b border-white/5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Web Audio Synthesizer
            </label>
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition text-xs font-mono font-bold ${
                isAudioEnabled
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {isAudioEnabled ? (
                <>
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  AUDIO ON
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  MUTED
                </>
              )}
            </button>
          </div>

          {isAudioEnabled ? (
            <div className="flex flex-col gap-3 p-2.5 bg-black/30 rounded-2xl border border-white/5">
              {/* Ambient Volume Control */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Ambient volume</span>
                  <span className="font-mono text-cyan-400 text-[10px]">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
                <input
                  id="ambient-volume-slider"
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Thunder Volume Control */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 flex items-center gap-1">
                    ⚡ Thunder volume
                  </span>
                  <span className="font-mono text-violet-400 text-[10px]">
                    {Math.round(thunderVolume * 100)}%
                  </span>
                </div>
                <input
                  id="thunder-volume-slider"
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={thunderVolume}
                  onChange={(e) => setThunderVolume(parseFloat(e.target.value))}
                  className="w-full accent-violet-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <span className="text-[9px] text-emerald-400/70 text-center font-mono italic">
                🔇 Real-time algorithmic sound synthesis is active
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-zinc-500 italic bg-white/2 p-2.5 rounded-xl text-center leading-normal">
              Click "AUDIO ON" to start full real-time rain, wind, and lightning acoustic synthesis. No connection required.
            </p>
          )}
        </div>

        {/* Physics and WebGL settings */}
        <div className="flex flex-col gap-4">
          <label className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Glass & Fluid Physics
          </label>

          {/* Slider 1: Rain Chance (Density) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Rainfall Density</span>
              <span className="font-mono text-cyan-400">{Math.round(rainChance * 100)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.85"
              step="0.02"
              value={rainChance}
              onChange={(e) => setRainChance(parseFloat(e.target.value))}
              disabled={activePreset.id === "sunny"}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg disabled:opacity-30"
            />
          </div>

          {/* Slider 2: Max Radius (Max droplet size) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Max Droplet Radius</span>
              <span className="font-mono text-cyan-400">{maxR}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="1"
              value={maxR}
              onChange={(e) => setMaxR(parseInt(e.target.value))}
              disabled={activePreset.id === "sunny"}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg disabled:opacity-30"
            />
          </div>

          {/* Slider 3: Time speed */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Gravity & Descent Speed</span>
              <span className="font-mono text-cyan-400">{globalTimeScale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.05"
              value={globalTimeScale}
              onChange={(e) => setGlobalTimeScale(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Slider 4: Refraction index */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Glass Refraction Multiplier</span>
              <span className="font-mono text-cyan-400">{refractionStrength}</span>
            </div>
            <input
              type="range"
              min="20"
              max="900"
              step="10"
              value={refractionStrength}
              onChange={(e) => setRefractionStrength(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Slider 5: Exposure brightness */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Exposure Brightness</span>
              <span className="font-mono text-cyan-400">{brightnessVal.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.02"
              value={brightnessVal}
              onChange={(e) => setBrightnessVal(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Slider 6: Background Blur */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Background Blur</span>
              <span className="font-mono text-cyan-400">{bgBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={bgBlur}
              onChange={(e) => setBgBlur(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Slider 7: Wind Direction & Speed */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Wind Direction</span>
              <span className="font-mono text-cyan-400">
                {windVelocity === 0 ? "None" : windVelocity < 0 ? `Left ${(Math.abs(windVelocity) * 10).toFixed(1)}` : `Right ${(windVelocity * 10).toFixed(1)}`}
              </span>
            </div>
            <input
              type="range"
              min="-0.4"
              max="0.4"
              step="0.05"
              value={windVelocity}
              onChange={(e) => setWindVelocity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Rain trails mode</span>
              <button
                onClick={() => setAutoGlide((g) => !g)}
                className={`w-full py-1.5 text-xs font-semibold rounded-xl border transition ${
                  autoGlide
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {autoGlide ? "Infinity Slide" : "Dry Sticky"}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400">Spec Shadows</span>
              <button
                onClick={() => setRenderShadow((s) => !s)}
                className={`w-full py-1.5 text-xs font-semibold rounded-xl border transition ${
                  renderShadow
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                    : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {renderShadow ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        {/* 3.5. Background Image Settings */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            Настройки фона
          </label>
          <div className="bg-zinc-950/45 p-3 rounded-2xl border border-white/5 flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">Режим фона:</span>
              <span className="font-mono text-cyan-400 text-[10px] font-semibold">
                {currentBgUrl === DEFAULT_BACKGROUND_IMAGE ? "Стандартный" : "Свой фон"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Загрузить свою картинку
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {currentBgUrl !== DEFAULT_BACKGROUND_IMAGE && (
                <button
                  onClick={() => {
                    setCurrentBgUrl(DEFAULT_BACKGROUND_IMAGE);
                    transitionToPreset(activePreset, false, DEFAULT_BACKGROUND_IMAGE);
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить к базовой
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Thunder Bolt Strike Trigger */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            Atmospheric triggers
          </label>
          <button
            onClick={() => triggerManualLightning(true)}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase rounded-2xl flex items-center justify-center gap-2 group shadow-lg transition-all duration-300 shadow-violet-950/40"
          >
            <Zap className="w-4 h-4 text-white group-hover:scale-125 transition-transform duration-300 group-hover:text-yellow-300 fill-white/15" />
            STRIKE LIGHTNING BOLT
          </button>
        </div>

        {/* 5. Draw / Drag manual interaction guide */}
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
              Interactive Windshield
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPointerMode("draw")}
                className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${
                  pointerMode === "draw"
                    ? "bg-cyan-400 text-black font-bold"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                Drop Splashes
              </button>
              <button
                onClick={() => setPointerMode("drag")}
                className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${
                  pointerMode === "drag"
                    ? "bg-cyan-400 text-black font-bold"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                Grip Drag
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 leading-normal">
            Click, hold, or drag across the glass pane to draw large custom water droplets that physically collide and merge with falling raindrops!
          </p>
        </div>
      </section>


    </div>
  );
}
