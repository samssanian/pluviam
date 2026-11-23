import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface EndingSectionProps {
  reducedMotion: boolean;
}

export const EndingSection: React.FC<EndingSectionProps> = ({ reducedMotion }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.parentElement?.clientHeight || 540;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const clouds = Array.from({ length: 12 }, (_, i) => ({
      x: (i / 12) * width * 1.4 - width * 0.2,
      y: height * (0.14 + (i % 4) * 0.19),
      rx: 130 + Math.random() * 140,
      ry: 46 + Math.random() * 34,
      speed: 10 + (i % 3) * 6,
      opacity: 0.45 + (i % 3) * 0.18,
    }));

    const gentleDrops = Array.from({ length: 85 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 10 + Math.random() * 14,
      speed: 220 + Math.random() * 140,
      alpha: 0.16 + Math.random() * 0.22,
    }));

    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Pure serene white sky canvas
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#f8fafc');
      bg.addColorStop(0.5, '#ffffff');
      bg.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Soft drifting silver-white clouds
      for (const c of clouds) {
        if (!reducedMotion) {
          c.x += c.speed * dt;
          if (c.x - c.rx > width + 80) c.x = -c.rx - 80;
        }
        const grad = ctx.createRadialGradient(c.x, c.y - c.ry * 0.2, c.rx * 0.1, c.x, c.y, c.rx);
        grad.addColorStop(0, `rgba(255, 255, 255, ${c.opacity})`);
        grad.addColorStop(0.65, `rgba(226, 232, 240, ${c.opacity * 0.55})`);
        grad.addColorStop(1, 'rgba(226, 232, 240, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x - c.rx * 0.42, c.y + 8, c.rx * 0.65, c.ry * 0.72, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x + c.rx * 0.45, c.y + 10, c.rx * 0.6, c.ry * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gentle silver-blue rain streaks
      ctx.lineWidth = 1.1;
      for (const d of gentleDrops) {
        if (!reducedMotion) {
          d.y += d.speed * dt;
          d.x += 12 * dt;
          if (d.y > height + 20) {
            d.y = -20;
            d.x = Math.random() * width;
          }
          if (d.x > width + 20) d.x = -10;
        }
        ctx.strokeStyle = `rgba(100, 116, 139, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1.2, d.y - d.len);
        ctx.stroke();
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion]);

  return (
    <section
      id="credits"
      ref={sectionRef}
      aria-label="Closing atmospheric tribute"
      className="relative w-full min-h-[72vh] bg-white text-slate-900 overflow-hidden flex items-center justify-center px-6 py-24 border-t border-slate-200/70"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 glass-light-card rounded-3xl px-10 py-12 sm:px-16 sm:py-14 text-center max-w-lg w-full"
      >
        <p className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-slate-900">
          made by sams Sanian
        </p>
      </motion.div>
    </section>
  );
};
