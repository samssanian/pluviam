import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface RippleTransitionState {
  active: boolean;
  key: number;
  x: number;
  y: number;
}

interface RippleWipeOverlayProps {
  ripple: RippleTransitionState;
  toastText: string | null;
  reducedMotion: boolean;
}

export const RippleWipeOverlay: React.FC<RippleWipeOverlayProps> = ({
  ripple,
  toastText,
  reducedMotion,
}) => {
  return (
    <>
      {/* Full-Screen Glassy Ripple-Wipe Transition */}
      <AnimatePresence>
        {ripple.active && (
          <motion.div
            key={ripple.key}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.45 : 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[80] pointer-events-none overflow-hidden"
          >
            {/* Soft glass blur pulse during scene swap */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ duration: reducedMotion ? 0.45 : 0.72 }}
              className="absolute inset-0 backdrop-blur-md bg-sky-950/15"
            />

            {/* Expanding Water Droplet Ripple Rings from Click Origin */}
            {!reducedMotion && (
              <>
                <motion.div
                  initial={{ scale: 0.05, opacity: 0.9 }}
                  animate={{ scale: 3.4, opacity: 0 }}
                  transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    transformOrigin: 'center center',
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-[90vmax] h-[90vmax] rounded-full border-2 border-cyan-200/75 shadow-[0_0_40px_rgba(56,189,248,0.45)]"
                />
                <motion.div
                  initial={{ scale: 0.02, opacity: 0.7 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    transformOrigin: 'center center',
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-[90vmax] h-[90vmax] rounded-full border border-violet-200/60"
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Random Scene Toast (fades after 3 seconds) */}
      <AnimatePresence>
        {toastText && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-28 sm:bottom-24 inset-x-0 z-[65] flex justify-center px-4 pointer-events-none"
          >
            <div className="glass-panel rounded-full px-5 py-2 text-xs sm:text-sm font-medium text-white shadow-lg shadow-slate-950/50 border border-cyan-300/30">
              {toastText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
