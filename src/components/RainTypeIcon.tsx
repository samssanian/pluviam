import React from 'react';
import { motion } from 'motion/react';
import { RainRecipe } from '../types/rain';

interface RainTypeIconProps {
  rain: RainRecipe;
  isActive: boolean;
  reducedMotion: boolean;
}

export const RainTypeIcon: React.FC<RainTypeIconProps> = ({ rain, isActive, reducedMotion }) => {
  const strokeColor = rain.hasNeonGlow
    ? '#38bdf8'
    : rain.hasRainbow
      ? '#f472b6'
      : isActive
        ? '#ffffff'
        : '#bae6fd';

  const duration = Math.max(0.45, 1.35 - rain.speedMin / 1400);

  if (rain.hasRainbow) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M4 16a8 8 0 0 1 16 0" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 16a5.5 5.5 0 0 1 11 0" fill="none" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 16a3 3 0 0 1 6 0" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (rain.lightningFreq > 0.3) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
        <motion.path
          d="M13 3L7 13h5l-1 8 6-10h-5l1-8z"
          fill={isActive ? '#fef08a' : '#bae6fd'}
          animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.45, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </svg>
    );
  }

  if (rain.hasSpiralVortex) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
        <motion.g
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path
            d="M12 4a8 8 0 1 1-7.2 4.5M12 7.5a4.5 4.5 0 1 1-4 2.5"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </motion.g>
      </svg>
    );
  }

  if (rain.hasUmbrella) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path d="M4 13a8 8 0 0 1 16 0H4z" fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 13v6a2 2 0 0 0 4 0" fill="none" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (rain.shape === 'hail' || rain.shape === 'ice' || rain.shape === 'mixed') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
        {[6, 12, 18].map((x, idx) => (
          <motion.circle
            key={x}
            cx={x}
            cy={8}
            r={rain.shape === 'hail' ? 2.1 : 1.6}
            fill={strokeColor}
            animate={reducedMotion ? undefined : { y: [0, 9, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, delay: idx * 0.28, repeat: Infinity }}
          />
        ))}
      </svg>
    );
  }

  if (rain.hasGlassDroplets || rain.shape === 'drip') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
        <motion.path
          d="M12 4C12 4 7 10.5 7 14a5 5 0 0 0 10 0c0-3.5-5-10-5-10z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.6"
          animate={reducedMotion ? undefined : { y: [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    );
  }

  // Dynamic angled rain streaks
  const angleOffset = Math.min(8, rain.angleBias * 0.22);
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      {[7, 12, 17].map((x, idx) => (
        <motion.line
          key={x}
          x1={x + angleOffset * 0.4}
          y1={4}
          x2={x - angleOffset * 0.4}
          y2={13}
          stroke={strokeColor}
          strokeWidth={rain.thickness > 1.7 ? 2 : 1.5}
          strokeLinecap="round"
          animate={reducedMotion ? undefined : { y: [0, 7], opacity: [0.25, 1, 0.15] }}
          transition={{ duration, delay: idx * 0.18, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </svg>
  );
};
