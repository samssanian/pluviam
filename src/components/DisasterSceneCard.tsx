import React, { useEffect, useRef, useState } from 'react';
import { Cross } from 'lucide-react';
import { DisasterScene, SeverityLevel } from '../data/disasterScenes';
import { LocationConfig, TimePalette } from '../types/rain';
import { renderDisasterScene } from '../utils/disasterSceneRenderer';

interface DisasterSceneCardProps {
  scene: DisasterScene;
  location: LocationConfig;
  palette: TimePalette;
  isSelected: boolean;
  onSelect: (scene: DisasterScene) => void;
  reducedMotion: boolean;
  timestampLabel?: string;
}

const SEVERITY_BADGE: Record<SeverityLevel, string> = {
  Low: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35',
  Moderate: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
  Severe: 'bg-orange-500/25 text-orange-200 border-orange-400/45',
  Catastrophic: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
};

export const DisasterSceneCard: React.FC<DisasterSceneCardProps> = ({
  scene,
  location,
  palette,
  isSelected,
  onSelect,
  reducedMotion,
  timestampLabel,
}) => {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0]?.isIntersecting ?? false);
      },
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const w = 280;
      const h = 156;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      renderDisasterScene(ctx, w, h, scene, location, palette, t, 0.35, 0.65, 0, true);

      // Light rain streaks on mini preview
      ctx.strokeStyle = scene.id === 'acid-corrosion' ? 'rgba(190, 242, 100, 0.5)' : 'rgba(210, 232, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const rx = ((i * 31 + t * 85) % (w + 20)) - 10;
        const ry = ((i * 47 + t * 340) % (h + 20)) - 10;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 3, ry + 11);
      }
      ctx.stroke();

      if (!reducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, scene, location, palette, reducedMotion]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(scene)}
      aria-pressed={isSelected}
      className={`group relative flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-400 ${
        isSelected
          ? 'ring-2 ring-sky-400 bg-white/12 shadow-xl shadow-sky-950/50 -translate-y-0.5'
          : scene.isHealth
            ? 'bg-rose-950/25 border border-rose-400/25 hover:border-rose-400/55 hover:bg-rose-950/40 hover:-translate-y-0.5'
            : 'glass-panel-subtle hover:bg-white/10 hover:-translate-y-0.5'
      }`}
    >
      {/* Animated Canvas Thumbnail */}
      <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full object-cover block" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-tabular font-medium bg-slate-950/75 text-slate-200 border border-white/15">
            {timestampLabel ?? `#${String(scene.number).padStart(2, '0')}`}
          </span>

          <div className="flex items-center gap-1.5">
            {scene.isHealth && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-600/90 text-white shadow-sm shadow-rose-950/60">
                <Cross className="w-2.5 h-2.5" aria-hidden="true" />
                HEALTH
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${SEVERITY_BADGE[scene.severity]}`}
            >
              {scene.severity}
            </span>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-1">
        <div className="text-sm font-medium text-white group-hover:text-sky-200 transition-colors leading-snug">
          {scene.title}
        </div>
        <p className="text-xs text-slate-300/75 line-clamp-2 leading-relaxed">
          {scene.description}
        </p>
      </div>
    </button>
  );
};
