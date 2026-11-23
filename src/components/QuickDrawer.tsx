import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { RAIN_TYPES } from '../data/rainTypes';
import { LOCATIONS } from '../data/locations';
import { RainTypeIcon } from './RainTypeIcon';

interface QuickDrawerProps {
  drawer: 'none' | 'rain' | 'location';
  onClose: () => void;
  selectedRainId: string;
  onSelectRain: (id: string) => void;
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  reducedMotion: boolean;
}

export const QuickDrawer: React.FC<QuickDrawerProps> = ({
  drawer,
  onClose,
  selectedRainId,
  onSelectRain,
  selectedLocationId,
  onSelectLocation,
  reducedMotion,
}) => {
  return (
    <AnimatePresence>
      {drawer !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-6xl mx-auto px-4 mb-3 pointer-events-auto"
        >
          <div className="glass-panel glass-noise rounded-2xl p-4 sm:p-5 max-h-[42vh] overflow-y-auto thin-scrollbar">
            <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-white/10">
              <h2 className="text-sm font-medium text-white">
                {drawer === 'rain' ? 'Select Rain Type (30)' : 'Select Location (26)'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close selector drawer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {drawer === 'rain' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {RAIN_TYPES.map((r) => {
                  const active = r.id === selectedRainId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectRain(r.id)}
                      aria-pressed={active}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                        active
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'bg-white/8 text-slate-100 hover:bg-white/15'
                      }`}
                    >
                      <RainTypeIcon rain={r} isActive={active} reducedMotion={reducedMotion} />
                      <span className="truncate">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {LOCATIONS.map((loc) => {
                  const active = loc.id === selectedLocationId;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => onSelectLocation(loc.id)}
                      aria-pressed={active}
                      className={`px-3 py-2.5 rounded-xl text-left transition-all min-h-[44px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                        active
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'bg-white/8 text-slate-100 hover:bg-white/15'
                      }`}
                    >
                      <div className="text-xs font-medium truncate">{loc.name}</div>
                      <div className={`text-[11px] truncate ${active ? 'text-slate-600' : 'text-slate-300/75'}`}>
                        {loc.region}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
