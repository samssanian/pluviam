import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { LogoAnimationId } from '../data/logoAnimations';
import { TimeMode } from '../types/rain';

interface BrandLogoProps {
  animationId: LogoAnimationId;
  timeMode?: TimeMode;
  variant?: 'nav' | 'hero' | 'preview';
  showTagline?: boolean;
  replayKey?: number;
  reducedMotion?: boolean;
}

const ACCENT_GLOW: Record<TimeMode, { glow: string; drop: string; textTint: string }> = {
  day: {
    glow: '0 0 22px rgba(56, 189, 248, 0.45)',
    drop: 'rgba(186, 230, 253, 0.9)',
    textTint: '#e0f2fe',
  },
  noon: {
    glow: '0 0 22px rgba(255, 251, 235, 0.55)',
    drop: 'rgba(255, 255, 255, 0.92)',
    textTint: '#fffbeb',
  },
  afternoon: {
    glow: '0 0 24px rgba(251, 146, 60, 0.52)',
    drop: 'rgba(254, 215, 170, 0.9)',
    textTint: '#ffedd5',
  },
  night: {
    glow: '0 0 26px rgba(56, 189, 248, 0.5), 0 0 42px rgba(129, 140, 248, 0.35)',
    drop: 'rgba(165, 243, 252, 0.92)',
    textTint: '#e0e7ff',
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  animationId,
  timeMode = 'night',
  variant = 'hero',
  showTagline = false,
  replayKey = 0,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accent = ACCENT_GLOW[timeMode];

  // Compact Nav Variant
  if (variant === 'nav') {
    return (
      <span
        className="inline-flex items-baseline gap-2 select-none whitespace-nowrap shrink-0"
        style={{ textShadow: accent.glow }}
      >
        <span className="font-display text-2xl font-semibold tracking-tight text-white">
          Rain
        </span>
        <span
          className="font-bengali text-xl font-medium"
          style={{ color: accent.textTint }}
        >
          বৃষ্টি
        </span>
      </span>
    );
  }

  // Hero & Preview Canvas Particle Overlay (Droplets through letters, ripples, condensation, lightning, mist, bokeh)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = variant === 'preview' ? 260 : 340;
    const h = variant === 'preview' ? 88 : 112;
    canvas.width = w;
    canvas.height = h;

    const drops = Array.from({ length: 18 }, (_, i) => ({
      x: 24 + (i / 18) * (w - 48) + (Math.random() - 0.5) * 16,
      y: -Math.random() * 70,
      vy: 75 + Math.random() * 65,
      sliding: false,
      slideTimer: 0,
      trail: [] as { x: number; y: number }[],
    }));

    const ripples = [] as { x: number; y: number; r: number; life: number }[];
    let elapsed = 0;
    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;

      ctx.clearRect(0, 0, w, h);

      // 1. Droplet Cascade / Condensation / Wind-Swept Mist / Prismatic particles
      if (
        animationId === 'droplet-cascade' ||
        animationId === 'condensation-reveal' ||
        animationId === 'wind-swept-mist'
      ) {
        const isIntro = elapsed < 2.9;
        const activeCount =
          animationId === 'droplet-cascade' ? (isIntro ? 18 : 6) : 12;

        for (let i = 0; i < activeCount; i++) {
          const d = drops[i];
          if (!d.sliding) {
            d.y += (animationId === 'wind-swept-mist' ? d.vy * 1.4 : d.vy) * dt;
            if (animationId === 'wind-swept-mist') {
              d.x += 55 * dt;
            }
            // Land on letter band (~36% to 62% height)
            if (d.y > h * 0.34 && d.y < h * 0.64 && Math.random() < 0.08) {
              d.sliding = true;
              d.slideTimer = 0.8 + Math.random() * 0.6;
              ripples.push({ x: d.x, y: d.y, r: 1.5, life: 0 });
            }
          } else {
            d.y += 18 * dt;
            d.slideTimer -= dt;
            d.trail.push({ x: d.x, y: d.y });
            if (d.trail.length > 10) d.trail.shift();
            if (d.slideTimer <= 0) {
              d.sliding = false;
            }
          }

          if (d.y > h + 10 || d.x > w + 10) {
            d.y = -12 - Math.random() * 30;
            d.x = 20 + Math.random() * (w - 40);
            d.sliding = false;
            d.trail = [];
          }

          // Glowing trail
          if (d.trail.length > 1) {
            ctx.strokeStyle = accent.drop.replace('0.9', '0.32');
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(d.trail[0].x, d.trail[0].y);
            for (let t = 1; t < d.trail.length; t++) {
              ctx.lineTo(d.trail[t].x, d.trail[t].y);
            }
            ctx.stroke();
          }

          // Droplet bead / streak
          ctx.fillStyle = accent.drop;
          if (animationId === 'wind-swept-mist') {
            ctx.strokeStyle = accent.drop;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - 6, d.y - 9);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.sliding ? 2.1 : 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (animationId === 'rippling-reflection' || animationId === 'puddle-bloom') {
        if (Math.random() < 0.14) {
          ripples.push({
            x: 35 + Math.random() * (w - 70),
            y: h * (animationId === 'rippling-reflection' ? 0.78 : 0.5),
            r: 2,
            life: 0,
          });
        }
      } else if (animationId === 'prismatic-shower') {
        for (let b = 0; b < 7; b++) {
          const bx = ((elapsed * 22 + b * 48) % (w + 40)) - 20;
          const by = h * 0.45 + Math.sin(elapsed * 1.5 + b) * 16;
          ctx.fillStyle = `hsla(${(b * 48 + elapsed * 30) % 360}, 90%, 76%, 0.28)`;
          ctx.beginPath();
          ctx.arc(bx, by, 5 + (b % 3) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.life += dt;
        rp.r += 24 * dt;
        if (rp.life > 0.75) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = accent.drop.replace('0.9', String((1 - rp.life / 0.75) * 0.55));
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [animationId, accent.drop, replayKey, reducedMotion, variant]);

  const isPreview = variant === 'preview';

  const getMotionProps = () => {
    if (reducedMotion) {
      return { initial: { opacity: 1 }, animate: { opacity: 1 } };
    }
    switch (animationId) {
      case 'puddle-bloom':
        return {
          initial: { opacity: 0, scale: 0.84, filter: 'blur(8px)' },
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const },
        };
      case 'condensation-reveal':
        return {
          initial: { opacity: 0.15, filter: 'blur(14px)' },
          animate: { opacity: 1, filter: 'blur(0px)' },
          transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] as const },
        };
      case 'lightning-flash':
        return {
          initial: { opacity: 0.4 },
          animate: { opacity: [0.55, 1, 0.45, 1, 0.95] },
          transition: { duration: 2.2, repeat: Infinity, repeatDelay: 2.4 },
        };
      case 'neon-wet-glass':
        return {
          initial: { opacity: 0.7 },
          animate: { opacity: [0.85, 1, 0.72, 1, 0.94] },
          transition: { duration: 3.2, repeat: Infinity },
        };
      case 'wind-swept-mist':
        return {
          initial: { opacity: 0, x: -16 },
          animate: { opacity: 1, x: [0, 3, 0] },
          transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'droplet-cascade':
      default:
        return {
          initial: { opacity: 0, y: 8, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const },
        };
    }
  };

  const motionProps = getMotionProps();

  return (
    <div
      key={`${animationId}-${replayKey}`}
      className={`relative inline-flex flex-col items-start select-none ${
        isPreview ? 'items-center text-center' : ''
      }`}
    >
      {/* Main Glossy Letter Lockup + Overlaid Droplet Canvas */}
      <div className="relative inline-flex items-baseline gap-2.5">
        <motion.div
          {...motionProps}
          className="relative z-10 inline-flex items-baseline gap-2.5"
          style={{ textShadow: accent.glow }}
        >
          <span
            className={`font-display font-semibold tracking-tight wet-glass-sheen bg-clip-text text-transparent ${
              isPreview ? 'text-3xl' : 'text-4xl sm:text-5xl'
            }`}
            style={{
              backgroundImage:
                animationId === 'prismatic-shower'
                  ? 'linear-gradient(110deg, #ffffff 10%, #bae6fd 35%, #f9a8d4 55%, #fde68a 75%, #ffffff 95%)'
                  : `linear-gradient(110deg, rgba(255,255,255,0.96) 20%, ${accent.textTint} 48%, rgba(255,255,255,0.98) 75%)`,
            }}
          >
            Rain
          </span>
          <span
            className={`font-bengali font-medium wet-glass-sheen bg-clip-text text-transparent ${
              isPreview ? 'text-2xl' : 'text-3xl sm:text-4xl'
            }`}
            style={{
              backgroundImage:
                animationId === 'prismatic-shower'
                  ? 'linear-gradient(110deg, #e0f2fe 15%, #fbcfe8 50%, #fde68a 85%)'
                  : `linear-gradient(110deg, ${accent.textTint} 15%, #ffffff 50%, ${accent.textTint} 85%)`,
            }}
          >
            বৃষ্টি
          </span>
        </motion.div>

        {/* Soft Wet Reflection Beneath */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 right-0 -bottom-4 flex items-baseline gap-2.5 scale-y-[-0.48] opacity-25 blur-[1px] mask-b-from-0% ${
            isPreview ? 'justify-center' : ''
          }`}
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <span className={`font-display font-semibold text-white ${isPreview ? 'text-3xl' : 'text-4xl sm:text-5xl'}`}>
            Rain
          </span>
          <span className={`font-bengali font-medium ${isPreview ? 'text-2xl' : 'text-3xl sm:text-4xl'}`} style={{ color: accent.textTint }}>
            বৃষ্টি
          </span>
        </div>

        {/* Canvas Droplet / Ripple / Bokeh Overlay */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-6 -inset-y-4 w-[calc(100%+3rem)] h-[calc(100%+2rem)] z-20"
        />
      </div>

      {/* Glassy Fading Tagline */}
      {showTagline && (
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 0.88, y: 0 }}
          transition={{ duration: 1.0, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-xs sm:text-sm font-light tracking-widest text-sky-100/85"
        >
          Feel every drop.
        </motion.p>
      )}
    </div>
  );
};
