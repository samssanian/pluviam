import React from 'react';
import {
  CloudRain,
  Compass,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Shuffle,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from 'lucide-react';
import { TIME_MODE_ORDER, TIME_MODES } from '../data/timeModes';
import { TimeMode } from '../types/rain';

interface ControlDockProps {
  timeMode: TimeMode;
  onTimeModeChange: (mode: TimeMode) => void;
  intensity: number;
  onIntensityChange: (val: number) => void;
  wind: number;
  onWindChange: (val: number) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRandomize: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hudHidden: boolean;
  onToggleHud: () => void;
  activeDrawer: 'none' | 'rain' | 'location';
  onToggleDrawer: (drawer: 'rain' | 'location') => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  timeMode,
  onTimeModeChange,
  intensity,
  onIntensityChange,
  wind,
  onWindChange,
  isSoundOn,
  onToggleSound,
  isPlaying,
  onTogglePlay,
  onRandomize,
  isFullscreen,
  onToggleFullscreen,
  hudHidden,
  onToggleHud,
  activeDrawer,
  onToggleDrawer,
}) => {
  const windKmh = Math.round(wind * 65);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pointer-events-auto">
      <div className="glass-panel glass-noise rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 transition-all duration-300">
        {/* Left: Quick Stage Pickers + Time Mode Segmented Control */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleDrawer('rain')}
              aria-expanded={activeDrawer === 'rain'}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                activeDrawer === 'rain'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/18'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Rain Types</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleDrawer('location')}
              aria-expanded={activeDrawer === 'location'}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                activeDrawer === 'location'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/18'
              }`}
            >
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Locations</span>
            </button>
          </div>

          <div className="h-5 w-px bg-white/15 hidden sm:block" aria-hidden="true" />

          {/* Time Mode Segmented Control */}
          <div
            role="group"
            aria-label="Time of day"
            className="flex items-center gap-1 p-1 rounded-xl bg-black/25 border border-white/10"
          >
            {TIME_MODE_ORDER.map((mode) => {
              const active = timeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onTimeModeChange(mode)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[34px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                    active
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-200/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {TIME_MODES[mode].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Labeled Intensity & Wind Sliders */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 flex-1 lg:max-w-md">
          <label className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200/85 font-medium">Intensity</span>
              <span className="font-mono-tabular text-white">{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={1.5}
              step={0.05}
              value={intensity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              aria-label="Rain intensity"
              className="glass-slider w-full"
            />
          </label>

          <label className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200/85 font-medium">Wind</span>
              <span className="font-mono-tabular text-white">
                {windKmh > 0 ? `+${windKmh}` : windKmh} km/h
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={wind}
              onChange={(e) => onWindChange(parseFloat(e.target.value))}
              aria-label="Wind speed and direction"
              className="glass-slider w-full"
            />
          </label>
        </div>

        {/* Right: Sound, Play/Pause, Randomize, HUD, Fullscreen */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={isSoundOn ? 'Mute rain audio' : 'Enable rain audio'}
            aria-pressed={isSoundOn}
            title={isSoundOn ? 'Mute sound (M)' : 'Enable sound (M)'}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
              isSoundOn
                ? 'bg-sky-400/25 text-sky-200 border border-sky-300/40'
                : 'bg-white/10 text-slate-200 hover:bg-white/18'
            }`}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onRandomize}
            aria-label="Randomize rain, location, and time"
            title="Randomize scene (R)"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleHud}
            aria-label={hudHidden ? 'Show scene overlay' : 'Hide scene overlay'}
            title={hudHidden ? 'Show HUD (H)' : 'Hide HUD (H)'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {hudHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
