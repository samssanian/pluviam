import React, { useEffect, useRef, useState } from 'react';
import { LocationConfig, RainRecipe, TimePalette } from '../types/rain';
import { drawSkyAndCelestial, renderLocationScene } from '../utils/sceneRenderer';

interface ScenePreviewCardProps {
  location: LocationConfig;
  palette: TimePalette;
  activeRain: RainRecipe;
  isSelected: boolean;
  onSelect: (locationId: string) => void;
  reducedMotion: boolean;
}

export const ScenePreviewCard: React.FC<ScenePreviewCardProps> = ({
  location,
  palette,
  activeRain,
  isSelected,
  onSelect,
  reducedMotion,
}) => {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) setIsVisible(entries[0].isIntersecting);
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 320;
    const h = 180;
    canvas.width = w;
    canvas.height = h;

    // Mini rain streaks for preview
    const miniDrops = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: 7 + Math.random() * 10,
      speed: 140 + Math.random() * 140,
    }));

    let rafId = 0;
    let last = performance.now();
    let t = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reducedMotion) {
        t += dt;
      }

      drawSkyAndCelestial(ctx, w, h, palette, activeRain.cloudDarkness * 0.7, 0);
      renderLocationScene(ctx, w, h, location, palette, t, 0.15, 0, true);

      // Subtle animated mini rain lines
      ctx.strokeStyle = activeRain.colorTint;
      ctx.lineWidth = 1;
      for (const d of miniDrops) {
        if (!reducedMotion) {
          d.y += d.speed * dt;
          d.x -= d.speed * 0.12 * dt;
          if (d.y > h) {
            d.y = -12;
            d.x = Math.random() * (w + 30);
          }
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 2, d.y - d.len);
        ctx.stroke();
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, location, palette, activeRain, reducedMotion]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(location.id)}
      aria-pressed={isSelected}
      className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
        isSelected
          ? 'ring-2 ring-sky-300/90 bg-white/14 shadow-lg shadow-sky-950/50 scale-[1.01]'
          : 'glass-panel-subtle hover:bg-white/10 hover:-translate-y-0.5'
      }`}
    >
      {/* Live Mini Animated Canvas Preview */}
      <div className="relative w-full aspect-16/9 overflow-hidden bg-slate-900/70">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Clean Typography Body — No Pill Enclosures */}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-medium text-white truncate">{location.name}</h3>
          <span className="text-xs text-sky-200/75 whitespace-nowrap shrink-0">
            {isSelected ? 'Active' : location.region}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-300/80 line-clamp-1">{location.atmosphere}</p>
      </div>
    </button>
  );
};
