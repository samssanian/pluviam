import React, { useEffect, useRef } from 'react';
import { StormPhase } from '../utils/stormAudioEngine';

interface StormCanvasProps {
  timelineTime: number; // 0 to 26+ seconds
  phase: StormPhase;
  isPlaying: boolean;
  reducedMotion: boolean;
}

type DebrisKind = 'leaf' | 'branch' | 'paper' | 'tin' | 'tile' | 'shard' | 'dust';

interface DebrisParticle {
  active: boolean;
  kind: DebrisKind;
  x: number;
  y: number;
  angle: number; // orbital angle around vortex
  radius: number;
  heightNorm: number; // 0 ground, 1 top
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  orbiting: boolean;
  alpha: number;
}

interface StormRainDrop {
  x: number;
  y: number;
  z: number;
  len: number;
}

interface SceneProp {
  id: string;
  kind: 'tree' | 'house' | 'fence' | 'sign' | 'car' | 'lamp';
  xRatio: number;
  scale: number;
  breakAt: number; // timeline second when destroyed
  brokenBurstDone: boolean;
}

const MAX_DEBRIS = 520;
const MAX_RAIN = 560;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpRgb(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(lerp(c1[0], c2[0], k));
  const g = Math.round(lerp(c1[1], c2[1], k));
  const b = Math.round(lerp(c1[2], c2[2], k));
  return `rgb(${r}, ${g}, ${b})`;
}

