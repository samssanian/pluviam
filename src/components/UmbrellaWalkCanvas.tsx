import React, { useEffect, useRef } from 'react';
import { TimePalette } from '../types/rain';
import { UmbrellaLocation, UmbrellaPalette } from '../data/umbrellaLocations';
import { drawSkyAndCelestial } from '../utils/sceneRenderer';
import {
  drawUmbrellaLocationBg,
  drawWalkerCharacter,
  WalkerEntity,
  WalkerKind,
} from '../utils/umbrellaSceneRenderer';

interface UmbrellaWalkCanvasProps {
  location: UmbrellaLocation;
  timePalette: TimePalette;
  umbrellaPalette: UmbrellaPalette;
  intensity: number;
  wind: number;
  gustTrigger: number; // incremented when user triggers a wind gust
  isPlaying: boolean;
  reducedMotion: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  z: number; // 0.3 far, 0.7 mid, 1.0 foreground big drop
  len: number;
}

interface FootSplashRipple {
  active: boolean;
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
}

interface EdgeDrip {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  targetY: number;
}

const MAX_RAIN = 780;
const MAX_RIPPLES = 160;
const MAX_DRIPS = 120;

const ARCHETYPE_ROSTER: WalkerKind[] = [
  'calm-black',
  'couple-clear',
  'child-yellow',
  'businessman-rush',
  'elder-cane',
  'woman-saree',
  'gust-flip',
  'closing-shop',
  'spinning-playful',
  'waiting-signal',
  'bump-apology',
  'bump-apology',
  'doorway-umbrella',
];

