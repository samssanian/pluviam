import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Cross,
  Dice5,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { RAIN_TYPES, RAIN_TYPE_MAP } from '../data/rainTypes';
import { LOCATIONS, LOCATION_MAP } from '../data/locations';
import { TIME_MODES, TIME_MODE_ORDER } from '../data/timeModes';
import { DISASTER_SCENES, DisasterCategory, DisasterScene } from '../data/disasterScenes';
import { TimeMode } from '../types/rain';
import { LogoAnimationId } from '../data/logoAnimations';
import {
  PopulationDensity,
  runImpactSimulation,
  SanitationLevel,
  SimulationInputs,
  SimulationResults,
  TerrainType,
  TimelineKeyframe,
} from '../utils/impactEngine';
import { impactAudioEngine } from '../utils/impactAudioEngine';
import { BrandLogo } from '../components/BrandLogo';
import { RandomRainControls } from '../components/RandomRainControls';
import { ImpactStageCanvas } from '../components/ImpactStageCanvas';
import { DisasterSceneCard } from '../components/DisasterSceneCard';
import { ImpactStatDashboard } from '../components/ImpactStatDashboard';
import { EndingSection } from '../components/EndingSection';

interface ImpactSimulatorPageProps {
  onNavigateHome: () => void;
  onOpenLogoLab: () => void;
  logoAnimId: LogoAnimationId;
  onTriggerRandom: (origin?: { x: number; y: number }) => void;
  autoRandom: boolean;
  onToggleAutoRandom: () => void;
  reducedMotion: boolean;
}

const TERRAINS: TerrainType[] = [
  'Plains',
  'Hills',
  'Coastal',
  'River delta',
  'Urban',
  'Forest',
  'Desert oasis',
  'Mountain valley',
];

const POP_DENSITIES: PopulationDensity[] = ['Rural', 'Town', 'City', 'Megacity'];
const SANITATION_LEVELS: SanitationLevel[] = ['Good', 'Average', 'Poor'];

const SCENE_FILTERS: { id: 'all' | DisasterCategory; label: string }[] = [
  { id: 'all', label: 'All (65)' },
  { id: 'flood', label: 'Flood (14)' },
  { id: 'infrastructure', label: 'Infrastructure (11)' },
  { id: 'hazard', label: 'Gas & Fire (6)' },
  { id: 'health', label: 'Health & Disease (17)' },
  { id: 'human', label: 'Human & Animals (17)' },
];

const DEFAULT_INPUTS: SimulationInputs = {
  durationHours: 72,
  timeMode: 'night',
  startHour: 20,
  rainId: 'monsoon-downpour',
  intensity: 82,
  wind: 58,
  locationId: 'coastal-pier',
  terrain: 'Coastal',
  populationDensity: 'City',
  sanitation: 'Average',
};

function formatDurationLabel(hours: number, unit: 'hours' | 'days'): string {
  if (unit === 'hours') return `${hours} hr${hours === 1 ? '' : 's'}`;
  const days = Math.max(1, Math.round(hours / 24));
  return `${days} day${days === 1 ? '' : 's'}`;
}

