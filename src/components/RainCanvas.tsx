import React, { useEffect, useRef } from 'react';
import { LocationConfig, RainRecipe, TimePalette } from '../types/rain';
import { drawSkyAndCelestial, renderLocationScene } from '../utils/sceneRenderer';
import { audioEngine } from '../utils/audioEngine';

interface RainCanvasProps {
  rain: RainRecipe;
  location: LocationConfig;
  palette: TimePalette;
  intensity: number; // 0.1 to 1.5
  wind: number; // -1 to 1
  isPlaying: boolean;
  reducedMotion: boolean;
}

interface DropParticle {
  active: boolean;
  x: number;
  y: number;
  z: number; // 0.25 (far) to 1.0 (near)
  vx: number;
  vy: number;
  len: number;
  phase: number;
  isSnow: boolean;
  isSecondaryColor: boolean;
}

interface SplashParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  isSparkle: boolean;
  isHailBounce: boolean;
}

interface Ripple {
  active: boolean;
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
}

interface GlassDroplet {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobble: number;
  trail: { x: number; y: number }[];
}

interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface CloudPuff {
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number; // 0, 1, 2
  speed: number;
}

interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number; width: number }[];
  alpha: number;
}

const MAX_DROPS = 1350;
const MAX_SPLASHES = 450;
const MAX_RIPPLES = 180;
const MAX_GLASS_DROPS = 55;
const MAX_MOTES = 48;

