import React, { useEffect, useRef, useState } from 'react';
import { TimePalette } from '../types/rain';
import { UmbrellaLocation, UmbrellaPalette } from '../data/umbrellaLocations';
import { drawSkyAndCelestial } from '../utils/sceneRenderer';
import { drawUmbrellaLocationBg } from '../utils/umbrellaSceneRenderer';

interface UmbrellaPreviewCardProps {
  location: UmbrellaLocation;
  timePalette: TimePalette;
  umbrellaPalette: UmbrellaPalette;
  isSelected: boolean;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
}

export const UmbrellaPreviewCard: React.FC<UmbrellaPreviewCardProps> = ({
  location,
  timePalette,
  umbrellaPalette,
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
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]) setIsVisible(entries[0].isIntersecting);
      },
      { rootMargin: '120px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
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

    const miniWalkers = [0, 1, 2].map((i) => ({
      x: w * (0.2 + i * 0.3),
      dir: i % 2 === 0 ? 1 : -1,
      speed: 18 + i * 8,
      color: umbrellaPalette.colors[i % umbrellaPalette.colors.length],
    }));

    let rafId = 0;
    let last = performance.now();
    let t = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reducedMotion) t += dt;

      drawSkyAndCelestial(ctx, w, h, timePalette, 0.28, 0);
      drawUmbrellaLocationBg(ctx, w, h, location, timePalette, t, 0.12, true);

      const gy = h * location.groundLevel + 8;
      for (const mw of miniWalkers) {
        if (!reducedMotion) {
          mw.x += mw.dir * mw.speed * dt;
          if (mw.x > w + 20) mw.x = -20;
          if (mw.x < -20) mw.x = w + 20;
        }
        // Tiny silhouette + colored umbrella dome
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mw.x - 2, gy - 14, 4, 14);
        ctx.fillStyle = mw.color;
        ctx.beginPath();
        ctx.arc(mw.x, gy - 15, 9, Math.PI, 0);
        ctx.fill();
      }

      if (!reducedMotion) rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, location, timePalette, umbrellaPalette, reducedMotion]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(location.id)}
      aria-pressed={isSelected}
      className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-400 ${
        isSelected
          ? 'ring-2 ring-sky-300/90 bg-white/14 shadow-lg shadow-sky-950/50 scale-[1.01]'
          : 'glass-panel-subtle hover:bg-white/10 hover:-translate-y-0.5'
      }`}
    >
      <div className="relative w-full aspect-16/9 overflow-hidden bg-slate-900/70">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />
      </div>

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
