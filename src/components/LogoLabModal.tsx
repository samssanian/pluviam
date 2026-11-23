import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, RotateCcw, X } from 'lucide-react';
import { LOGO_ANIMATIONS, LogoAnimationId } from '../data/logoAnimations';
import { TimeMode } from '../types/rain';
import { BrandLogo } from './BrandLogo';

interface LogoLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: LogoAnimationId;
  onSelect: (id: LogoAnimationId) => void;
  timeMode: TimeMode;
  reducedMotion: boolean;
}

export const LogoLabModal: React.FC<LogoLabModalProps> = ({
  isOpen,
  onClose,
  selectedId,
  onSelect,
  timeMode,
  reducedMotion,
}) => {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logo-lab-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel glass-noise rounded-3xl w-full max-w-4xl max-h-[88vh] overflow-y-auto thin-scrollbar p-6 sm:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <h2 id="logo-lab-title" className="font-display text-2xl sm:text-3xl font-semibold text-white">
                  Logo Lab
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300/85">
                  Preview and select the signature animation for Rain বৃষ্টি. Your choice is saved automatically.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Replay All</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Logo Lab"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 8 Animation Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOGO_ANIMATIONS.map((anim) => {
                const active = anim.id === selectedId;
                return (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => {
                      onSelect(anim.id);
                      setReplayKey((k) => k + 1);
                    }}
                    aria-pressed={active}
                    className={`group text-left rounded-2xl p-5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                      active
                        ? 'bg-white/16 ring-2 ring-sky-300/90 shadow-lg shadow-sky-950/50'
                        : 'glass-panel-subtle hover:bg-white/12'
                    }`}
                  >
                    <div className="h-24 flex items-center justify-center rounded-xl bg-slate-950/55 border border-white/10 mb-4 overflow-hidden">
                      <BrandLogo
                        animationId={anim.id}
                        timeMode={timeMode}
                        variant="preview"
                        replayKey={replayKey}
                        reducedMotion={reducedMotion}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{anim.name}</span>
                      {active && (
                        <span className="inline-flex items-center gap-1 text-xs text-sky-200">
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-300/80 leading-relaxed">
                      {anim.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