export const StormCanvas: React.FC<StormCanvasProps> = ({
  timelineTime,
  phase,
  isPlaying,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ timelineTime, phase, isPlaying, reducedMotion });

  useEffect(() => {
    stateRef.current = { timelineTime, phase, isPlaying, reducedMotion };
  }, [timelineTime, phase, isPlaying, reducedMotion]);

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

    // Pooled Debris
    const debris: DebrisParticle[] = Array.from({ length: MAX_DEBRIS }, () => ({
      active: false,
      kind: 'dust',
      x: 0,
      y: 0,
      angle: Math.random() * Math.PI * 2,
      radius: 40,
      heightNorm: 0,
      vx: 0,
      vy: 0,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 10,
      size: 4,
      orbiting: true,
      alpha: 1,
    }));

    // Pooled Rain
    const drops: StormRainDrop[] = Array.from({ length: MAX_RAIN }, () => ({
      x: Math.random() * width * 1.4 - width * 0.2,
      y: Math.random() * height,
      z: 0.3 + Math.random() * 0.7,
      len: 14 + Math.random() * 24,
    }));

    // Destructible Landscape Props
    const props: SceneProp[] = [
      { id: 'tree-1', kind: 'tree', xRatio: 0.09, scale: 1.0, breakAt: 16.2, brokenBurstDone: false },
      { id: 'fence-1', kind: 'fence', xRatio: 0.17, scale: 1.0, breakAt: 16.6, brokenBurstDone: false },
      { id: 'house-1', kind: 'house', xRatio: 0.27, scale: 1.0, breakAt: 17.3, brokenBurstDone: false },
      { id: 'sign-1', kind: 'sign', xRatio: 0.42, scale: 1.0, breakAt: 17.8, brokenBurstDone: false },
      { id: 'car-1', kind: 'car', xRatio: 0.56, scale: 1.0, breakAt: 18.4, brokenBurstDone: false },
      { id: 'lamp-1', kind: 'lamp', xRatio: 0.66, scale: 1.0, breakAt: 18.8, brokenBurstDone: false },
      { id: 'house-2', kind: 'house', xRatio: 0.78, scale: 0.85, breakAt: 19.3, brokenBurstDone: false },
      { id: 'tree-2', kind: 'tree', xRatio: 0.9, scale: 1.1, breakAt: 19.8, brokenBurstDone: false },
    ];

    const birds = Array.from({ length: 6 }, (_, i) => ({
      x: width * (0.15 + i * 0.12),
      y: height * (0.22 + (i % 3) * 0.06),
      phase: i * 1.3,
    }));

    const spawnDebrisBurst = (bx: number, by: number, kinds: DebrisKind[], count: number) => {
      let spawned = 0;
      for (let i = 0; i < MAX_DEBRIS && spawned < count; i++) {
        const d = debris[i];
        if (!d.active) {
          d.active = true;
          d.kind = kinds[spawned % kinds.length];
          d.x = bx + (Math.random() - 0.5) * 30;
          d.y = by - Math.random() * 25;
          d.angle = Math.random() * Math.PI * 2;
          d.radius = 24 + Math.random() * 140;
          d.heightNorm = Math.random() * 0.35;
          d.vx = (Math.random() - 0.5) * 260;
          d.vy = -120 - Math.random() * 280;
          d.rot = Math.random() * Math.PI * 2;
          d.vRot = (Math.random() - 0.5) * 14;
          d.size = d.kind === 'tin' || d.kind === 'tile' ? 8 + Math.random() * 10 : 4 + Math.random() * 7;
          d.orbiting = Math.random() > 0.25;
          d.alpha = 0.95;
          spawned++;
        }
      }
    };

    let prevTime = 0;
    let lastNow = performance.now();
    let localClock = 0;
    let lightningAlpha = 0;
    let nextLightning = 1.8;
    let rafId = 0;

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      const rawDt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;

      const { timelineTime: t, phase: curPhase, isPlaying: playing, reducedMotion: reduced } = stateRef.current;
      const dt = playing ? (reduced ? rawDt * 0.45 : rawDt) : rawDt * 0.25;
      localClock += dt;

      // Reset prop burst flags if user scrubbed/replayed backwards
      if (t < prevTime - 0.5 || t < 1.0) {
        for (const p of props) {
          if (t < p.breakAt) p.brokenBurstDone = false;
        }
      }
      prevTime = t;

      // Lightning schedule during formation/approach/impact
      if (t >= 4.5 && t <= 21.5 && !reduced) {
        nextLightning -= rawDt * (curPhase === 'impact' ? 2.4 : curPhase === 'approach' ? 1.5 : 0.8);
        if (nextLightning <= 0) {
          lightningAlpha = 0.95;
          nextLightning = 0.7 + Math.random() * 2.2;
        }
      }
      lightningAlpha = Math.max(0, lightningAlpha - rawDt * 4.5);

      const groundY = height * 0.78;

      // ----------------------------------------------------------
      // SKY COLOR GRADING ACROSS TIMELINE
      // ----------------------------------------------------------
      let skyTop = '#28527a';
      let skyMid = '#5482a8';
      let skyBot = '#9ec1db';

      if (t < 3) {
        // Calm
        skyTop = '#264d73';
        skyMid = '#517fa4';
        skyBot = '#9fc0d8';
      } else if (t < 6) {
        // Warning: turns sickly green-purple-black
        const k = (t - 3) / 3;
        skyTop = lerpRgb([38, 77, 115], [15, 20, 32], k);
        skyMid = lerpRgb([81, 127, 164], [32, 62, 52], k);
        skyBot = lerpRgb([159, 192, 216], [56, 48, 76], k);
      } else if (t < 16) {
        // Formation -> Approach: toxic emerald & bruised storm violet
        const k = (t - 6) / 10;
        skyTop = lerpRgb([15, 20, 32], [6, 9, 16], k);
        skyMid = lerpRgb([32, 62, 52], [18, 42, 34], k);
        skyBot = lerpRgb([56, 48, 76], [28, 22, 42], k);
      } else if (t < 22) {
        // Impact: pitch storm chaos
        skyTop = '#04060b';
        skyMid = '#0e1f1a';
        skyBot = '#1a1426';
      } else {
        // Aftermath: quiet somber charcoal dusk
        const k = Math.min(1, (t - 22) / 4);
        skyTop = lerpRgb([4, 6, 11], [12, 18, 28], k);
        skyMid = lerpRgb([14, 31, 26], [28, 36, 48], k);
        skyBot = lerpRgb([26, 20, 38], [52, 62, 78], k);
      }

      // Compute camera shake
      let shakeX = 0;
      let shakeY = 0;
      if (!reduced && t > 6 && t < 22.1) {
        const intensity =
          t < 10
            ? (t - 6) * 0.6
            : t < 16
              ? 2.4 + ((t - 10) / 6) * 6.5
              : 9 + Math.sin(t * 24) * 5;
        shakeX = (Math.random() - 0.5) * intensity * 2.2;
        shakeY = (Math.random() - 0.5) * intensity * 1.6;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, skyTop);
      skyGrad.addColorStop(0.55, skyMid);
      skyGrad.addColorStop(1, skyBot);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      if (lightningAlpha > 0.02) {
        ctx.fillStyle = `rgba(210, 235, 255, ${lightningAlpha * 0.48})`;
        ctx.fillRect(0, 0, width, groundY);
      }

      // 2. Calm Birds (0 - 3.5s)
      if (t < 3.6) {
        const birdAlpha = t < 2.8 ? 0.55 : Math.max(0, (3.6 - t) / 0.8) * 0.55;
        ctx.strokeStyle = `rgba(15, 23, 42, ${birdAlpha})`;
        ctx.lineWidth = 1.5;
        for (const b of birds) {
          const bx = (b.x + localClock * 26) % (width + 40) - 20;
          const by = b.y + Math.sin(localClock * 2 + b.phase) * 6;
          const flap = Math.sin(localClock * 7 + b.phase) * 3.5;
          ctx.beginPath();
          ctx.moveTo(bx - 7, by + flap);
          ctx.quadraticCurveTo(bx - 2, by - 3, bx, by);
          ctx.quadraticCurveTo(bx + 2, by - 3, bx + 7, by + flap);
          ctx.stroke();
        }
      }

      // 3. Swirling Supercell Wall Cloud
      const cloudSwirlStrength = Math.max(0, Math.min(1, (t - 3) / 6));
      const cloudYBase = height * 0.18;
      for (let i = 0; i < 12; i++) {
        const orbit = localClock * (0.2 + cloudSwirlStrength * 1.6) + i * 0.55;
        const cx = width * 0.5 + Math.cos(orbit) * (width * 0.36 * (0.4 + (i % 3) * 0.22));
        const cy = cloudYBase + Math.sin(orbit) * 26 - (i % 3) * 18;
        const rx = width * (0.18 + (i % 4) * 0.05);
        const ry = height * 0.09;
        ctx.fillStyle =
          t < 3
            ? 'rgba(226, 238, 250, 0.38)'
            : t < 22
              ? `rgba(12, 26, 24, ${0.55 + cloudSwirlStrength * 0.3})`
              : 'rgba(38, 48, 64, 0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. MULTI-LAYER ROTATING TORNADO FUNNEL (6s to 22s)
      let funnelX = width * 0.52;
      let funnelWidthBase = 18;
      const funnelActive = t >= 5.5 && t <= 22.0;

      if (funnelActive) {
        const formK = Math.max(0, Math.min(1, (t - 5.5) / 4.5)); // 0 -> 1 during formation
        const approachK = Math.max(0, Math.min(1, (t - 10) / 10)); // 0 -> 1 during approach & impact
        const funnelScale = lerp(0.12, 1.45, Math.pow(approachK, 1.35)) * formK;

        funnelX = width * (0.58 - approachK * 0.08) + Math.sin(localClock * 1.5) * (24 + approachK * 45);
        const topX = funnelX + Math.sin(localClock * 0.9) * 35;
        const topY = height * 0.14;
        const baseY = groundY + approachK * (height * 0.12);
        funnelWidthBase = Math.max(12, width * 0.025 + approachK * width * 0.18) * formK;
        const funnelWidthTop = funnelWidthBase * 2.9 + 55;

        // 5 nested rotating funnel layers for depth
        const slices = 26;
        for (let layer = 0; layer < 4; layer++) {
          const layerSpeed = (layer + 1) * 5.2;
          const layerAlpha = 0.24 + (3 - layer) * 0.14;
          const widthFactor = 1.0 - layer * 0.16;

          ctx.fillStyle =
            layer === 3
              ? `rgba(8, 14, 18, ${layerAlpha + 0.2})`
              : layer === 0
                ? `rgba(74, 108, 102, ${layerAlpha * 0.65})`
                : `rgba(28, 44, 46, ${layerAlpha})`;

          for (let s = 0; s < slices; s++) {
            const p0 = s / slices;
            const p1 = (s + 1) / slices;
            const y0 = lerp(topY, baseY, p0);
            const y1 = lerp(topY, baseY, p1);
            const bend0 = Math.sin(p0 * Math.PI * 1.6 - localClock * layerSpeed * 0.35) * (16 * (1 - p0 * 0.5));
            const bend1 = Math.sin(p1 * Math.PI * 1.6 - localClock * layerSpeed * 0.35) * (16 * (1 - p1 * 0.5));

            const cx0 = lerp(topX, funnelX, p0) + bend0;
            const cx1 = lerp(topX, funnelX, p1) + bend1;

            const w0 = lerp(funnelWidthTop, funnelWidthBase, Math.pow(p0, 0.72)) * widthFactor;
            const w1 = lerp(funnelWidthTop, funnelWidthBase, Math.pow(p1, 0.72)) * widthFactor;

            ctx.beginPath();
            ctx.moveTo(cx0 - w0, y0);
            ctx.lineTo(cx0 + w0, y0);
            ctx.lineTo(cx1 + w1, y1);
            ctx.lineTo(cx1 - w1, y1);
            ctx.closePath();
            ctx.fill();

            // Spiral ribbon bands wrapping around funnel
            if (s % 2 === 0 && layer < 3) {
              const bandOffset = Math.sin(p0 * 10 - localClock * layerSpeed) * w0 * 0.65;
              ctx.strokeStyle = `rgba(167, 243, 208, ${0.09 * funnelScale})`;
              ctx.lineWidth = 2 + funnelScale * 2.5;
              ctx.beginPath();
              ctx.moveTo(cx0 - w0 * 0.75 + bandOffset * 0.3, y0);
              ctx.quadraticCurveTo(cx0 + bandOffset, (y0 + y1) * 0.5, cx1 + w1 * 0.75, y1);
              ctx.stroke();
            }
          }
        }

        // Ground Dust Ring & Expanding Pressure Rings
        const dustGrad = ctx.createRadialGradient(funnelX, baseY, funnelWidthBase * 0.3, funnelX, baseY, funnelWidthBase * 2.8);
        dustGrad.addColorStop(0, 'rgba(30, 34, 38, 0.85)');
        dustGrad.addColorStop(0.55, 'rgba(68, 72, 68, 0.48)');
        dustGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = dustGrad;
        ctx.beginPath();
        ctx.ellipse(funnelX, baseY, funnelWidthBase * 2.8, funnelWidthBase * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pressure rings pulsing outward
        for (let r = 0; r < 3; r++) {
          const ringPhase = (localClock * 1.4 + r * 0.33) % 1;
          ctx.strokeStyle = `rgba(186, 230, 253, ${(1 - ringPhase) * 0.25})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(
            funnelX,
            baseY,
            funnelWidthBase * (1.2 + ringPhase * 2.6),
            funnelWidthBase * (0.28 + ringPhase * 0.55),
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        // Continuously feed debris particles into tornado
        if (playing && Math.random() < 0.75) {
          spawnDebrisBurst(funnelX, baseY - 10, ['dust', 'leaf', 'paper', 'branch'], 3);
        }
      }

      // 5. Ground Plane
      const gGrad = ctx.createLinearGradient(0, groundY, 0, height);
      gGrad.addColorStop(0, t < 3 ? '#1e3240' : t < 22 ? '#0e1718' : '#101620');
      gGrad.addColorStop(1, '#03050a');
      ctx.fillStyle = gGrad;
      ctx.fillRect(-20, groundY, width + 40, height - groundY + 40);

      // 6. Destructible Scene Props (Intact -> Tremble/Bend -> Break Burst)
      const windForce = t < 3 ? 0.1 : t < 6 ? (t - 3) / 3 : t < 22 ? 1 + (t - 6) * 0.15 : 0.15;
      for (const p of props) {
        const px = width * p.xRatio;
        const py = groundY + 6;
        const isBroken = t >= p.breakAt;

        if (isBroken && !p.brokenBurstDone) {
          p.brokenBurstDone = true;
          const kinds: DebrisKind[] =
            p.kind === 'house'
              ? ['tile', 'tin', 'branch', 'shard']
              : p.kind === 'tree'
                ? ['leaf', 'branch']
                : p.kind === 'car'
                  ? ['tin', 'shard']
                  : ['tin', 'paper'];
          spawnDebrisBurst(px, py - 24, kinds, 26);
        }

        if (isBroken) {
          // Leave only broken stump / rubble foundation
          ctx.fillStyle = '#090d14';
          if (p.kind === 'house') {
            ctx.fillRect(px - 26, py - 8, 52, 8);
          } else if (p.kind === 'tree') {
            ctx.fillRect(px - 4, py - 10, 8, 10);
          }
          continue;
        }

        const tremble = t > 9 ? Math.sin(localClock * 38 + px) * Math.min(6, (t - 9) * 0.7) : 0;
        const bend = windForce * 14 * (px < funnelX ? 1 : -1) * (t > 6 ? 1 : 0.25);

        ctx.save();
        ctx.translate(px + tremble, py);

        if (p.kind === 'tree') {
          const th = 78 * p.scale;
          ctx.strokeStyle = '#0b141c';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(bend * 0.4, -th * 0.5, bend, -th);
          ctx.stroke();

          ctx.fillStyle = t < 3 ? '#152b38' : '#0a1718';
          ctx.beginPath();
          ctx.arc(bend, -th, 26 * p.scale, 0, Math.PI * 2);
          ctx.arc(bend - 16, -th + 12, 18 * p.scale, 0, Math.PI * 2);
          ctx.arc(bend + 16, -th + 12, 18 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'house') {
          const hw = 64 * p.scale;
          const hh = 42 * p.scale;
          ctx.fillStyle = '#0c1522';
          ctx.fillRect(-hw / 2, -hh, hw, hh);
          // Roof rattling upward just before break
          const roofLift = t > p.breakAt - 1.5 ? (t - (p.breakAt - 1.5)) * 6 : 0;
          ctx.beginPath();
          ctx.moveTo(-hw * 0.62, -hh - roofLift);
          ctx.lineTo(0, -hh - 32 * p.scale - roofLift);
          ctx.lineTo(hw * 0.62, -hh - roofLift);
          ctx.closePath();
          ctx.fill();
          // Window flicker
          const winAlpha = t > 10 ? (Math.sin(localClock * 42) > 0 ? 0.7 : 0.15) : 0.8;
          ctx.fillStyle = `rgba(253, 210, 120, ${winAlpha})`;
          ctx.fillRect(-10, -hh * 0.68, 20, 14);
        } else if (p.kind === 'fence') {
          ctx.fillStyle = '#0d1624';
          for (let f = -2; f <= 2; f++) {
            ctx.fillRect(f * 10 + bend * 0.15, -18, 3, 18);
          }
          ctx.fillRect(-24 + bend * 0.15, -13, 48, 2.5);
        } else if (p.kind === 'sign') {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(bend * 0.35, -36);
          ctx.stroke();
          ctx.fillStyle = '#facc15';
          ctx.save();
          ctx.translate(bend * 0.35, -36);
          ctx.rotate(bend * 0.02);
          ctx.fillRect(-8, -8, 16, 16);
          ctx.restore();
        } else if (p.kind === 'car') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-24, -16, 48, 12);
          ctx.fillRect(-14, -26, 28, 10);
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(-14, -4, 5, 0, Math.PI * 2);
          ctx.arc(14, -4, 5, 0, Math.PI * 2);
          ctx.fill();
          // Headlights flickering
          ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
          ctx.fillRect(22, -13, 4, 4);
        } else if (p.kind === 'lamp') {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(bend * 0.4, -74);
          ctx.stroke();
          const bulbOn = t < 12 || Math.sin(localClock * 32) > 0.2;
          if (bulbOn) {
            ctx.fillStyle = 'rgba(254, 215, 170, 0.9)';
            ctx.beginPath();
            ctx.arc(bend * 0.4, -74, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // 7. Pooled Debris Physics & Rendering
      for (let i = 0; i < MAX_DEBRIS; i++) {
        const d = debris[i];
        if (!d.active) continue;

        if (d.orbiting && funnelActive) {
          d.angle += (3.8 + (1 - d.heightNorm) * 4.5) * dt;
          d.heightNorm += (0.14 + Math.random() * 0.05) * dt;
          d.rot += d.vRot * dt;
          const rScale = lerp(funnelWidthBase * 1.1, funnelWidthBase * 3.1, d.heightNorm);
          const ox = funnelX + Math.cos(d.angle) * (rScale + d.radius * 0.4);
          const oy = lerp(groundY, height * 0.14, d.heightNorm) + Math.sin(d.angle) * 14;
          d.x = ox;
          d.y = oy;
          if (d.heightNorm > 1.05) {
            d.orbiting = false;
            d.vx = Math.cos(d.angle) * 260;
            d.vy = -60;
          }
        } else {
          d.vy += 320 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.rot += d.vRot * dt;
          if (curPhase === 'aftermath') {
            d.vy = 28;
            d.vx = Math.sin(localClock + i) * 18;
            d.alpha -= 0.12 * dt;
          }
          if (d.y > height + 30 || d.alpha <= 0.02) {
            d.active = false;
            continue;
          }
        }

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.globalAlpha = d.alpha;
        if (d.kind === 'shard') {
          ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
          ctx.beginPath();
          ctx.moveTo(-d.size, -d.size * 0.5);
          ctx.lineTo(d.size, 0);
          ctx.lineTo(-d.size * 0.2, d.size);
          ctx.closePath();
          ctx.fill();
        } else if (d.kind === 'tin' || d.kind === 'tile') {
          ctx.fillStyle = d.kind === 'tin' ? '#475569' : '#7c2d12';
          ctx.fillRect(-d.size, -d.size * 0.4, d.size * 2, d.size * 0.8);
        } else if (d.kind === 'paper') {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-d.size * 0.7, -d.size * 0.5, d.size * 1.4, d.size);
        } else if (d.kind === 'leaf') {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(0, 0, d.size, d.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-d.size, -1.5, d.size * 2, 3);
        }
        ctx.restore();
      }

      // 8. Rain Bowing Sideways Toward Tornado
      const rainCount = curPhase === 'aftermath' ? 110 : MAX_RAIN;
      const baseTilt = t < 3 ? 0.08 : t < 6 ? 0.45 : t < 22 ? 1.15 : 0.06;
      const rainSpeed = t < 3 ? 520 : t < 22 ? 1150 : 320;
      ctx.strokeStyle = t < 3 ? 'rgba(210, 234, 255, 0.55)' : t < 22 ? 'rgba(186, 230, 253, 0.65)' : 'rgba(200, 220, 240, 0.32)';
      ctx.lineWidth = 1.2;

      for (let i = 0; i < rainCount; i++) {
        const r = drops[i];
        const pullToFunnel = funnelActive ? Math.sign(funnelX - r.x) * 0.35 : 0;
        const vx = (baseTilt + pullToFunnel) * rainSpeed * r.z;
        const vy = rainSpeed * r.z;
        r.x += vx * dt;
        r.y += vy * dt;

        if (r.y > height + 20) {
          r.y = -20;
          r.x = Math.random() * width * 1.4 - width * 0.2;
        }
        if (r.x > width * 1.3) r.x = -width * 0.2;
        if (r.x < -width * 0.3) r.x = width * 1.2;

        const norm = Math.hypot(vx, vy) || 1;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - (vx / norm) * r.len, r.y - (vy / norm) * r.len);
        ctx.stroke();
      }

      // 9. Chromatic Aberration / Distortion Pulse + Impact White Flash + Black Silence
      if (!reduced && curPhase === 'impact') {
        const pulse = 0.25 + 0.25 * Math.sin(localClock * 22);
        ctx.strokeStyle = `rgba(244, 63, 94, ${pulse * 0.3})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, width - 8, height - 8);
        ctx.strokeStyle = `rgba(34, 211, 238, ${pulse * 0.3})`;
        ctx.strokeRect(10, 8, width - 20, height - 16);
      }

      // Vignette Pulse
      const vigAlpha = curPhase === 'impact' ? 0.65 : curPhase === 'approach' ? 0.45 : 0.22;
      const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(2, 6, 15, ${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      // Blinding White Flash -> Black Silence -> Slow Fade into Aftermath
      if (t >= 20.8 && t < 21.6) {
        const flashK = 1 - Math.abs(t - 21.2) / 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, flashK)})`;
        ctx.fillRect(-20, -20, width + 40, height + 40);
      } else if (t >= 21.6 && t < 23.6) {
        const blackK = t < 22.3 ? 1 : Math.max(0, 1 - (t - 22.3) / 1.3);
        ctx.fillStyle = `rgba(2, 4, 10, ${blackK})`;
        ctx.fillRect(-20, -20, width + 40, height + 40);
      }

      ctx.restore();
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
      aria-label={`Storm Break tornado simulation, phase: ${phase}`}
      className="block w-full h-full"
    />
  );
};
