import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RAIN_TYPES, RAIN_TYPE_MAP } from './data/rainTypes';
import { LOCATIONS, LOCATION_MAP } from './data/locations';
import { TIME_MODES, TIME_MODE_ORDER } from './data/timeModes';
import { LocationCategory, RainCategory, TimeMode } from './types/rain';
import { audioEngine } from './utils/audioEngine';
import { RainCanvas } from './components/RainCanvas';
import { ControlDock } from './components/ControlDock';
import { QuickDrawer } from './components/QuickDrawer';
import { RainTypeIcon } from './components/RainTypeIcon';
import { ScenePreviewCard } from './components/ScenePreviewCard';
import { EndingSection } from './components/EndingSection';

import { AlertTriangle, Sparkles, Umbrella } from 'lucide-react';
import {
  getSavedLogoAnimation,
  LogoAnimationId,
  saveLogoAnimation,
} from './data/logoAnimations';
import { BrandLogo } from './components/BrandLogo';
import { LogoLabModal } from './components/LogoLabModal';
import { RandomRainControls } from './components/RandomRainControls';
import { RippleTransitionState, RippleWipeOverlay } from './components/RippleWipeOverlay';
import { ImpactPreviewButton } from './components/ImpactPreviewButton';

const StormBreakPage = React.lazy(() => import('./pages/StormBreakPage'));
const UmbrellaWalkPage = React.lazy(() => import('./pages/UmbrellaWalkPage'));
const ImpactSimulatorPage = React.lazy(() => import('./pages/ImpactSimulatorPage'));
const AUTO_RANDOM_STORAGE_KEY = 'rain_bristi_auto_random';

const RAIN_CATEGORIES: { id: RainCategory; label: string }[] = [
  { id: 'all', label: 'All (30)' },
  { id: 'natural', label: 'Natural' },
  { id: 'storm', label: 'Storm' },
  { id: 'atmospheric', label: 'Atmospheric' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'stylized', label: 'Stylized' },
];

const LOCATION_CATEGORIES: { id: LocationCategory; label: string }[] = [
  { id: 'all', label: 'All (26)' },
  { id: 'forest', label: 'Forest' },
  { id: 'urban', label: 'Urban' },
  { id: 'water', label: 'Water & Coast' },
  { id: 'tranquil', label: 'Tranquil' },
];