export default function ImpactSimulatorPage({
  onNavigateHome,
  onOpenLogoLab,
  logoAnimId,
  onTriggerRandom,
  autoRandom,
  onToggleAutoRandom,
  reducedMotion,
}: ImpactSimulatorPageProps) {
  const stageRef = useRef<HTMLElement | null>(null);

  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('days');
  const [results, setResults] = useState<SimulationResults>(() => runImpactSimulation(DEFAULT_INPUTS));
  const [runKey, setRunKey] = useState<number>(1);

  const [activeKeyframeIdx, setActiveKeyframeIdx] = useState<number>(0);
  const [customPreviewScene, setCustomPreviewScene] = useState<DisasterScene | null>(null);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [sceneFilter, setSceneFilter] = useState<'all' | DisasterCategory>('all');

  const activeRain = RAIN_TYPE_MAP[inputs.rainId] || RAIN_TYPES[0];
  const activeLocation = LOCATION_MAP[inputs.locationId] || LOCATIONS[0];
  const activePalette = TIME_MODES[inputs.timeMode];

  const activeKeyframe: TimelineKeyframe =
    results.timeline[activeKeyframeIdx] || results.timeline[0];
  const activeScene: DisasterScene = customPreviewScene || activeKeyframe.scene;

  // Auto-advance timeline scenes every 4.2s when playing
  useEffect(() => {
    if (!isTimelinePlaying || reducedMotion || customPreviewScene) return;
    const timer = window.setInterval(() => {
      setActiveKeyframeIdx((prev) => (prev + 1) % results.timeline.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isTimelinePlaying, reducedMotion, customPreviewScene, results.timeline.length]);

  // Sync procedural disaster soundscape
  useEffect(() => {
    impactAudioEngine.updateScene(
      activeScene,
      inputs.intensity / 100,
      inputs.wind / 100,
      isTimelinePlaying
    );
  }, [activeScene, inputs.intensity, inputs.wind, isTimelinePlaying]);

  useEffect(() => {
    return () => {
      impactAudioEngine.setEnabled(false);
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    setIsSoundOn((prev) => {
      const next = !prev;
      impactAudioEngine.setEnabled(next);
      return next;
    });
  }, []);

  const handleRunSimulation = useCallback(
    (nextInputs: SimulationInputs = inputs) => {
      const computed = runImpactSimulation(nextInputs);
      setResults(computed);
      setRunKey((k) => k + 1);
      setCustomPreviewScene(null);
      setActiveKeyframeIdx(0);
      setIsTimelinePlaying(true);
    },
    [inputs]
  );

  const handleRandomDisaster = useCallback(() => {
    const randomRain = RAIN_TYPES[Math.floor(Math.random() * RAIN_TYPES.length)];
    const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const randomTerrain = TERRAINS[Math.floor(Math.random() * TERRAINS.length)];
    const randomTime = TIME_MODE_ORDER[Math.floor(Math.random() * TIME_MODE_ORDER.length)];
    const randomPop = POP_DENSITIES[Math.floor(Math.random() * POP_DENSITIES.length)];
    const randomSan = SANITATION_LEVELS[Math.floor(Math.random() * SANITATION_LEVELS.length)];
    const randomHours = [12, 24, 48, 72, 120, 168, 240, 360, 504, 720][
      Math.floor(Math.random() * 10)
    ];

    const nextInputs: SimulationInputs = {
      durationHours: randomHours,
      timeMode: randomTime,
      startHour: Math.floor(Math.random() * 24),
      rainId: randomRain.id,
      intensity: 45 + Math.floor(Math.random() * 55),
      wind: 25 + Math.floor(Math.random() * 75),
      locationId: randomLoc.id,
      terrain: randomTerrain,
      populationDensity: randomPop,
      sanitation: randomSan,
    };

    const computed = runImpactSimulation(nextInputs);

    // Guarantee 5 diverse random scenes: at least 1 flood, 1 infra/hazard, 1 health, 1 human
    const floodPool = DISASTER_SCENES.filter((s) => s.category === 'flood');
    const infraPool = DISASTER_SCENES.filter(
      (s) => s.category === 'infrastructure' || s.category === 'hazard'
    );
    const healthPool = DISASTER_SCENES.filter((s) => s.category === 'health');
    const humanPool = DISASTER_SCENES.filter((s) => s.category === 'human');

    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const randomScenes: DisasterScene[] = [
      pick(floodPool),
      pick(infraPool),
      pick(healthPool),
      pick(humanPool),
      pick([...floodPool, ...healthPool, ...humanPool]),
    ];

    const customTimeline: TimelineKeyframe[] = randomScenes.map((scene, i) => {
      const progress = i / (randomScenes.length - 1);
      const totalH = Math.floor(nextInputs.startHour + progress * nextInputs.durationHours);
      const day = Math.floor(totalH / 24) + 1;
      const hr = totalH % 24;
      return {
        index: i,
        label: `Day ${day} · ${String(hr).padStart(2, '0')}:00`,
        progress,
        scene,
      };
    });

    setInputs(nextInputs);
    setDurationUnit(randomHours >= 24 ? 'days' : 'hours');
    setResults({ ...computed, timeline: customTimeline });
    setRunKey((k) => k + 1);
    setCustomPreviewScene(null);
    setActiveKeyframeIdx(0);
    setIsTimelinePlaying(true);
  }, []);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setDurationUnit('days');
    setResults(runImpactSimulation(DEFAULT_INPUTS));
    setRunKey((k) => k + 1);
    setCustomPreviewScene(null);
    setActiveKeyframeIdx(0);
    setIsTimelinePlaying(true);
  }, []);

  const handleReplayTimeline = useCallback(() => {
    setCustomPreviewScene(null);
    setActiveKeyframeIdx(0);
    setIsTimelinePlaying(true);
    stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  const handleSelectSceneFromGrid = useCallback(
    (scene: DisasterScene) => {
      setCustomPreviewScene(scene);
      setIsTimelinePlaying(true);
      stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion]
  );

  const filteredScenes = useMemo(
    () =>
      sceneFilter === 'all'
        ? DISASTER_SCENES
        : DISASTER_SCENES.filter((s) => s.category === sceneFilter),
    [sceneFilter]
  );

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ '--mode-accent': activePalette.accentHex } as React.CSSProperties}
    >
      {/* Top Glass Nav Bar */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4 pointer-events-none">
        <div className="max-w-7xl mx-auto glass-panel-subtle rounded-2xl px-5 sm:px-6 py-2.5 flex items-center justify-between gap-6 pointer-events-auto">
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Back to Rain বৃষ্টি home"
            className="inline-flex items-center px-3 py-1 rounded-xl bg-white/8 border border-white/15 hover:bg-white/14 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <BrandLogo animationId={logoAnimId} timeMode={inputs.timeMode} variant="nav" />
          </button>

          <nav
            aria-label="Impact Simulator sections"
            className="hidden md:flex items-center gap-6 text-sm text-slate-200/85"
          >
            <a href="#sim-stage" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Timeline Stage
            </a>
            <a href="#sim-dashboard" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Impact Stats
            </a>
            <a href="#sim-scenes" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              65 Scenes
            </a>
            <a href="#credits" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Credits
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenLogoLab}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium glass-panel-subtle hover:bg-white/18 text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              <span>Logo Lab</span>
            </button>

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

      {/* Main Content Container */}
      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-rose-300/90 tracking-wide uppercase font-medium mb-1.5">
              Disaster & Public Health Preparedness Model
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white tracking-tight">
              Rain Impact Simulator
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300/80 max-w-2xl">
              Configure storm duration, rain recipe, terrain, and sanitation conditions to simulate flood depth, infrastructure strain, and waterborne health outbreaks across 65 animated scenes.
            </p>
          </div>
        </div>

        {/* Sticky Top Configuration Glass Panel */}
        <section
          aria-label="Simulation condition controls"
          className="sticky top-20 z-30 glass-panel rounded-3xl p-4 sm:p-5 shadow-2xl shadow-slate-950/80 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Duration Slider + Hour/Day Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Duration</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tabular text-sky-300 font-semibold">
                    {formatDurationLabel(inputs.durationHours, durationUnit)}
                  </span>
                  <div className="inline-flex rounded-lg bg-white/8 p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setDurationUnit('hours');
                        if (inputs.durationHours > 24) {
                          setInputs((p) => ({ ...p, durationHours: 12 }));
                        }
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        durationUnit === 'hours' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Hr
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationUnit('days');
                        if (inputs.durationHours < 24) {
                          setInputs((p) => ({ ...p, durationHours: 72 }));
                        }
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        durationUnit === 'days' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Day
                    </button>
                  </div>
                </div>
              </div>
              {durationUnit === 'hours' ? (
                <input
                  type="range"
                  aria-label="Rain duration in hours"
                  min={1}
                  max={24}
                  value={Math.min(24, inputs.durationHours)}
                  onChange={(e) => setInputs((p) => ({ ...p, durationHours: Number(e.target.value) }))}
                  className="w-full accent-sky-400"
                />
              ) : (
                <input
                  type="range"
                  aria-label="Rain duration in days"
                  min={1}
                  max={30}
                  value={Math.max(1, Math.round(inputs.durationHours / 24))}
                  onChange={(e) => setInputs((p) => ({ ...p, durationHours: Number(e.target.value) * 24 }))}
                  className="w-full accent-sky-400"
                />
              )}
            </div>

            {/* Time Mode Segmented + Start Clock */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Start Time</span>
                <label className="inline-flex items-center gap-1.5 text-slate-300">
                  <span>Starts at</span>
                  <select
                    aria-label="Starting clock hour"
                    value={inputs.startHour}
                    onChange={(e) => setInputs((p) => ({ ...p, startHour: Number(e.target.value) }))}
                    className="bg-slate-900/90 border border-white/15 rounded-lg px-1.5 py-0.5 text-[11px] font-mono-tabular text-white"
                  >
                    {Array.from({ length: 24 }, (_, hr) => (
                      <option key={hr} value={hr}>
                        {String(hr).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/6 border border-white/10">
                {TIME_MODE_ORDER.map((mode: TimeMode) => {
                  const active = inputs.timeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setInputs((p) => ({ ...p, timeMode: mode }))}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                        active ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {TIME_MODES[mode].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rain Type Dropdown (All 30) */}
            <div className="space-y-1.5">
              <label htmlFor="sim-rain-select" className="block text-xs text-slate-300 font-medium">
                Rain Type ({RAIN_TYPES.length})
              </label>
              <select
                id="sim-rain-select"
                value={inputs.rainId}
                onChange={(e) => setInputs((p) => ({ ...p, rainId: e.target.value }))}
                className="w-full h-9 rounded-xl bg-slate-900/90 border border-white/15 px-3 text-xs text-white focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                {RAIN_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Dropdown (All 26) */}
            <div className="space-y-1.5">
              <label htmlFor="sim-location-select" className="block text-xs text-slate-300 font-medium">
                Location ({LOCATIONS.length})
              </label>
              <select
                id="sim-location-select"
                value={inputs.locationId}
                onChange={(e) => setInputs((p) => ({ ...p, locationId: e.target.value }))}
                className="w-full h-9 rounded-xl bg-slate-900/90 border border-white/15 px-3 text-xs text-white focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Intensity, Wind, Terrain, Population, Sanitation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Intensity</span>
                <span className="font-mono-tabular text-sky-300">{inputs.intensity}%</span>
              </div>
              <input
                type="range"
                aria-label="Rain intensity"
                min={0}
                max={100}
                value={inputs.intensity}
                onChange={(e) => setInputs((p) => ({ ...p, intensity: Number(e.target.value) }))}
                className="w-full accent-sky-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Wind Speed</span>
                <span className="font-mono-tabular text-sky-300">{inputs.wind}%</span>
              </div>
              <input
                type="range"
                aria-label="Wind speed"
                min={0}
                max={100}
                value={inputs.wind}
                onChange={(e) => setInputs((p) => ({ ...p, wind: Number(e.target.value) }))}
                className="w-full accent-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sim-terrain-select" className="block text-xs text-slate-300">
                Terrain
              </label>
              <select
                id="sim-terrain-select"
                value={inputs.terrain}
                onChange={(e) => setInputs((p) => ({ ...p, terrain: e.target.value as TerrainType }))}
                className="w-full h-9 rounded-xl bg-slate-900/90 border border-white/15 px-3 text-xs text-white"
              >
                {TERRAINS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="sim-pop-select" className="block text-xs text-slate-300">
                Population Density
              </label>
              <select
                id="sim-pop-select"
                value={inputs.populationDensity}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, populationDensity: e.target.value as PopulationDensity }))
                }
                className="w-full h-9 rounded-xl bg-slate-900/90 border border-white/15 px-3 text-xs text-white"
              >
                {POP_DENSITIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="block text-xs text-slate-300">Sanitation Level</span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/6 border border-white/10">
                {SANITATION_LEVELS.map((lvl) => {
                  const active = inputs.sanitation === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setInputs((p) => ({ ...p, sanitation: lvl }))}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        active
                          ? lvl === 'Poor'
                            ? 'bg-rose-500 text-white'
                            : 'bg-white text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleRunSimulation()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-sky-950/50 whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-white"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Run Simulation</span>
              </button>

              <button
                type="button"
                onClick={handleRandomDisaster}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-rose-500/20 border border-rose-400/45 text-rose-100 hover:bg-rose-500/35 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-rose-400"
              >
                <Dice5 className="w-4 h-4 text-rose-300" aria-hidden="true" />
                <span>🎲 Random Disaster</span>
              </button>

              <button
                type="button"
                onClick={handleReplayTimeline}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium glass-panel-subtle hover:bg-white/15 text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Replay Timeline</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <span>Reset</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              aria-pressed={isSoundOn}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium glass-panel-subtle hover:bg-white/15 text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {isSoundOn ? (
                <>
                  <Volume2 className="w-4 h-4 text-sky-300" aria-hidden="true" />
                  <span>Disaster Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Sound Muted</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Main Cinematic Disaster Stage + Horizontal Timeline Player */}
        <section id="sim-stage" ref={stageRef} aria-label="Simulation timeline stage" className="space-y-4">
          <div className="relative w-full aspect-[16/9] min-h-[320px] max-h-[560px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl shadow-slate-950/90 bg-slate-900">
            <ImpactStageCanvas
              scene={activeScene}
              rain={activeRain}
              location={activeLocation}
              palette={activePalette}
              intensity={inputs.intensity}
              wind={inputs.wind}
              isPlaying={isTimelinePlaying}
              reducedMotion={reducedMotion}
            />

            {/* Scene Metadata Scrim */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent pointer-events-none"
            />

            <div className="absolute top-4 inset-x-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-subtle text-xs font-mono-tabular text-white">
                <span>
                  {customPreviewScene
                    ? `Scene #${String(customPreviewScene.number).padStart(2, '0')} Preview`
                    : activeKeyframe.label}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeLocation.name}</span>
                <span aria-hidden="true">·</span>
                <span>{activeRain.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {activeScene.isHealth && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600/90 text-white shadow">
                    <Cross className="w-3 h-3" aria-hidden="true" />
                    HEALTH ALERT
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium glass-panel-subtle text-white">
                  Severity: {activeScene.severity}
                </span>
              </div>
            </div>

            <div className="absolute bottom-5 inset-x-5 sm:inset-x-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-4xl font-semibold text-white">
                  {activeScene.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-200/85 max-w-2xl">
                  {activeScene.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTimelinePlaying((p) => !p)}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium glass-panel hover:bg-white/18 text-white transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                {isTimelinePlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause Stage</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Play Stage</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Horizontal Glass Timeline Scrubber + Clickable Keyframe Cards */}
          <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-medium text-slate-300">
                Chronological Disaster Progression ({results.timeline.length} Keyframes)
              </div>
              <input
                type="range"
                aria-label="Scrub disaster timeline"
                min={0}
                max={results.timeline.length - 1}
                step={1}
                value={activeKeyframeIdx}
                onChange={(e) => {
                  setCustomPreviewScene(null);
                  setActiveKeyframeIdx(Number(e.target.value));
                }}
                className="w-full sm:w-64 accent-rose-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {results.timeline.map((kf) => (
                <DisasterSceneCard
                  key={`${runKey}-${kf.index}-${kf.scene.id}`}
                  scene={kf.scene}
                  location={activeLocation}
                  palette={activePalette}
                  isSelected={!customPreviewScene && activeKeyframeIdx === kf.index}
                  onSelect={() => {
                    setCustomPreviewScene(null);
                    setActiveKeyframeIdx(kf.index);
                  }}
                  reducedMotion={reducedMotion}
                  timestampLabel={kf.label}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Computed Stat Dashboard */}
        <div id="sim-dashboard">
          <ImpactStatDashboard results={results} runKey={runKey} reducedMotion={reducedMotion} />
        </div>

        {/* All 65 Disaster Scenes Library */}
        <section id="sim-scenes" aria-labelledby="all-scenes-heading" className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-sky-300/85 tracking-wide mb-1">Interactive Scenario Library</p>
              <h2 id="all-scenes-heading" className="font-display text-3xl sm:text-4xl font-semibold text-white">
                All 65 Disaster & Health Scenes
              </h2>
              <p className="mt-1.5 text-sm text-slate-300/80 max-w-2xl">
                Click any animated card below to preview its flood level, electrical/fire hazard, rescue operation, or medical clinic response directly on the main stage.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter disaster scenes by category"
              className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10"
            >
              {SCENE_FILTERS.map((cat) => {
                const active = sceneFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSceneFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors min-h-[36px] ${
                      active ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredScenes.map((scene) => (
              <DisasterSceneCard
                key={scene.id}
                scene={scene}
                location={activeLocation}
                palette={activePalette}
                isSelected={activeScene.id === scene.id}
                onSelect={handleSelectSceneFromGrid}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Pure White Rainy-Cloud Ending Section ("made by sams Sanian") */}
      <EndingSection reducedMotion={reducedMotion} />
    </div>
  );
}
