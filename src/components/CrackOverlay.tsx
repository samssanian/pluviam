import React from 'react';
import { motion } from 'motion/react';

interface CrackOverlayProps {
  crackProgress: number; // 0 to 1
  shattered: boolean;
}

export const CrackOverlay: React.FC<CrackOverlayProps> = ({ crackProgress, shattered }) => {
  if (crackProgress <= 0.02 && !shattered) return null;

  return (
    <svg
      viewBox="0 0 400 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
    >
      <g
        fill="none"
        stroke="rgba(255, 255, 255, 0.78)"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 3px rgba(186, 230, 253, 0.65))' }}
      >
        <motion.path
          d="M 188 86 L 148 54 L 112 62 L 62 24 L 18 10"
          strokeWidth="1.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(1, crackProgress * 1.25) }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d="M 188 86 L 236 48 L 284 56 L 348 16 L 392 4"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(1, crackProgress * 1.2) }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d="M 188 86 L 164 128 L 124 148 L 84 176"
          strokeWidth="1.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0, (crackProgress - 0.15) * 1.3) }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d="M 188 86 L 244 118 L 298 108 L 364 162"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0, (crackProgress - 0.2) * 1.35) }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d="M 148 54 L 138 14 M 236 48 L 252 8 M 244 118 L 258 172"
          strokeWidth="1.1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0, (crackProgress - 0.35) * 1.5) }}
          transition={{ duration: 0.25 }}
        />
      </g>
    </svg>
  );
};
