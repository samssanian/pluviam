import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { StormCanvas } from '../components/StormCanvas';
import { CrackOverlay } from '../components/CrackOverlay';
import { EndingSection } from '../components/EndingSection';
import { BrandLogo } from '../components/BrandLogo';
import { RandomRainControls } from '../components/RandomRainControls';
import { LogoAnimationId } from '../data/logoAnimations';
import { StormPhase, stormAudioEngine } from '../utils/stormAudioEngine';

interface StormBreakPageProps {
  onNavigateHome: () => void;
  onOpenLogoLab: () => void;
  logoAnimId: LogoAnimationId;
  onTriggerRandom: (origin?: { x: number; y: number }) => void;
  autoRandom: boolean;
  onToggleAutoRandom: () => void;
  reducedMotion: boolean;
}

const TOTAL_DURATION = 26.5;

function getPhase(t: number): StormPhase {
  if (t < 3) return 'calm';
  if (t < 6) return 'warning';
  if (t < 10) return 'formation';
  if (t < 16) return 'approach';
  if (t < 22) return 'impact';
  if (t < 26) return 'aftermath';
  return 'ending';
}

const PHASE_COPY: Record<StormPhase, { title: string; subtitle: string }> = {
  calm: {
    title: 'Calm Before the Break',
    subtitle: 'Soft rain drifts over the quiet valley.',
  },
  warning: {
    title: 'Atmospheric Anomaly',
    subtitle: 'Barometric pressure drops as green-black clouds begin rotating.',
  },
  formation: {
    title: 'Funnel Formation',
    subtitle: 'A supercell vortex touches down on the distant horizon.',
  },
  approach: {
    title: 'Direct Approach',
    subtitle: 'Sideways gale force winds fracture everything in its path.',
  },
  impact: {
    title: 'Vortex Impact',
    subtitle: 'Total structural collapse across the valley.',
  },
  aftermath: {
    title: 'Aftermath',
    subtitle: 'Silence settles among drifting glass and faint rain.',
  },
  ending: {
    title: 'Aftermath',
    subtitle: 'Scroll down into the quiet white horizon.',
  },
};

const GLITCH_CHARS = '!@#$%^&*_-+=<>?/|';

function useGlitchText(text: string, active: boolean): string {
  const [output, setOutput] = useState(text);
  useEffect(() => {
    if (!active) {
      setOutput(text);
      return;
    }
    const id = window.setInterval(() => {
      if (Math.random() < 0.45) {
        setOutput(
          text
            .split('')
            .map((ch) =>
              ch !== ' ' && Math.random() < 0.25
                ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
                : ch
            )
            .join('')
        );
      } else {
        setOutput(text);
      }
    }, 90);
    return () => clearInterval(id);
  }, [text, active]);
  return output;
}

const SHARD_POLYGONS = [
  { id: 1, clip: 'polygon(0 0, 52% 0, 38% 54%, 0 36%)', dx: -320, dy: -210, rot: -145 },
  { id: 2, clip: 'polygon(52% 0, 100% 0, 100% 42%, 38% 54%)', dx: 340, dy: -190, rot: 165 },
  { id: 3, clip: 'polygon(0 36%, 38% 54%, 44% 100%, 0 100%)', dx: -280, dy: 240, rot: 120 },
  { id: 4, clip: 'polygon(38% 54%, 100% 42%, 100% 100%, 44% 100%)', dx: 310, dy: 270, rot: -175 },
  { id: 5, clip: 'polygon(22% 18%, 68% 15%, 72% 78%, 26% 74%)', dx: 40, dy: -320, rot: 210 },
];

