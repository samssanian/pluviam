import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ImpactPreviewButtonProps {
  onNavigate: () => void;
  reducedMotion: boolean;
}

export const ImpactPreviewButton: React.FC<ImpactPreviewButtonProps> = ({
  onNavigate,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const w = 68;
      const h = 40;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      // Dark storm sky
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#091122');
      bg.addColorStop(1, '#1a2742');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Tiny power pole + sparking wire
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 28);
      ctx.lineTo(14, 7);
      ctx.stroke();

      if (Math.sin(t * 14) > 0) {
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.arc(16, 11, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rising floodwater street
      ctx.fillStyle = 'rgba(14, 116, 144, 0.72)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) {
        ctx.lineTo(x, 26 + Math.sin(x * 0.25 + t * 4) * 1.6);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Tiny falling rain
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rx = ((i * 11 + t * 28) % (w + 6)) - 3;
        const ry = ((i * 17 + t * 90) % (h + 6)) - 3;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 2, ry + 6);
      }
      ctx.stroke();

      // Red-cross health pulse dot on right
      const pulse = 0.8 + Math.sin(t * 5) * 0.22;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.35 * pulse})`;
      ctx.beginPath();
      ctx.arc(54, 15, 8 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(54, 15, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(53.1, 12.2, 1.8, 5.6);
      ctx.fillRect(51.2, 14.1, 5.6, 1.8);

      if (!reducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  return (
    <a
      href="/impact-simulator"
      onClick={(e) => {
        e.preventDefault();
        onNavigate();
      }}
      className="group relative inline-flex items-center gap-3 p-1.5 pr-4 rounded-2xl glass-panel border border-rose-400/35 hover:border-rose-400/75 bg-slate-950/55 hover:bg-rose-950/45 text-sm font-medium text-white shadow-lg shadow-slate-950/60 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-rose-400"
    >
      <div className="relative w-[68px] h-[40px] rounded-xl overflow-hidden border border-white/15 shrink-0">
        <canvas ref={canvasRef} aria-hidden="true" className="w-full h-full block" />
      </div>
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-rose-300 group-hover:text-rose-200 transition-colors" aria-hidden="true" />
        <span>⚠ Rain Impact Simulator</span>
      </span>
    </a>
  );
};
