import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RandomRainControlsProps {
  onTriggerRandom: (origin?: { x: number; y: number }) => void;
  autoRandom: boolean;
  onToggleAutoRandom: () => void;
  reducedMotion: boolean;
}

export const RandomRainControls: React.FC<RandomRainControlsProps> = ({
  onTriggerRandom,
  autoRandom,
  onToggleAutoRandom,
  reducedMotion,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onTriggerRandom({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Eye-catching Random Rain Pill Button with Animated Cyan->Violet->Amber Border */}
      <button
        type="button"
        onClick={handleClick}
        title="Random Rain (R)"
        aria-label="Random Rain: pick random rain type, location, time, intensity, and wind (Shortcut R)"
        className="group relative inline-flex items-center p-[1.5px] rounded-full random-gradient-border shadow-[0_0_24px_rgba(56,189,248,0.28)] hover:shadow-[0_0_32px_rgba(168,85,247,0.52)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        <span className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/75 backdrop-blur-xl text-xs sm:text-sm font-medium text-white whitespace-nowrap shrink-0">
          {/* Subtle falling rain droplets inside the button's glass */}
          {!reducedMotion && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute left-[18%] top-0 w-px h-3 bg-gradient-to-b from-transparent via-cyan-300/65 to-transparent animate-micro-drop" />
              <span
                className="absolute left-[52%] top-0 w-px h-3.5 bg-gradient-to-b from-transparent via-violet-300/65 to-transparent animate-micro-drop"
                style={{ animationDelay: '0.45s' }}
              />
              <span
                className="absolute left-[82%] top-0 w-px h-2.5 bg-gradient-to-b from-transparent via-amber-200/65 to-transparent animate-micro-drop"
                style={{ animationDelay: '0.85s' }}
              />
            </span>
          )}

          {/* Tiny hover ripple inside glass */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-radial from-white/15 via-transparent to-transparent transition-opacity duration-300"
          />

          {/* Dice + Droplet Hybrid SVG Icon (gently spins on hover) */}
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="relative z-10 w-4 h-4 text-cyan-200 transition-transform duration-500 ease-out group-hover:rotate-180"
          >
            <path
              d="M12 2.8C12 2.8 6 9.8 6 14.2a6 6 0 0 0 12 0C18 9.8 12 2.8 12 2.8z"
              fill="rgba(56, 189, 248, 0.22)"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="10.2" cy="13.2" r="1" fill="currentColor" />
            <circle cx="13.8" cy="13.2" r="1" fill="currentColor" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>

          <span className="relative z-10">🎲 Random Rain</span>
        </span>
      </button>

      {/* Auto Random Toggle */}
      <button
        type="button"
        onClick={onToggleAutoRandom}
        aria-pressed={autoRandom}
        title="Auto Random every 20 seconds"
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[36px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
          autoRandom
            ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-300/45 shadow-[0_0_16px_rgba(34,211,238,0.28)]'
            : 'glass-panel-subtle text-slate-300 hover:text-white hover:bg-white/15'
        }`}
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${autoRandom && !reducedMotion ? 'animate-spin' : ''}`}
          style={autoRandom && !reducedMotion ? { animationDuration: '6s' } : undefined}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Auto Random</span>
      </button>
    </div>
  );
};