export const RainCanvas: React.FC<RainCanvasProps> = ({
  rain,
  location,
  palette,
  intensity,
  wind,
  isPlaying,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ rain, location, palette, intensity, wind, isPlaying, reducedMotion });

  // Track scene changes for smooth fade transition
  const transitionRef = useRef(0);
  const prevKeyRef = useRef(`${location.id}-${palette.id}`);

  useEffect(() => {
    const nextKey = `${location.id}-${palette.id}`;
    if (prevKeyRef.current !== nextKey) {
      transitionRef.current = 0.45;
      prevKeyRef.current = nextKey;
    }
    propsRef.current = { rain, location, palette, intensity, wind, isPlaying, reducedMotion };
  }, [rain, location, palette, intensity, wind, isPlaying, reducedMotion]);

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

    // Pre-allocate object pools
    const drops: DropParticle[] = Array.from({ length: MAX_DROPS }, () => ({
      active: false,
      x: 0,
      y: 0,
      z: 1,
      vx: 0,
      vy: 0,
      len: 16,
      phase: Math.random() * Math.PI * 2,
      isSnow: false,
      isSecondaryColor: false,
    }));

    const splashes: SplashParticle[] = Array.from({ length: MAX_SPLASHES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 1.5,
      isSparkle: false,
      isHailBounce: false,
    }));

    const ripples: Ripple[] = Array.from({ length: MAX_RIPPLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      r: 1,
      maxR: 25,
      life: 0,
      maxLife: 0.7,
    }));

    const glassDroplets: GlassDroplet[] = Array.from({ length: MAX_GLASS_DROPS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2.2 + Math.random() * 5.2,
      vy: 14 + Math.random() * 48,
      wobble: Math.random() * Math.PI * 2,
      trail: [],
    }));

    const motes: AmbientMote[] = Array.from({ length: MAX_MOTES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.78,
      vx: (Math.random() - 0.5) * 26,
      vy: (Math.random() - 0.5) * 14,
      size: 2 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
    }));

    const clouds: CloudPuff[] = Array.from({ length: 18 }, (_, i) => ({
      x: (i / 18) * width * 1.4 - width * 0.2,
      y: height * (0.06 + (i % 3) * 0.085) + (Math.random() - 0.5) * 24,
      w: width * (0.22 + Math.random() * 0.24),
      h: height * (0.09 + Math.random() * 0.08),
      layer: i % 3,
      speed: 8 + (i % 3) * 7,
    }));

    let lightningFlash = 0;
    let thunderShake = 0;
    let lightningTimer = 2.5;
    let activeBolt: LightningBolt | null = null;
    let simTime = 0;
    let lastTimestamp = performance.now();
    let rafId = 0;

    const spawnDrop = (d: DropParticle, startTop: boolean, currentRain: RainRecipe, currentWind: number) => {
      d.active = true;
      d.z = 0.25 + Math.random() * 0.75;
      const spreadX = width * 1.6;
      d.x = Math.random() * spreadX - width * 0.3;
      d.y = startTop ? -Math.random() * 140 : Math.random() * height;
      d.phase = Math.random() * Math.PI * 2;
      d.isSecondaryColor = Boolean(currentRain.secondaryTint && Math.random() > 0.55);
      d.isSnow = Boolean(currentRain.snowMixRatio && Math.random() < currentRain.snowMixRatio);

      const speed =
        (currentRain.speedMin + Math.random() * (currentRain.speedMax - currentRain.speedMin)) *
        (0.45 + d.z * 0.55);

      if (d.isSnow) {
        d.vy = speed * 0.28;
        d.vx = currentWind * 90 + (Math.random() - 0.5) * 28;
        d.len = 3 + d.z * 3.5;
      } else {
        const totalAngleDeg = currentRain.angleBias + currentWind * 36 * currentRain.windResponse;
        const rad = (totalAngleDeg * Math.PI) / 180;
        d.vy = Math.cos(rad * 0.75) * speed;
        d.vx = Math.sin(rad) * speed;
        d.len =
          (currentRain.lengthMin + Math.random() * (currentRain.lengthMax - currentRain.lengthMin)) *
          (0.5 + d.z * 0.55);
      }
    };

    const spawnSplash = (x: number, y: number, currentRain: RainRecipe, isHail = false) => {
      const count = isHail ? 3 : currentRain.splashIntensity > 1.1 ? 3 : 2;
      let spawned = 0;
      for (let i = 0; i < MAX_SPLASHES && spawned < count; i++) {
        const s = splashes[i];
        if (!s.active) {
          s.active = true;
          s.x = x;
          s.y = y;
          const angle = -Math.PI * (0.15 + Math.random() * 0.7);
          const spd = (isHail ? 140 : 65) + Math.random() * 110 * currentRain.splashIntensity;
          s.vx = Math.cos(angle) * spd;
          s.vy = Math.sin(angle) * spd;
          s.life = 0;
          s.maxLife = currentRain.hasPetrichorSparkle ? 0.65 + Math.random() * 0.45 : 0.24 + Math.random() * 0.2;
          s.size = isHail ? 2.4 : 1.2 + Math.random() * 1.4;
          s.isSparkle = Boolean(currentRain.hasPetrichorSparkle);
          s.isHailBounce = isHail;
          spawned++;
        }
      }
    };

    const spawnRipple = (x: number, y: number, currentRain: RainRecipe) => {
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples[i];
        if (!r.active) {
          r.active = true;
          r.x = x;
          r.y = y;
          r.r = 2;
          r.maxR = currentRain.rippleMaxRadius * (0.65 + Math.random() * 0.6);
          r.life = 0;
          r.maxLife = 0.55 + Math.random() * 0.55;
          break;
        }
      }
    };

    const createLightningBolt = () => {
      const startX = width * (0.18 + Math.random() * 0.64);
      let cx = startX;
      let cy = 0;
      const targetY = height * (0.48 + Math.random() * 0.24);
      const segments: LightningBolt['segments'] = [];
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const nx = cx + (Math.random() - 0.5) * 75;
        const ny = cy + targetY / steps;
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, width: 3.2 - (i / steps) * 2.1 });
        // Occasional fork
        if (i > 2 && i < 9 && Math.random() < 0.42) {
          const bx = nx + (Math.random() - 0.5) * 95;
          const by = ny + 35 + Math.random() * 45;
          segments.push({ x1: nx, y1: ny, x2: bx, y2: by, width: 1.2 });
        }
        cx = nx;
        cy = ny;
      }
      activeBolt = { segments, alpha: 1 };
      lightningFlash = 1;
      thunderShake = 1;
      audioEngine.triggerThunder(0.85);
    };

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);
      const rawDt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const {
        rain: curRain,
        location: curLoc,
        palette: curPal,
        intensity: curIntensity,
        wind: curWind,
        isPlaying: playing,
        reducedMotion: reduced,
      } = propsRef.current;

      const dt = playing ? (reduced ? rawDt * 0.45 : rawDt) : 0;
      simTime += dt;

      if (transitionRef.current > 0) {
        transitionRef.current = Math.max(0, transitionRef.current - rawDt * 1.4);
      }

      // Lightning schedule
      if (playing && curRain.lightningFreq > 0 && !reduced) {
        lightningTimer -= rawDt * (0.4 + curRain.lightningFreq * 1.6);
        if (lightningTimer <= 0) {
          createLightningBolt();
          lightningTimer = 2.2 + Math.random() * (6.5 - curRain.lightningFreq * 4.5);
        }
      }
      if (lightningFlash > 0) lightningFlash = Math.max(0, lightningFlash - rawDt * 3.4);
      if (thunderShake > 0) thunderShake = Math.max(0, thunderShake - rawDt * 3.8);
      if (activeBolt) {
        activeBolt.alpha -= rawDt * 4.2;
        if (activeBolt.alpha <= 0) activeBolt = null;
      }

      ctx.save();
      // Subtle thunder camera shake
      if (thunderShake > 0.05 && !reduced) {
        const mag = thunderShake * 5;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }

      // 1. Sky & Celestial
      drawSkyAndCelestial(ctx, width, height, curPal, curRain.cloudDarkness, lightningFlash);

      // 2. Rainbow Refraction (for Rainbow Rain)
      if (curRain.hasRainbow) {
        const rbX = width * 0.5;
        const rbY = height * curLoc.groundLevel;
        const rbRadius = Math.min(width, height) * 0.62;
        const rainbowColors = [
          'rgba(248, 113, 113, 0.18)',
          'rgba(251, 146, 60, 0.18)',
          'rgba(250, 204, 21, 0.18)',
          'rgba(74, 222, 128, 0.18)',
          'rgba(56, 189, 248, 0.18)',
          'rgba(168, 85, 247, 0.16)',
        ];
        ctx.save();
        rainbowColors.forEach((col, idx) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(rbX, rbY, rbRadius - idx * 9, Math.PI, Math.PI * 2);
          ctx.stroke();
        });
        ctx.restore();
      }

      // 3. Sun Rays through Rain (Sun Shower / Rainbow Rain)
      if (curRain.hasSunbeams) {
        ctx.save();
        const rayOriginX = width * 0.72;
        const rayOriginY = -height * 0.1;
        for (let r = 0; r < 5; r++) {
          const spread = (r - 2) * 0.16 + Math.sin(simTime * 0.3 + r) * 0.02;
          const grad = ctx.createLinearGradient(rayOriginX, rayOriginY, rayOriginX - width * 0.45, height * 0.85);
          grad.addColorStop(0, 'rgba(255, 247, 205, 0.18)');
          grad.addColorStop(1, 'rgba(255, 247, 205, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(rayOriginX, rayOriginY);
          ctx.lineTo(rayOriginX - width * (0.28 + spread), height * 0.85);
          ctx.lineTo(rayOriginX - width * (0.14 + spread), height * 0.85);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Parallax Clouds
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.x += (c.speed + curWind * 42 * (0.5 + c.layer * 0.3)) * dt;
        if (c.x - c.w > width + 80) c.x = -c.w - 60;
        if (c.x + c.w < -80) c.x = width + c.w + 60;

        const cGrad = ctx.createLinearGradient(c.x, c.y - c.h * 0.5, c.x, c.y + c.h * 0.5);
        cGrad.addColorStop(0, lightningFlash > 0.2 ? 'rgba(226, 238, 255, 0.85)' : curPal.cloudLight);
        cGrad.addColorStop(1, curPal.cloudShadow);
        ctx.save();
        ctx.globalAlpha = 0.38 + curRain.cloudDarkness * 0.45;
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.46, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x - c.w * 0.25, c.y + c.h * 0.1, c.w * 0.32, c.h * 0.34, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x + c.w * 0.26, c.y + c.h * 0.12, c.w * 0.3, c.h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Lightning Bolt in Clouds
      if (activeBolt) {
        ctx.save();
        ctx.globalAlpha = activeBolt.alpha;
        ctx.strokeStyle = '#e0e7ff';
        ctx.shadowColor = '#93c5fd';
        ctx.shadowBlur = 18;
        for (const seg of activeBolt.segments) {
          ctx.lineWidth = seg.width;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Location Procedural Architecture, Trees, Water & Wet Reflections
      renderLocationScene(ctx, width, height, curLoc, curPal, simTime, curWind, lightningFlash, false);

      // 7. Volumetric Fog Drift
      const totalFog = Math.min(0.88, curLoc.horizonHaze * 0.35 + curRain.fogBoost);
      if (totalFog > 0.08) {
        const driftX = (simTime * (12 + curWind * 30)) % width;
        ctx.save();
        ctx.globalAlpha = totalFog * 0.52;
        const fogGrad = ctx.createLinearGradient(0, height * 0.38, 0, height * curLoc.groundLevel + 24);
        fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
        fogGrad.addColorStop(0.55, curPal.fogColor);
        fogGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, height * 0.38, width, height * 0.5);

        // Soft drifting fog bands
        ctx.fillStyle = curPal.fogColor;
        for (let f = 0; f < 3; f++) {
          const fx = ((driftX + f * width * 0.45) % (width * 1.4)) - width * 0.2;
          const fy = height * (0.56 + f * 0.08);
          ctx.beginPath();
          ctx.ellipse(fx, fy, width * 0.34, height * 0.075, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Ambient Particles (Birds, Fireflies, Bokeh, Autumn Leaves)
      const isAutumn = curLoc.id === 'autumn-street';
      for (let i = 0; i < MAX_MOTES; i++) {
        const m = motes[i];
        m.x += (m.vx + curWind * 25) * dt;
        m.y += (m.vy + Math.sin(simTime * 1.8 + m.phase) * 8) * dt;
        if (m.x > width + 20) m.x = -20;
        if (m.x < -20) m.x = width + 20;
        if (m.y > height * curLoc.groundLevel) m.y = 20;
        if (m.y < 10) m.y = height * 0.65;

        if (isAutumn && i % 2 === 0) {
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(simTime * 1.5 + m.phase);
          ctx.fillStyle = 'rgba(234, 88, 12, 0.72)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (curPal.ambientParticles === 'fireflies') {
          const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(simTime * 3 + m.phase));
          ctx.fillStyle = `rgba(190, 242, 100, ${pulse * 0.7})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (curPal.ambientParticles === 'birds' && i < 10 && curRain.cloudDarkness < 0.5) {
          const flap = Math.sin(simTime * 6 + m.phase) * 3;
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(m.x - 6, m.y + flap);
          ctx.quadraticCurveTo(m.x - 2, m.y - 3, m.x, m.y);
          ctx.quadraticCurveTo(m.x + 2, m.y - 3, m.x + 6, m.y + flap);
          ctx.stroke();
        } else if ((curPal.ambientParticles === 'bokeh' || curRain.hasBokeh) && i < 18) {
          ctx.fillStyle = curPal.id === 'afternoon' ? 'rgba(253, 186, 116, 0.14)' : 'rgba(224, 242, 254, 0.12)';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 9. Umbrella Prop (for Umbrella Rain)
      const groundY = height * curLoc.groundLevel;
      const umbX = width * 0.46;
      const umbY = groundY - height * 0.19;
      const umbR = Math.min(width, height) * 0.16;
      if (curRain.hasUmbrella) {
        ctx.save();
        // Umbrella handle
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(umbX, umbY);
        ctx.lineTo(umbX, umbY + umbR * 1.15);
        ctx.arc(umbX + 10, umbY + umbR * 1.15, 10, Math.PI, 0, true);
        ctx.stroke();

        // Frosted dome canopy
        const domeGrad = ctx.createRadialGradient(umbX, umbY - umbR * 0.4, 8, umbX, umbY, umbR);
        domeGrad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
        domeGrad.addColorStop(1, 'rgba(15, 23, 42, 0.84)');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(umbX, umbY, umbR, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      // 10. Active Rain Particle Simulation (Pooled)
      const targetActive = Math.min(
        MAX_DROPS,
        Math.floor(curRain.density * curIntensity * (reduced ? 180 : 480))
      );

      if (curRain.hasNeonGlow) {
        ctx.shadowBlur = 8;
      }

      for (let i = 0; i < MAX_DROPS; i++) {
        const d = drops[i];
        if (i < targetActive) {
          if (!d.active) {
            spawnDrop(d, false, curRain, curWind);
          }

          // Update physics
          if (curRain.hasSpiralVortex) {
            const vStr = curRain.vortexStrength ?? 1;
            const centerX = width * 0.5;
            const dx = d.x - centerX;
            const swirl = Math.sin(simTime * 3.2 * vStr + d.y * 0.012 + d.phase) * 260 * vStr;
            d.x += (d.vx + swirl - dx * 0.15 * vStr) * dt;
            d.y += d.vy * dt;
          } else if (d.isSnow) {
            d.x += (d.vx + Math.sin(simTime * 2 + d.phase) * 24) * dt;
            d.y += d.vy * dt;
          } else {
            d.x += d.vx * dt;
            d.y += d.vy * dt;
          }

          // Umbrella collision bounce
          if (curRain.hasUmbrella) {
            const dx = d.x - umbX;
            const dy = d.y - umbY;
            if (dy < 0 && dy > -umbR && dx * dx + dy * dy <= umbR * umbR) {
              spawnSplash(d.x, d.y, curRain, false);
              spawnDrop(d, true, curRain, curWind);
              continue;
            }
          }

          // Ground impact
          const hitY = groundY + (d.z - 0.25) * (height - groundY) * 0.85;
          if (d.y >= hitY) {
            if (Math.random() < 0.32 * curRain.splashIntensity) {
              spawnSplash(d.x, hitY, curRain, curRain.shape === 'hail');
            }
            if (Math.random() < 0.18 * curRain.rippleRate) {
              spawnRipple(d.x, hitY, curRain);
            }
            spawnDrop(d, true, curRain, curWind);
            continue;
          }

          if (d.x > width * 1.35 || d.x < -width * 0.35) {
            spawnDrop(d, true, curRain, curWind);
            continue;
          }

          // Draw particle based on recipe shape
          const strokeCol = d.isSecondaryColor && curRain.secondaryTint ? curRain.secondaryTint : curRain.colorTint;
          ctx.strokeStyle = strokeCol;
          ctx.fillStyle = strokeCol;
          if (curRain.hasNeonGlow) {
            ctx.shadowColor = strokeCol;
          }

          if (d.isSnow) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.len * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else if (curRain.shape === 'hail') {
            ctx.beginPath();
            ctx.arc(d.x, d.y, 2.2 + d.z * 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (curRain.shape === 'dot') {
            ctx.beginPath();
            ctx.arc(d.x, d.y, 1.1 + d.z * 0.9, 0, Math.PI * 2);
            ctx.fill();
          } else if (curRain.shape === 'drip') {
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, 1.8 * d.z, 5.5 * d.z, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Streak / needle / ice / sparkle / spiral
            const norm = Math.hypot(d.vx, d.vy) || 1;
            const tx = (d.vx / norm) * d.len;
            const ty = (d.vy / norm) * d.len;
            ctx.lineWidth = curRain.thickness * (0.55 + d.z * 0.55);
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - tx, d.y - ty);
            ctx.stroke();

            if (curRain.shape === 'sparkle' && d.z > 0.75) {
              ctx.fillStyle = curRain.secondaryTint || '#fde68a';
              ctx.beginPath();
              ctx.arc(d.x, d.y, 1.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else {
          d.active = false;
        }
      }

      ctx.shadowBlur = 0;

      // 11. Puddle Ripples
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripples[i];
        if (!r.active) continue;
        r.life += dt;
        if (r.life >= r.maxLife) {
          r.active = false;
          continue;
        }
        const t = r.life / r.maxLife;
        const radius = r.r + (r.maxR - r.r) * t;
        const alpha = (1 - t) * 0.45;
        ctx.strokeStyle = curRain.hasNeonGlow
          ? `rgba(103, 232, 249, ${alpha})`
          : `rgba(224, 242, 254, ${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, radius, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 12. Splashes & Petrichor Rising Sparkles
      for (let i = 0; i < MAX_SPLASHES; i++) {
        const s = splashes[i];
        if (!s.active) continue;
        s.life += dt;
        if (s.life >= s.maxLife) {
          s.active = false;
          continue;
        }
        if (s.isSparkle) {
          s.y -= 32 * dt;
          s.x += Math.sin(simTime * 6 + i) * 14 * dt;
        } else {
          s.vy += (s.isHailBounce ? 680 : 480) * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
        }
        const alpha = 1 - s.life / s.maxLife;
        ctx.fillStyle = s.isSparkle
          ? `rgba(253, 230, 138, ${alpha * 0.85})`
          : `rgba(224, 242, 254, ${alpha * 0.72})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 13. Rooftop Eaves Prop (Rooftop Rain / Rooftop Drip Rain)
      if (curRain.hasRooftopEaves) {
        ctx.save();
        ctx.fillStyle = '#070c18';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, 46);
        ctx.lineTo(0, 62);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 62);
        ctx.lineTo(width, 46);
        ctx.stroke();

        // Hanging droplets swelling along the eave edge
        const dripCount = 14;
        for (let e = 0; e < dripCount; e++) {
          const ex = (width / dripCount) * (e + 0.5);
          const ey = 62 - (ex / width) * 16;
          const swell = (simTime * 1.4 + e * 0.7) % 1;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
          ctx.beginPath();
          ctx.ellipse(ex, ey + swell * 4, 2.2, 2.5 + swell * 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 14. Foreground Droplets Sliding on Glass (Droplet-on-Glass Rain)
      if (curRain.hasGlassDroplets) {
        ctx.save();
        // Subtle window condensation vignette
        ctx.fillStyle = 'rgba(186, 230, 253, 0.04)';
        ctx.fillRect(0, 0, width, height);

        for (let g = 0; g < MAX_GLASS_DROPS; g++) {
          const gd = glassDroplets[g];
          gd.y += (gd.vy * (0.4 + curIntensity * 0.8)) * dt;
          gd.x += Math.sin(simTime * 2.5 + gd.wobble) * 8 * dt + curWind * 14 * dt;
          if (playing && Math.random() < 0.35) {
            gd.trail.push({ x: gd.x, y: gd.y });
            if (gd.trail.length > 14) gd.trail.shift();
          }
          if (gd.y > height + 30) {
            gd.y = -20;
            gd.x = Math.random() * width;
            gd.trail = [];
          }

          // Slide trail
          if (gd.trail.length > 1) {
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.18)';
            ctx.lineWidth = gd.r * 0.55;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(gd.trail[0].x, gd.trail[0].y);
            for (let t = 1; t < gd.trail.length; t++) {
              ctx.lineTo(gd.trail[t].x, gd.trail[t].y);
            }
            ctx.stroke();
          }

          // Refractive glass bead
          const beadGrad = ctx.createRadialGradient(gd.x - gd.r * 0.3, gd.y - gd.r * 0.3, 0.5, gd.x, gd.y, gd.r);
          beadGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
          beadGrad.addColorStop(0.55, 'rgba(186, 230, 253, 0.24)');
          beadGrad.addColorStop(1, 'rgba(15, 23, 42, 0.38)');
          ctx.fillStyle = beadGrad;
          ctx.beginPath();
          ctx.arc(gd.x, gd.y, gd.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Smooth scene crossfade curtain
      if (transitionRef.current > 0) {
        ctx.fillStyle = `rgba(2, 6, 23, ${transitionRef.current})`;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Animated ${rain.name} over ${location.name} at ${palette.label}`}
      className="block w-full h-full"
    />
  );
};