export const UmbrellaWalkCanvas: React.FC<UmbrellaWalkCanvasProps> = ({
  location,
  timePalette,
  umbrellaPalette,
  intensity,
  wind,
  gustTrigger,
  isPlaying,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    location,
    timePalette,
    umbrellaPalette,
    intensity,
    wind,
    isPlaying,
    reducedMotion,
  });
  const gustSurgeRef = useRef(0);

  useEffect(() => {
    if (gustTrigger > 0) {
      gustSurgeRef.current = 1.0;
    }
  }, [gustTrigger]);

  useEffect(() => {
    propsRef.current = {
      location,
      timePalette,
      umbrellaPalette,
      intensity,
      wind,
      isPlaying,
      reducedMotion,
    };
  }, [location, timePalette, umbrellaPalette, intensity, wind, isPlaying, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const paletteColors = propsRef.current.umbrellaPalette.colors;

    // Initialize diverse 13-character cast featuring all 12 requested behaviors
    const walkers: WalkerEntity[] = ARCHETYPE_ROSTER.map((kind, idx) => {
      const dir: 1 | -1 =
        kind === 'bump-apology'
          ? idx % 2 === 0
            ? 1
            : -1
          : idx % 2 === 0
            ? 1
            : -1;

      const baseSpeed =
        kind === 'businessman-rush'
          ? 84
          : kind === 'elder-cane'
            ? 22
            : kind === 'child-yellow'
              ? 52
              : kind === 'waiting-signal' || kind === 'doorway-umbrella'
                ? 0
                : 38 + (idx % 3) * 10;

      const x =
        kind === 'waiting-signal'
          ? width * 0.76
          : kind === 'doorway-umbrella'
            ? width * 0.14
            : kind === 'bump-apology'
              ? idx % 2 === 0
                ? width * 0.36
                : width * 0.62
              : (idx / ARCHETYPE_ROSTER.length) * width;

      const umbCol =
        kind === 'calm-black'
          ? '#0f172a'
          : kind === 'couple-clear'
            ? 'rgba(224, 242, 254, 0.56)'
            : paletteColors[idx % paletteColors.length];

      const coatCol =
        kind === 'woman-saree'
          ? '#be123c'
          : kind === 'child-yellow'
            ? '#facc15'
            : idx % 3 === 0
              ? '#0f172a'
              : idx % 3 === 1
                ? '#1e293b'
                : '#334155';

      return {
        id: idx,
        kind,
        x,
        baseYOffset: 16 + (idx % 5) * 15,
        dir,
        speed: baseSpeed,
        scale: 0.92 + (idx % 5) * 0.09,
        umbrellaColor: umbCol,
        coatColor: coatCol,
        phase: idx * 0.9,
        gustFlipTimer: 0,
        apologyTimer: 0,
        closingProgress: 0,
        waitTapPhase: 0,
        dripAccum: 0,
        stepAccum: 0,
      };
    });

    const drops: RainDrop[] = Array.from({ length: MAX_RAIN }, (_, i) => ({
      x: Math.random() * width * 1.4 - width * 0.2,
      y: Math.random() * height,
      z: i < 220 ? 0.35 : i < 620 ? 0.7 : 1.0,
      len: i < 220 ? 8 : i < 620 ? 18 : 28,
    }));

    const ripples: FootSplashRipple[] = Array.from({ length: MAX_RIPPLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      r: 2,
      maxR: 22,
      life: 0,
      maxLife: 0.6,
    }));

    const drips: EdgeDrip[] = Array.from({ length: MAX_DRIPS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: 260,
      targetY: height,
    }));

    const spawnRipple = (x: number, y: number, maxR = 20) => {
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples[i];
        if (!r.active) {
          r.active = true;
          r.x = x;
          r.y = y;
          r.r = 2;
          r.maxR = maxR;
          r.life = 0;
          r.maxLife = 0.45 + Math.random() * 0.35;
          break;
        }
      }
    };

    const spawnEdgeDrip = (x: number, y: number, targetY: number) => {
      for (let i = 0; i < MAX_DRIPS; i++) {
        const d = drips[i];
        if (!d.active) {
          d.active = true;
          d.x = x;
          d.y = y;
          d.vy = 240 + Math.random() * 120;
          d.targetY = targetY;
          break;
        }
      }
    };

    let lastPaletteId = propsRef.current.umbrellaPalette.id;
    let simTime = 0;
    let autoGustTimer = 7.5;
    let lastNow = performance.now();
    let rafId = 0;

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      const rawDt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;

      const {
        location: curLoc,
        timePalette: curPal,
        umbrellaPalette: curUmbPal,
        intensity: curInt,
        wind: curWind,
        isPlaying: playing,
        reducedMotion: reduced,
      } = propsRef.current;

      // Update umbrella colors when palette changes
      if (lastPaletteId !== curUmbPal.id) {
        lastPaletteId = curUmbPal.id;
        walkers.forEach((w, idx) => {
          if (w.kind !== 'calm-black' && w.kind !== 'couple-clear') {
            w.umbrellaColor = curUmbPal.colors[idx % curUmbPal.colors.length];
          }
        });
      }

      const dt = playing ? (reduced ? rawDt * 0.45 : rawDt) : 0;
      simTime += dt;

      // Natural & triggered wind gust events
      if (playing) {
        autoGustTimer -= dt;
        if (autoGustTimer <= 0) {
          gustSurgeRef.current = 0.85;
          autoGustTimer = 9 + Math.random() * 7;
        }
      }
      if (gustSurgeRef.current > 0) {
        gustSurgeRef.current = Math.max(0, gustSurgeRef.current - rawDt * 0.38);
      }

      const effectiveWind = curWind + gustSurgeRef.current * (curWind >= 0 ? 0.65 : -0.65);
      const groundY = height * curLoc.groundLevel;

      // 1. Sky & Celestial
      drawSkyAndCelestial(ctx, width, height, curPal, 0.32 * curInt, 0);

      // 2. Location Architecture & Wet Walkway
      drawUmbrellaLocationBg(ctx, width, height, curLoc, curPal, simTime, effectiveWind, false);

      // 3. Background Drizzle Rain (z < 0.5)
      const activeRainTotal = Math.min(MAX_RAIN, Math.floor(curInt * (reduced ? 220 : 540)));
      ctx.strokeStyle = 'rgba(216, 236, 255, 0.44)';

      for (let i = 0; i < activeRainTotal; i++) {
        const r = drops[i];
        if (r.z > 0.75) continue;
        const speed = (480 + r.z * 480) * (0.7 + curInt * 0.4);
        const vx = effectiveWind * 340 * r.z;
        const vy = speed;
        r.x += vx * dt;
        r.y += vy * dt;
        if (r.y > height) {
          r.y = -20;
          r.x = Math.random() * width * 1.4 - width * 0.2;
        }
        if (r.x > width * 1.3) r.x = -width * 0.2;
        if (r.x < -width * 0.3) r.x = width * 1.2;

        const norm = Math.hypot(vx, vy) || 1;
        ctx.lineWidth = r.z < 0.5 ? 0.8 : 1.2;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - (vx / norm) * r.len, r.y - (vy / norm) * r.len);
        ctx.stroke();
      }

      // 4. Update & Depth-Sort Walkers
      const bumpers = walkers.filter((w) => w.kind === 'bump-apology');
      if (bumpers.length === 2 && playing) {
        const [b1, b2] = bumpers;
        if (b1.apologyTimer <= 0 && Math.abs(b1.x - b2.x) < 34) {
          b1.apologyTimer = 2.1;
          b2.apologyTimer = 2.1;
          b1.dir = b1.dir === 1 ? -1 : 1;
          b2.dir = b2.dir === 1 ? -1 : 1;
          b1.x += b1.dir * 18;
          b2.x += b2.dir * 18;
        }
      }

      const sortedWalkers = [...walkers].sort((a, b) => a.baseYOffset - b.baseYOffset);

      for (const w of sortedWalkers) {
        if (playing) {
          if (w.apologyTimer > 0) {
            w.apologyTimer = Math.max(0, w.apologyTimer - dt);
          } else {
            w.x += w.dir * w.speed * dt;
          }

          // Wrap around screen edges
          if (w.x > width + 65) w.x = -60;
          if (w.x < -65) w.x = width + 60;

          // Gust flip reaction
          if (w.kind === 'gust-flip' && (gustSurgeRef.current > 0.5 || Math.abs(effectiveWind) > 0.72)) {
            if (w.gustFlipTimer <= 0) w.gustFlipTimer = 2.4;
          }
          if (w.gustFlipTimer > 0) {
            w.gustFlipTimer = Math.max(0, w.gustFlipTimer - dt);
          }

          // Closing wet umbrella near shop doorway (around x = 22% of width)
          if (w.kind === 'closing-shop') {
            const distShop = Math.abs(w.x - width * 0.22);
            const targetClose = distShop < 58 ? 1 : 0;
            w.closingProgress += (targetClose - w.closingProgress) * Math.min(1, dt * 4);
          }

          // Foot puddle splashes
          if (w.speed > 0 && w.apologyTimer <= 0) {
            w.stepAccum += dt * (w.kind === 'child-yellow' ? 3.2 : 1.7);
            if (w.stepAccum >= 1) {
              w.stepAccum = 0;
              spawnRipple(w.x, groundY + w.baseYOffset, w.kind === 'child-yellow' ? 28 : 16);
            }
          }

          // Umbrella edge water drips
          w.dripAccum += dt * (w.kind === 'woman-saree' || w.kind === 'doorway-umbrella' ? 3.5 : 1.8);
          if (w.dripAccum >= 1 && w.closingProgress < 0.5) {
            w.dripAccum = 0;
            const rimSide = (Math.random() > 0.5 ? 1 : -1) * 22 * w.scale;
            spawnEdgeDrip(w.x + rimSide, groundY + w.baseYOffset - 46 * w.scale, groundY + w.baseYOffset);
          }
        }

        drawWalkerCharacter(
          ctx,
          w,
          groundY,
          simTime,
          effectiveWind,
          curPal.id === 'night',
          curPal.id === 'noon',
          curPal.id === 'afternoon'
        );
      }

      // 5. Edge Drips Falling & Puddle Splash Rings
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      for (let i = 0; i < MAX_DRIPS; i++) {
        const d = drips[i];
        if (!d.active) continue;
        d.y += d.vy * dt;
        if (d.y >= d.targetY) {
          d.active = false;
          spawnRipple(d.x, d.targetY, 14);
          continue;
        }
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 1.3, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples[i];
        if (!r.active) continue;
        r.life += dt;
        if (r.life >= r.maxLife) {
          r.active = false;
          continue;
        }
        const k = r.life / r.maxLife;
        const rad = r.r + (r.maxR - r.r) * k;
        ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - k) * 0.45})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rad, rad * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 6. Foreground Big Raindrops (z >= 0.75)
      ctx.strokeStyle = 'rgba(226, 244, 255, 0.62)';
      for (let i = 0; i < activeRainTotal; i++) {
        const r = drops[i];
        if (r.z <= 0.75) continue;
        const speed = 1050 * (0.75 + curInt * 0.4);
        const vx = effectiveWind * 420;
        const vy = speed;
        r.x += vx * dt;
        r.y += vy * dt;
        if (r.y > height) {
          r.y = -30;
          r.x = Math.random() * width * 1.4 - width * 0.2;
        }
        if (r.x > width * 1.3) r.x = -width * 0.2;
        if (r.x < -width * 0.3) r.x = width * 1.2;

        const norm = Math.hypot(vx, vy) || 1;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - (vx / norm) * r.len, r.y - (vy / norm) * r.len);
        ctx.stroke();
      }
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Animated umbrella walk scene at ${location.name} during ${timePalette.label}`}
      className="block w-full h-full"
    />
  );
};