export default function StormBreakPage({
  onNavigateHome,
  onOpenLogoLab,
  logoAnimId,
  onTriggerRandom,
  autoRandom,
  onToggleAutoRandom,
  reducedMotion,
}: StormBreakPageProps) {
  const [timelineTime, setTimelineTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const endingRef = useRef<HTMLDivElement | null>(null);
  const autoScrolledRef = useRef<boolean>(false);

  const phase = useMemo(() => getPhase(timelineTime), [timelineTime]);

  // Master timeline loop
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setTimelineTime((prev) => {
        const next = prev + dt;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  // Sync procedural storm audio
  useEffect(() => {
    stormAudioEngine.updateTimeline(timelineTime, phase, isPlaying);
  }, [timelineTime, phase, isPlaying]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stormAudioEngine.setEnabled(false);
    };
  }, []);

  // Gentle auto-scroll cue when reaching ending at 26.5s
  useEffect(() => {
    if (phase === 'ending' && !autoScrolledRef.current) {
      autoScrolledRef.current = true;
      endingRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [phase, reducedMotion]);

  const handleToggleSound = useCallback(() => {
    setIsSoundOn((prev) => {
      const next = !prev;
      stormAudioEngine.setEnabled(next);
      return next;
    });
  }, []);

  const handleReplay = useCallback(() => {
    autoScrolledRef.current = false;
    stormAudioEngine.resetTriggers();
    setTimelineTime(0);
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  const handleEnterStorm = useCallback(() => {
    autoScrolledRef.current = false;
    stormAudioEngine.resetTriggers();
    if (!isSoundOn) {
      setIsSoundOn(true);
      stormAudioEngine.setEnabled(true);
    }
    setTimelineTime(timelineTime < 3 ? 3.1 : 0);
    setIsPlaying(true);
  }, [isSoundOn, timelineTime]);

  const handleSkipToAftermath = useCallback(() => {
    setTimelineTime(22.4);
    setIsPlaying(true);
  }, []);

  // Derived Telemetry
  const stormIntensityPct = useMemo(() => {
    if (timelineTime < 3) return 14;
    if (timelineTime < 6) return Math.round(14 + ((timelineTime - 3) / 3) * 30);
    if (timelineTime < 16) return Math.round(44 + ((timelineTime - 6) / 10) * 44);
    if (timelineTime < 22) return Math.round(88 + ((timelineTime - 16) / 6) * 12);
    return 8;
  }, [timelineTime]);

  const windSpeedKmh = useMemo(() => {
    if (timelineTime < 3) return Math.round(14 + Math.sin(timelineTime * 2) * 2);
    if (timelineTime < 6) return Math.round(16 + ((timelineTime - 3) / 3) * 74);
    if (timelineTime < 16) return Math.round(90 + ((timelineTime - 6) / 10) * 165);
    if (timelineTime < 22) return Math.round(255 + Math.sin(timelineTime * 9) * 35);
    return 12;
  }, [timelineTime]);

  const countdownSec = Math.max(0, Number((16 - timelineTime).toFixed(1)));
  const crackProgress =
    timelineTime < 10.5 ? 0 : Math.min(1, (timelineTime - 10.5) / 6.5);
  const isShattered = timelineTime >= 18.2 && timelineTime < 22.0;
  const isAftermath = timelineTime >= 22.0;
  const isGlitching = !reducedMotion && (phase === 'warning' || phase === 'approach');

  const displayTitle = useGlitchText(PHASE_COPY[phase].title, isGlitching);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ---------------------------------------------------------------- */}
      {/* FULL-SCREEN TORNADO APOCALYPSE STAGE                             */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-label="Storm Break cinematic tornado simulation"
        className="relative w-full h-screen min-h-[640px] overflow-hidden select-none"
      >
        <StormCanvas
          timelineTime={timelineTime}
          phase={phase}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
        />

        {/* Top Bar (Strict 3-Zone Contract — Dark Cracked Glass) */}
        {!isShattered && !isAftermath && (
          <header className="absolute top-0 inset-x-0 z-40 px-4 sm:px-8 pt-4">
            <motion.div
              animate={
                isGlitching && Math.random() < 0.35
                  ? { opacity: [1, 0.72, 1], x: [0, -2, 2, 0] }
                  : { opacity: 1, x: 0 }
              }
              transition={{ duration: 0.16 }}
              className="relative max-w-7xl mx-auto glass-panel-subtle rounded-2xl px-6 py-3 flex items-center justify-between gap-8 overflow-hidden"
            >
              <CrackOverlay crackProgress={crackProgress} shattered={isShattered} />

              <button
                type="button"
                onClick={onNavigateHome}
                aria-label="Back to Rain বৃষ্টি home"
                className="inline-flex items-center px-3 py-1 rounded-xl bg-white/8 border border-white/15 hover:bg-white/14 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <BrandLogo animationId={logoAnimId} timeMode="night" variant="nav" />
              </button>

              <div className="hidden md:flex items-center gap-6 text-xs text-slate-200/85 whitespace-nowrap">
                <span>Storm Break Sequence</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {timelineTime.toFixed(1)}s / {TOTAL_DURATION.toFixed(0)}s
                </span>
                <button
                  type="button"
                  onClick={onOpenLogoLab}
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Logo Lab
                </button>
              </div>

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
            </motion.div>
          </header>
        )}

        {/* Calm Phase Warning Toast (0.6s - 3.6s) */}
        <AnimatePresence>
          {timelineTime >= 0.6 && timelineTime <= 3.8 && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-24 inset-x-0 z-30 flex justify-center px-4 pointer-events-none"
            >
              <div className="glass-panel rounded-2xl px-6 py-3 text-sm font-medium text-amber-100 border border-amber-300/30">
                Something is wrong…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shattering UI Glass Shards Explosion during Impact (18.2s - 21.8s) */}
        <AnimatePresence>
          {isShattered && !reducedMotion && (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-end justify-center pb-16">
              <div className="relative w-full max-w-4xl h-44">
                {SHARD_POLYGONS.map((shard) => (
                  <motion.div
                    key={shard.id}
                    initial={{ opacity: 0.95, x: 0, y: 0, rotate: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: shard.dx,
                      y: shard.dy,
                      rotate: shard.rot,
                      scale: 0.7,
                    }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ clipPath: shard.clip }}
                    className="absolute inset-0 glass-panel border border-white/40"
                  />
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Glass HUD & Telemetry (Cracks on Approach, Shatters on Impact) */}
        {!isShattered && !isAftermath && (
          <div className="absolute inset-x-0 bottom-5 z-30 px-4">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Phase Narrative + Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-200/80 tracking-wide mb-1.5">
                    <span className="capitalize">{phase}</span>
                    <span aria-hidden="true">·</span>
                    <span>Timeline {timelineTime.toFixed(1)}s</span>
                  </div>
                  <h1 className="font-display text-3xl sm:text-5xl font-semibold text-white tracking-tight text-balance">
                    {displayTitle}
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-200/85 max-w-xl">
                    {PHASE_COPY[phase].subtitle}
                  </p>
                </div>

                {/* Storm Telemetry Glass Card */}
                <motion.div
                  animate={
                    isGlitching
                      ? { x: [0, -2, 3, -1, 0], opacity: [1, 0.8, 1] }
                      : { x: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.2, repeat: isGlitching ? Infinity : 0 }}
                  className="relative glass-panel rounded-2xl p-4 overflow-hidden"
                >
                  <CrackOverlay crackProgress={crackProgress} shattered={isShattered} />
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[11px] text-slate-300/80">Intensity</div>
                      <div className="font-mono-tabular text-base font-medium text-white mt-0.5">
                        {stormIntensityPct}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-300/80">Wind</div>
                      <div className="font-mono-tabular text-base font-medium text-white mt-0.5">
                        {windSpeedKmh} km/h
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-300/80">Impact</div>
                      <div className="font-mono-tabular text-base font-medium text-rose-300 mt-0.5">
                        {countdownSec > 0 ? `${countdownSec}s` : 'Hit'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Glass Control & Timeline Scrubbing Dock */}
              <div className="relative glass-panel glass-noise rounded-2xl p-3.5 sm:p-4 overflow-hidden">
                <CrackOverlay crackProgress={crackProgress} shattered={isShattered} />

                <div className="relative z-10 flex flex-col gap-3">
                  {/* Scrubbing Timeline Bar */}
                  <label className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 whitespace-nowrap shrink-0">Timeline</span>
                    <input
                      type="range"
                      min={0}
                      max={TOTAL_DURATION}
                      step={0.1}
                      value={timelineTime}
                      onChange={(e) => {
                        autoScrolledRef.current = false;
                        setTimelineTime(parseFloat(e.target.value));
                      }}
                      aria-label="Scrub storm timeline"
                      className="glass-slider w-full"
                    />
                    <span className="font-mono-tabular text-xs text-slate-200 whitespace-nowrap shrink-0">
                      {timelineTime.toFixed(1)}s
                    </span>
                  </label>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleEnterStorm}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white text-slate-950 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
                      >
                        <span>Enter the Storm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        aria-label={isPlaying ? 'Pause timeline' : 'Play timeline'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 text-white hover:bg-white/18 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleSound}
                        aria-pressed={isSoundOn}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400 ${
                          isSoundOn
                            ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/40'
                            : 'bg-white/10 text-slate-200 hover:bg-white/18'
                        }`}
                      >
                        {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>{isSoundOn ? 'Sound On' : 'Sound Off'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSkipToAftermath}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 text-slate-100 hover:bg-white/18 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
                      >
                        <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Skip to Aftermath</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleReplay}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 text-slate-100 hover:bg-white/18 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Replay Storm</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AFTERMATH: One Lone Flickering Broken Glass Panel */}
        <AnimatePresence>
          {isAftermath && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.6 }}
              className="absolute inset-0 z-30 flex items-center justify-center px-6"
            >
              <motion.div
                animate={
                  reducedMotion
                    ? undefined
                    : { opacity: [0.92, 0.55, 0.96, 0.7, 0.94] }
                }
                transition={{ duration: 4.5, repeat: Infinity }}
                className="relative glass-panel rounded-2xl p-8 max-w-md w-full text-center overflow-hidden"
              >
                <CrackOverlay crackProgress={0.95} shattered={false} />

                <div className="relative z-10">
                  <p className="text-xs text-slate-300/80 tracking-wide mb-2">
                    Aftermath · 12 km/h
                  </p>
                  <h2 className="font-display text-3xl font-medium text-white">
                    Quiet Returns
                  </h2>
                  <p className="mt-2 text-sm text-slate-300/85">
                    The storm has passed, leaving faint rain over stillness.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white text-slate-950 hover:bg-sky-100 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Back to Calm Rain</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReplay}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/12 text-white hover:bg-white/20 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-sky-400"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Replay Storm</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PURE WHITE RAINY-CLOUD ENDING SECTION                            */}
      {/* ---------------------------------------------------------------- */}
      <div ref={endingRef}>
        <EndingSection reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}