export default function App() {
  const stageRef = useRef<HTMLElement | null>(null);

  const [route, setRoute] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const [selectedRainId, setSelectedRainId] = useState<string>('moderate-rain');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('japanese-alley');
  const [timeMode, setTimeMode] = useState<TimeMode>('night');
  const [intensity, setIntensity] = useState<number>(0.85);
  const [wind, setWind] = useState<number>(0.15);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hudHidden, setHudHidden] = useState<boolean>(false);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'rain' | 'location'>('none');

  const [rainFilter, setRainFilter] = useState<RainCategory>('all');
  const [locationFilter, setLocationFilter] = useState<LocationCategory>('all');
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const [logoAnimId, setLogoAnimId] = useState<LogoAnimationId>(() => getSavedLogoAnimation());
  const [logoLabOpen, setLogoLabOpen] = useState<boolean>(false);
  const [logoReplayKey, setLogoReplayKey] = useState<number>(0);

  // Auto Random state (persisted, off by default if prefers-reduced-motion)
  const [autoRandom, setAutoRandom] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
      return localStorage.getItem(AUTO_RANDOM_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Ripple-wipe transition & 3s bottom toast state
  const [rippleState, setRippleState] = useState<RippleTransitionState>({
    active: false,
    key: 0,
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 600,
    y: 44,
  });
  const [randomToast, setRandomToast] = useState<string | null>(null);
  const [uiPulseKey, setUiPulseKey] = useState<number>(0);

  // Smart Random history & transition queue refs
  const recentTimeModesRef = useRef<TimeMode[]>(['night']);
  const lastComboRef = useRef<{ rainId: string; locationId: string; timeMode: TimeMode }>({
    rainId: 'moderate-rain',
    locationId: 'japanese-alley',
    timeMode: 'night',
  });
  const isTransitioningRef = useRef<boolean>(false);
  const pendingQueueRef = useRef<{ x: number; y: number }[]>([]);
  const toastTimerRef = useRef<number | null>(null);

  const handleSelectLogoAnim = useCallback((id: LogoAnimationId) => {
    setLogoAnimId(id);
    saveLogoAnimation(id);
    setLogoReplayKey((k) => k + 1);
  }, []);

  const handleToggleAutoRandom = useCallback(() => {
    setAutoRandom((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_RANDOM_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const activeRain = RAIN_TYPE_MAP[selectedRainId] || RAIN_TYPES[0];
  const activeLocation = LOCATION_MAP[selectedLocationId] || LOCATIONS[0];
  const activePalette = TIME_MODES[timeMode];

  const navigateTo = useCallback((path: string) => {
    if (path !== '/') {
      audioEngine.setEnabled(false);
      setIsSoundOn(false);
    }
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setAutoRandom(false);
    }
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) setAutoRandom(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync Web Audio procedural soundscape
  useEffect(() => {
    audioEngine.update(activeRain.soundProfile, intensity, wind, isPlaying);
  }, [activeRain.soundProfile, intensity, wind, isPlaying]);

  const handleToggleSound = useCallback(() => {
    setIsSoundOn((prev) => {
      const next = !prev;
      audioEngine.setEnabled(next);
      return next;
    });
  }, []);

  const pickSmartRandomCombo = useCallback(() => {
    const prev = lastComboRef.current;

    // Avoid picking same time mode 3 times in a row
    const recentTimes = recentTimeModesRef.current;
    const blockedTime =
      recentTimes.length >= 2 && recentTimes[recentTimes.length - 1] === recentTimes[recentTimes.length - 2]
        ? recentTimes[recentTimes.length - 1]
        : null;
    const eligibleTimes = blockedTime
      ? TIME_MODE_ORDER.filter((m) => m !== blockedTime)
      : TIME_MODE_ORDER;

    const rainPool = RAIN_TYPES.filter((r) => r.id !== prev.rainId);
    const locPool = LOCATIONS.filter((l) => l.id !== prev.locationId);

    const nextRain = rainPool[Math.floor(Math.random() * rainPool.length)] || RAIN_TYPES[0];
    const nextLoc = locPool[Math.floor(Math.random() * locPool.length)] || LOCATIONS[0];
    const nextTime = eligibleTimes[Math.floor(Math.random() * eligibleTimes.length)] || TIME_MODE_ORDER[0];
    const nextIntensity = Number((0.45 + Math.random() * 0.95).toFixed(2));
    const nextWind = Number(((Math.random() - 0.42) * 1.6).toFixed(2));

    lastComboRef.current = { rainId: nextRain.id, locationId: nextLoc.id, timeMode: nextTime };
    recentTimeModesRef.current = [...recentTimes.slice(-2), nextTime];

    return { nextRain, nextLoc, nextTime, nextIntensity, nextWind };
  }, []);

  const executeRandomTransition = useCallback(
    (origin?: { x: number; y: number }) => {
      const rx = origin?.x ?? window.innerWidth * 0.72;
      const ry = origin?.y ?? 42;

      if (isTransitioningRef.current) {
        if (pendingQueueRef.current.length < 3) {
          pendingQueueRef.current.push({ x: rx, y: ry });
        }
        return;
      }

      isTransitioningRef.current = true;
      setRippleState((prev) => ({
        active: true,
        key: prev.key + 1,
        x: rx,
        y: ry,
      }));

      // Swap scene at peak ripple blur (~220ms)
      window.setTimeout(() => {
        const { nextRain, nextLoc, nextTime, nextIntensity, nextWind } = pickSmartRandomCombo();

        // Jump back to main rain experience if currently on another route
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
          setRoute('/');
          window.scrollTo({ top: 0 });
        }

        setSelectedRainId(nextRain.id);
        setSelectedLocationId(nextLoc.id);
        setTimeMode(nextTime);
        setIntensity(nextIntensity);
        setWind(Math.max(-1, Math.min(1, nextWind)));
        setUiPulseKey((k) => k + 1);

        // 3-second bottom toast
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setRandomToast(`Random: ${nextRain.name} · ${nextLoc.name} · ${TIME_MODES[nextTime].label}`);
        toastTimerRef.current = window.setTimeout(() => {
          setRandomToast(null);
        }, 3000);
      }, reducedMotion ? 120 : 230);

      // Finish transition & process next queued click if any
      window.setTimeout(() => {
        isTransitioningRef.current = false;
        setRippleState((prev) => ({ ...prev, active: false }));
        const nextOrigin = pendingQueueRef.current.shift();
        if (nextOrigin) {
          executeRandomTransition(nextOrigin);
        }
      }, reducedMotion ? 450 : 720);
    },
    [pickSmartRandomCombo, reducedMotion]
  );

  // Auto Random 20-second cinematic timer
  useEffect(() => {
    if (!autoRandom || reducedMotion) return;
    const id = window.setInterval(() => {
      if (!document.hidden) {
        executeRandomTransition({ x: window.innerWidth * 0.72, y: 42 });
      }
    }, 20000);
    return () => clearInterval(id);
  }, [autoRandom, reducedMotion, executeRandomTransition]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const target = stageRef.current || document.documentElement;
      target.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Global keyboard shortcuts (including R on any route to trigger Random Rain)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'r') {
        executeRandomTransition({ x: window.innerWidth * 0.75, y: 42 });
        return;
      }

      if (window.location.pathname !== '/') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleSound();
      } else if (e.key.toLowerCase() === 'h') {
        setHudHidden((h) => !h);
      } else if (e.key.toLowerCase() === 'f') {
        handleToggleFullscreen();
      } else if (e.key === '1') {
        setTimeMode('day');
      } else if (e.key === '2') {
        setTimeMode('noon');
      } else if (e.key === '3') {
        setTimeMode('afternoon');
      } else if (e.key === '4') {
        setTimeMode('night');
      } else if (e.key === 'Escape') {
        setActiveDrawer('none');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [executeRandomTransition, handleToggleSound, handleToggleFullscreen]);

  const handleSelectRainFromGrid = (id: string) => {
    setSelectedRainId(id);
    stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleSelectLocationFromGrid = (id: string) => {
    setSelectedLocationId(id);
    const loc = LOCATION_MAP[id];
    if (loc?.defaultRainId && RAIN_TYPE_MAP[loc.defaultRainId]) {
      setSelectedRainId(loc.defaultRainId);
    }
    stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const filteredRains = useMemo(
    () => (rainFilter === 'all' ? RAIN_TYPES : RAIN_TYPES.filter((r) => r.category === rainFilter)),
    [rainFilter]
  );

  const filteredLocations = useMemo(
    () => (locationFilter === 'all' ? LOCATIONS : LOCATIONS.filter((l) => l.category === locationFilter)),
    [locationFilter]
  );

  if (route === '/storm-break') {
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
              <div className="glass-panel rounded-2xl px-6 py-4 text-sm">Loading Storm Break…</div>
            </div>
          }
        >
          <StormBreakPage
            onNavigateHome={() => navigateTo('/')}
            onOpenLogoLab={() => setLogoLabOpen(true)}
            logoAnimId={logoAnimId}
            onTriggerRandom={executeRandomTransition}
            autoRandom={autoRandom}
            onToggleAutoRandom={handleToggleAutoRandom}
            reducedMotion={reducedMotion}
          />
        </Suspense>
        <LogoLabModal
          isOpen={logoLabOpen}
          onClose={() => setLogoLabOpen(false)}
          selectedId={logoAnimId}
          onSelect={handleSelectLogoAnim}
          timeMode={timeMode}
          reducedMotion={reducedMotion}
        />
        <RippleWipeOverlay ripple={rippleState} toastText={randomToast} reducedMotion={reducedMotion} />
      </>
    );
  }

  if (route === '/umbrella-walk') {
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
              <div className="glass-panel rounded-2xl px-6 py-4 text-sm">Loading Umbrella Walk…</div>
            </div>
          }
        >
          <UmbrellaWalkPage
            onNavigateHome={() => navigateTo('/')}
            onOpenLogoLab={() => setLogoLabOpen(true)}
            logoAnimId={logoAnimId}
            onTriggerRandom={executeRandomTransition}
            autoRandom={autoRandom}
            onToggleAutoRandom={handleToggleAutoRandom}
            reducedMotion={reducedMotion}
          />
        </Suspense>
        <LogoLabModal
          isOpen={logoLabOpen}
          onClose={() => setLogoLabOpen(false)}
          selectedId={logoAnimId}
          onSelect={handleSelectLogoAnim}
          timeMode={timeMode}
          reducedMotion={reducedMotion}
        />
        <RippleWipeOverlay ripple={rippleState} toastText={randomToast} reducedMotion={reducedMotion} />
      </>
    );
  }

  if (route === '/impact-simulator') {
    return (
      <>
        <Suspense
          fallback={
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
              <div className="glass-panel rounded-2xl px-6 py-4 text-sm">Loading Rain Impact Simulator…</div>
            </div>
          }
        >
          <ImpactSimulatorPage
            onNavigateHome={() => navigateTo('/')}
            onOpenLogoLab={() => setLogoLabOpen(true)}
            logoAnimId={logoAnimId}
            onTriggerRandom={executeRandomTransition}
            autoRandom={autoRandom}
            onToggleAutoRandom={handleToggleAutoRandom}
            reducedMotion={reducedMotion}
          />
        </Suspense>
        <LogoLabModal
          isOpen={logoLabOpen}
          onClose={() => setLogoLabOpen(false)}
          selectedId={logoAnimId}
          onSelect={handleSelectLogoAnim}
          timeMode={timeMode}
          reducedMotion={reducedMotion}
        />
        <RippleWipeOverlay ripple={rippleState} toastText={randomToast} reducedMotion={reducedMotion} />
      </>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ '--mode-accent': activePalette.accentHex } as React.CSSProperties}
    >
      {/* ---------------------------------------------------------------- */}
      {/* TOP GLASS NAVIGATION BAR — Small Glass Logo Left, Menu Right     */}
      {/* ---------------------------------------------------------------- */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4 pointer-events-none">
        <div className="max-w-7xl mx-auto glass-panel-subtle rounded-2xl px-5 sm:px-6 py-2.5 flex items-center justify-between gap-8 pointer-events-auto">
          {/* Zone 1: Small Glass Logo Left */}
          <a
            href="#stage"
            aria-label="Rain বৃষ্টি home"
            className="inline-flex items-center px-3 py-1 rounded-xl bg-white/8 border border-white/15 hover:bg-white/14 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <BrandLogo animationId={logoAnimId} timeMode={timeMode} variant="nav" />
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-7 text-sm font-normal text-slate-200/85">
            <a href="#stage" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Stage
            </a>
            <a href="#rain-types" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Rain Types
            </a>
            <a href="#locations" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Locations
            </a>
            <a href="#credits" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Credits
            </a>
          </nav>

          {/* Zone 3: Logo Lab + Random Rain + Auto Random */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setLogoLabOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium glass-panel-subtle hover:bg-white/18 text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
              style={{ borderColor: activePalette.accentSoft }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: activePalette.accentHex }} aria-hidden="true" />
              <span>Logo Lab</span>
            </button>

            <RandomRainControls
              onTriggerRandom={executeRandomTransition}
              autoRandom={autoRandom}
              onToggleAutoRandom={handleToggleAutoRandom}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* FULL-SCREEN INTERACTIVE RAIN STAGE (100vh)                       */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="stage"
        ref={stageRef}
        aria-label="Interactive atmospheric rain stage"
        className="relative w-full h-screen min-h-[640px] overflow-hidden select-none"
      >
        <RainCanvas
          rain={activeRain}
          location={activeLocation}
          palette={activePalette}
          intensity={intensity}
          wind={wind}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
        />

        {/* Editorial Scrim for legible typography over bright Day/Noon skies */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent pointer-events-none"
        />

        {/* Animated Brand Logo Centerpiece (Plays 2-3s droplet-through-letters intro, then settles) */}
        <AnimatePresence>
          {!hudHidden && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute top-24 sm:top-28 inset-x-0 z-20 px-6 pointer-events-none"
            >
              <div className="max-w-7xl mx-auto">
                <div className="inline-block pointer-events-auto cursor-pointer" onClick={() => setLogoReplayKey((k) => k + 1)} title="Click to replay logo animation">
                  <BrandLogo
                    animationId={logoAnimId}
                    timeMode={timeMode}
                    variant="hero"
                    showTagline={true}
                    replayKey={logoReplayKey}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene Headline & Unboxed Metadata Overlay */}
        <AnimatePresence>
          {!hudHidden && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-36 sm:bottom-32 z-20 px-6 pointer-events-none"
            >
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                <div key={uiPulseKey} className={uiPulseKey > 0 ? 'animate-ui-pulse rounded-2xl p-1 -m-1' : ''}>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-sky-100/85 tracking-wide mb-2">
                    <span>{activeLocation.region}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePalette.label}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeRain.name}</span>
                  </div>

                  <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-white text-balance drop-shadow-sm">
                    {activeLocation.name}
                  </h1>

                  <p className="mt-2 text-sm sm:text-base text-slate-200/85 max-w-xl">
                    {activeRain.subtitle} across {activeLocation.atmosphere.toLowerCase()}.
                  </p>
                </div>

                {/* Dramatic Glass Links to Page 2 (/storm-break) & Page 3 (/umbrella-walk) */}
                <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 shrink-0">
                  <a
                    href="/umbrella-walk"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/umbrella-walk');
                    }}
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl glass-panel border border-sky-300/30 hover:border-sky-300/65 bg-slate-950/45 hover:bg-sky-950/50 text-sm font-medium text-white shadow-lg shadow-slate-950/50 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sky-400"
                  >
                    <Umbrella className="w-4 h-4 text-sky-300 group-hover:text-sky-200 transition-colors" aria-hidden="true" />
                    <span>🌂 Umbrella Walk</span>
                  </a>

                  <a
                    href="/storm-break"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo('/storm-break');
                    }}
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl glass-panel border border-emerald-300/30 hover:border-rose-400/55 bg-slate-950/45 hover:bg-rose-950/50 text-sm font-medium text-white shadow-lg shadow-slate-950/50 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-rose-400"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-300 group-hover:text-rose-300 transition-colors" aria-hidden="true" />
                    <span>⚠ Storm Break</span>
                  </a>

                  <ImpactPreviewButton
                    onNavigate={() => navigateTo('/impact-simulator')}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Floating Control Dock + Optional Quick Drawer */}
        <div className="absolute inset-x-0 bottom-4 sm:bottom-6 z-30 pointer-events-none">
          <QuickDrawer
            drawer={activeDrawer}
            onClose={() => setActiveDrawer('none')}
            selectedRainId={selectedRainId}
            onSelectRain={(id) => {
              setSelectedRainId(id);
            }}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(id) => {
              setSelectedLocationId(id);
              const loc = LOCATION_MAP[id];
              if (loc?.defaultRainId && RAIN_TYPE_MAP[loc.defaultRainId]) {
                setSelectedRainId(loc.defaultRainId);
              }
            }}
            reducedMotion={reducedMotion}
          />

          <ControlDock
            timeMode={timeMode}
            onTimeModeChange={setTimeMode}
            intensity={intensity}
            onIntensityChange={setIntensity}
            wind={wind}
            onWindChange={setWind}
            isSoundOn={isSoundOn}
            onToggleSound={handleToggleSound}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onRandomize={() => executeRandomTransition({ x: window.innerWidth * 0.72, y: window.innerHeight - 60 })}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            hudHidden={hudHidden}
            onToggleHud={() => setHudHidden((h) => !h)}
            activeDrawer={activeDrawer}
            onToggleDrawer={(d) => setActiveDrawer((prev) => (prev === d ? 'none' : d))}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 30 RAIN TYPES GALLERY                                            */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="rain-types"
        aria-labelledby="rain-types-heading"
        className="relative py-24 px-6 bg-slate-950 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs text-sky-300/85 tracking-wide mb-2">Procedural Recipes</p>
              <h2 id="rain-types-heading" className="font-display text-3xl sm:text-5xl font-semibold text-white text-balance">
                Thirty Distinct Forms of Rain
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300/80 max-w-2xl">
                Each precipitation mode alters particle geometry, terminal velocity, wind responsiveness, surface splash physics, and procedural acoustics.
              </p>
            </div>

            {/* Category Filter Controls */}
            <div role="tablist" aria-label="Filter rain types" className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              {RAIN_CATEGORIES.map((cat) => {
                const active = rainFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRainFilter(cat.id)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredRains.map((rain) => {
              const active = rain.id === selectedRainId;
              return (
                <button
                  key={rain.id}
                  type="button"
                  onClick={() => handleSelectRainFromGrid(rain.id)}
                  aria-pressed={active}
                  className={`group flex flex-col justify-between gap-3 p-4 rounded-2xl text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                    active
                      ? 'bg-white text-slate-950 shadow-lg shadow-sky-950/40'
                      : 'glass-panel-subtle hover:bg-white/10 hover:-translate-y-0.5 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <RainTypeIcon rain={rain} isActive={active} reducedMotion={reducedMotion} />
                    <span
                      className={`text-[11px] font-mono-tabular ${
                        active ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {Math.round((rain.speedMin + rain.speedMax) / 20)} px/s
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-medium leading-snug">{rain.name}</div>
                    <div
                      className={`mt-1 text-xs line-clamp-2 ${
                        active ? 'text-slate-700' : 'text-slate-300/75'
                      }`}
                    >
                      {rain.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 26 LOCATIONS & ANIMATED SCENE PREVIEW GRID                       */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="locations"
        aria-labelledby="locations-heading"
        className="relative py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs text-sky-300/85 tracking-wide mb-2">Living Landscapes</p>
              <h2 id="locations-heading" className="font-display text-3xl sm:text-5xl font-semibold text-white text-balance">
                Twenty-Six Atmospheric Settings
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300/80 max-w-2xl">
                Every scene renders procedurally in real time, responding to {activePalette.label.toLowerCase()} illumination, wind sway, and wet-surface reflections.
              </p>
            </div>

            <div role="tablist" aria-label="Filter locations" className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              {LOCATION_CATEGORIES.map((cat) => {
                const active = locationFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setLocationFilter(cat.id)}
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
              <ScenePreviewCard
                key={loc.id}
                location={loc}
                palette={activePalette}
                activeRain={activeRain}
                isSelected={loc.id === selectedLocationId}
                onSelect={handleSelectLocationFromGrid}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PURE WHITE RAINY-CLOUD ENDING SECTION                            */}
      {/* ---------------------------------------------------------------- */}
      <EndingSection reducedMotion={reducedMotion} />

      <LogoLabModal
        isOpen={logoLabOpen}
        onClose={() => setLogoLabOpen(false)}
        selectedId={logoAnimId}
        onSelect={handleSelectLogoAnim}
        timeMode={timeMode}
        reducedMotion={reducedMotion}
      />

      <RippleWipeOverlay
        ripple={rippleState}
        toastText={randomToast}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
