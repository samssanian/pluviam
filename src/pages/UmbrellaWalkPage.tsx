import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Shuffle,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import {
  UMBRELLA_LOCATIONS,
  UMBRELLA_LOCATION_MAP,
  UMBRELLA_PALETTES,
} from '../data/umbrellaLocations';
import { TIME_MODES, TIME_MODE_ORDER } from '../data/timeModes';
import { TimeMode } from '../types/rain';
import { audioEngine } from '../utils/audioEngine';
import { UmbrellaWalkCanvas } from '../components/UmbrellaWalkCanvas';
import { UmbrellaPreviewCard } from '../components/UmbrellaPreviewCard';
import { EndingSection } from '../components/EndingSection';
import { BrandLogo } from '../components/BrandLogo';
import { RandomRainControls } from '../components/RandomRainControls';
import { LogoAnimationId } from '../data/logoAnimations';

interface UmbrellaWalkPageProps {
  onNavigateHome: () => void;
  onOpenLogoLab: () => void;
  logoAnimId: LogoAnimationId;
  onTriggerRandom: (origin?: { x: number; y: number }) => void;
  autoRandom: boolean;
  onToggleAutoRandom: () => void;
  reducedMotion: boolean;
}

type LocCat = 'all' | 'historic' | 'urban' | 'nature' | 'transit';

const LOC_CATEGORIES: { id: LocCat; label: string }[] = [
  { id: 'all', label: 'All (22)' },
  { id: 'historic', label: 'Historic' },
  { id: 'urban', label: 'Urban' },
  { id: 'nature', label: 'Nature' },
  { id: 'transit', label: 'Transit' },
];

