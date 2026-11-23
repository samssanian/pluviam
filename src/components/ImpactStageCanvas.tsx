import React, { useEffect, useRef } from 'react';
import { DisasterScene } from '../data/disasterScenes';
import { LocationConfig, RainRecipe, TimePalette } from '../types/rain';
import { renderDisasterScene } from '../utils/disasterSceneRenderer';
import { impactAudioEngine } from '../utils/impactAudioEngine';

interface ImpactStageCanvasProps {
  scene: DisasterScene;
  rain: RainRecipe;
  location: LocationConfig;
  palette: TimePalette;
  intensity: number; // 0 to 100
  wind: number; // 0 to 100
  isPlaying: boolean;
  reducedMotion: boolean;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  z: number;
}

export const ImpactStageCanvas: React.FC<ImpactStageCanvasProps> = ({
  scene,
  rain,
  location,
  palette,
  intensity,
  wind,
  isPlaying,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    scene,
    rain,
    location,
    palette,
    intensity,
    wind,
    isPlaying,
    reducedMotion,
  });

  useEffect(() => {
    propsRef.current = { scene, rain, location, palette, intensity, wind, isPlaying, reducedMotion };
  }, [scene, rain, location, palette, intensity, wind, isPlaying, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drops: Drop[] = Array.from({ length: 420 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 800,
      len: 14 + Math.random() * 24,
      speed: 500 + Math.random() * 550,
      z: 0.35 + Math.random() * 0.65,
    }));

    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let lightning = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(200, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const {
        scene: s,
        rain: r,
        location: loc,
        palette: pal,
        intensity: intVal,
        wind: windVal,
        isPlaying: playing,
        reducedMotion: rm,
      } = propsRef.current;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 800;
      const h = rect.height || 450;

      const intNorm = intVal / 100;
      const windNorm = windVal / 100;

      if (playing && !rm) {
        elapsed += dt;
        const lightningProb = (r.lightningFreq * 0.6 + (s.severity === 'Catastrophic' ? 0.35 : 0.1)) * dt;
        if (!s.hasSunrise && Math.random() < lightningProb) {
          lightning = 0.85;
          impactAudioEngine.triggerThunder(intNorm);
        }
        lightning = Math.max(0, lightning - dt * 2.6);
      }

      renderDisasterScene(ctx, w, h, s, loc, pal, elapsed, windNorm, intNorm, lightning, false);

      // Rain overlay (scaled by intensity & calmed on sunrise/candles)
      const quietFactor = s.hasSunrise ? 0.18 : s.hasCandles ? 0.35 : 1.0;
      const activeCount = Math.min(
        drops.length,
        Math.floor((70 + intNorm * 260 * Math.min(1.4, r.density)) * quietFactor)
      );
      const windTilt = (r.angleBias + windNorm * 32 * r.windResponse) * (Math.PI / 180);
      const dx = Math.sin(windTilt);
      const dy = Math.cos(windTilt);

      ctx.strokeStyle = s.id === 'acid-corrosion' ? 'rgba(190, 242, 100, 0.58)' : r.colorTint;
      ctx.lineWidth = Math.max(1, r.thickness * 0.9);
      ctx.beginPath();
      for (let i = 0; i < activeCount; i++) {
        const d = drops[i];
        if (playing && !rm) {
          const spd = (r.speedMin + d.z * (r.speedMax - r.speedMin)) * (0.65 + intNorm * 0.75);
          d.x += dx * spd * dt;
          d.y += dy * spd * dt;
          if (d.y > h + 30) {
            d.y = -20 - Math.random() * 40;
            d.x = Math.random() * (w + 180) - 90;
          }
          if (d.x > w + 100) d.x -= w + 160;
          if (d.x < -100) d.x += w + 160;
        }
        const len = (r.lengthMin + d.z * (r.lengthMax - r.lengthMin)) * 0.85;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + dx * len, d.y + dy * len);
      }
      ctx.stroke();

      // Occasional water splash rings
      const waterY = h * (1 - s.waterDepth);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.25)';
      ctx.lineWidth = 1;
      const ringCount = Math.floor(6 + intNorm * 14);
      for (let i = 0; i < ringCount; i++) {
        const phase = (elapsed * 2.2 + i * 0.37) % 1;
        const rx = ((i * 137 + 41) % w);
        const ry = waterY + 6 + ((i * 53) % Math.max(20, h - waterY - 10));
        const rad = 3 + phase * 18;
        ctx.globalAlpha = (1 - phase) * 0.35;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rad, rad * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (!rm) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Animated simulation scene: ${scene.title}`}
      className="w-full h-full block"
    />
  );
};