export default function UmbrellaWalkPage({
  onNavigateHome,
  onOpenLogoLab,
  logoAnimId,
  onTriggerRandom,
  autoRandom,
  onToggleAutoRandom,
  reducedMotion,
}: UmbrellaWalkPageProps) {
  const stageRef = useRef<HTMLElement | null>(null);

  const [selectedLocId, setSelectedLocId] = useState<string>('japanese-alley');
  const [timeMode, setTimeMode] = useState<TimeMode>('afternoon');
  const [paletteId, setPaletteId] = useState<string>('vibrant');
  const [intensity, setIntensity] = useState<number>(0.8);
  const [wind, setWind] = useState<number>(0.18);
  const [gustTrigger, setGustTrigger] = useState<number>(0);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [catFilter, setCatFilter] = useState<LocCat>('all');

  const activeLocation = UMBRELLA_LOCATION_MAP[selectedLocId] || UMBRELLA_LOCATIONS[0];
  const activeTimePalette = TIME_MODES[timeMode];
  const activeUmbrellaPalette =
    UMBRELLA_PALETTES.find((p) => p.id === paletteId) || UMBRELLA_PALETTES[0];

  // Sync audio
  useEffect(() => {
    audioEngine.update('steady-rain', intensity, wind, isPlaying);
  }, [intensity, wind, isPlaying]);

  useEffect(() => {
    return () => {
      audioEngine.setEnabled(false);
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    setIsSoundOn((prev) => {
      const next = !prev;
      audioEngine.setEnabled(next);
      return next;
    });
  }, []);

  const handleRandomize = useCallback(() => {
    const loc = UMBRELLA_LOCATIONS[Math.floor(Math.random() * UMBRELLA_LOCATIONS.length)];
    const tm = TIME_MODE_ORDER[Math.floor(Math.random() * TIME_MODE_ORDER.length)];
    const pal = UMBRELLA_PALETTES[Math.floor(Math.random() * UMBRELLA_PALETTES.length)];
    setSelectedLocId(loc.id);
    setTimeMode(tm);
    setPaletteId(pal.id);
    setWind(Number(((Math.random() - 0.35) * 0.85).toFixed(2)));
    setIntensity(Number((0.55 + Math.random() * 0.65).toFixed(2)));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const target = stageRef.current || document.documentElement;
      target.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const filteredLocations = useMemo(
    () =>
      catFilter === 'all'
        ? UMBRELLA_LOCATIONS
        : UMBRELLA_LOCATIONS.filter((l) => l.category === catFilter),
    [catFilter]
  );

  const handleSelectLocFromGrid = (id: string) => {
    setSelectedLocId(id);
    stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Glass Navigation Bar (Strict 3-Zone Contract) */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4 pointer-events-none">
        <div className="max-w-7xl mx-auto glass-panel-subtle rounded-2xl px-6 py-3 flex items-center justify-between gap-8 pointer-events-auto">
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Back to Rain বৃষ্টি home"
            className="inline-flex items-center px-3 py-1 rounded-xl bg-white/8 border border-white/15 hover:bg-white/14 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <BrandLogo animationId={logoAnimId} timeMode={timeMode} variant="nav" />
          </button>

          <nav aria-label="Umbrella Walk sections" className="hidden md:flex items-center gap-7 text-sm font-normal text-slate-200/85">
            <a href="#walk-stage" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Walk Stage
            </a>
            <a href="#walk-locations" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Locations
            </a>
            <a href="#credits" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Credits
            </a>
            <button
              type="button"
              onClick={onOpenLogoLab}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Logo Lab
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/12 text-white hover:bg-white/20 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Calm Rain</span>
            </button>

            <RandomRainControls
              onTriggerRandom={onTriggerRandom}
              autoRandom={autoRandom}
              onToggleAutoRandom={onToggleAutoRandom}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      </header>

      {/* Full-Screen Living Umbrella Walk Stage (100vh) */}
      <section
        id="walk-stage"
        ref={stageRef}
        aria-label="Interactive umbrella walk stage"
        className="relative w-full h-screen min-h-[640px] overflow-hidden select-none"
      >
        <UmbrellaWalkCanvas
          location={activeLocation}
          timePalette={activeTimePalette}
          umbrellaPalette={activeUmbrellaPalette}
          intensity={intensity}
          wind={wind}
          gustTrigger={gustTrigger}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
        />

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-slate-950/82 via-slate-950/35 to-transparent pointer-events-none"
        />

        {/* Editorial Overlay */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 bottom-44 sm:bottom-36 z-20 px-6 pointer-events-none"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-sky-100/85 tracking-wide mb-2">
              <span>Umbrella Walk</span>
              <span aria-hidden="true">·</span>
              <span>{activeLocation.region}</span>
              <span aria-hidden="true">·</span>
              <span>{activeTimePalette.label}</span>
              <span aria-hidden="true">·</span>
              <span>{activeUmbrellaPalette.name}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-white text-balance drop-shadow-sm">
              {activeLocation.name}
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-200/85 max-w-xl">
              {activeLocation.atmosphere}.
            </p>
          </div>
        </motion.div>

        {/* Bottom Glass Control Dock */}
        <div className="absolute inset-x-0 bottom-4 sm:bottom-6 z-30 px-4">
          <div className="max-w-6xl mx-auto glass-panel glass-noise rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
            {/* Time Mode + Umbrella Palette Picker */}
            <div className="flex flex-wrap items-center gap-3">
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
                      onClick={() => setTimeMode(mode)}
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

              {/* Umbrella Palette Swatches */}
              <div role="group" aria-label="Umbrella color palette" className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/20 border border-white/10">
                {UMBRELLA_PALETTES.map((pal) => {
                  const active = pal.id === paletteId;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setPaletteId(pal.id)}
                      title={pal.name}
                      aria-label={`Umbrella palette: ${pal.name}`}
                      aria-pressed={active}
                      className={`w-6 h-6 rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-sky-400 ${
                        active ? 'ring-2 ring-white scale-110' : 'opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: pal.swatch }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 flex-1 lg:max-w-md">
              <label className="flex flex-col gap-1 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200/85 font-medium">Rain</span>
                  <span className="font-mono-tabular text-white">{Math.round(intensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.4}
                  step={0.05}
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  aria-label="Rain intensity"
                  className="glass-slider w-full"
                />
              </label>

              <label className="flex flex-col gap-1 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200/85 font-medium">Wind</span>
                  <span className="font-mono-tabular text-white">
                    {Math.round(wind * 60)} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={wind}
                  onChange={(e) => setWind(parseFloat(e.target.value))}
                  aria-label="Wind speed"
                  className="glass-slider w-full"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setGustTrigger((g) => g + 1)}
                title="Trigger Wind Gust"
                className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Gust</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                aria-label={isSoundOn ? 'Mute audio' : 'Enable audio'}
                aria-pressed={isSoundOn}
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
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleRandomize}
                aria-label="Randomize walk location"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/18 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 22 Locations Selector Grid */}
      <section
        id="walk-locations"
        aria-labelledby="walk-locations-heading"
        className="relative py-24 px-6 bg-slate-950 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs text-sky-300/85 tracking-wide mb-2">Rainy Streets & Lanes</p>
              <h2 id="walk-locations-heading" className="font-display text-3xl sm:text-5xl font-semibold text-white text-balance">
                Twenty-Two Umbrella Walks
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300/80 max-w-2xl">
                Observe commuters rushing, couples beneath shared glass canopies, children splashing in puddles, and umbrellas bending in evening gusts.
              </p>
            </div>

            <div role="tablist" aria-label="Filter umbrella walk locations" className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              {LOC_CATEGORIES.map((cat) => {
                const active = catFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCatFilter(cat.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[38px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                      active
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredLocations.map((loc) => (
              <UmbrellaPreviewCard
                key={loc.id}
                location={loc}
                timePalette={activeTimePalette}
                umbrellaPalette={activeUmbrellaPalette}
                isSelected={loc.id === selectedLocId}
                onSelect={handleSelectLocFromGrid}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pure White Ending Section */}
      <EndingSection reducedMotion={reducedMotion} />
    </div>
  );
}
