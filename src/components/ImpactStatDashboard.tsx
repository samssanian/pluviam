import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  Droplets,
  Flame,
  HeartPulse,
  Hospital,
  Mountain,
  PawPrint,
  Pill,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import { SimulationResults } from '../utils/impactEngine';

interface ImpactStatDashboardProps {
  results: SimulationResults;
  runKey: number;
  reducedMotion: boolean;
}

function useCountUp(target: number, runKey: number, reducedMotion: boolean, durationMs = 780): number {
  const [val, setVal] = useState(target);

  useEffect(() => {
    if (reducedMotion) {
      setVal(target);
      return;
    }
    const startVal = 0;
    const startAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - startAt) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(startVal + (target - startVal) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, runKey, reducedMotion, durationMs]);

  return val;
}

function getSeverityColor(score: number): { stroke: string; text: string; badge: string } {
  if (score >= 76) {
    return {
      stroke: '#ef4444',
      text: 'text-rose-300',
      badge: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    };
  }
  if (score >= 50) {
    return {
      stroke: '#f97316',
      text: 'text-orange-300',
      badge: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
    };
  }
  if (score >= 25) {
    return {
      stroke: '#f59e0b',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    };
  }
  return {
    stroke: '#10b981',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  };
}

const CircularGauge: React.FC<{
  value: number;
  title: string;
  subtitle: string;
  strokeColor: string;
  trackColor?: string;
  size?: number;
  runKey: number;
  reducedMotion: boolean;
}> = ({
  value,
  title,
  subtitle,
  strokeColor,
  trackColor = 'rgba(255,255,255,0.1)',
  size = 148,
  runKey,
  reducedMotion,
}) => {
  const animated = useCountUp(value, runKey, reducedMotion);
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - Math.min(100, Math.max(0, animated)) / 100);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={10}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-tabular text-3xl font-bold text-white">{animated}</span>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <div className="mt-2.5 text-sm font-semibold text-white">{title}</div>
      <div className="text-xs text-slate-300/75">{subtitle}</div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  tintClass?: string;
  pulseHeart?: boolean;
  runKey: number;
  reducedMotion: boolean;
}> = ({ icon, label, value, suffix = '', tintClass = 'glass-panel-subtle', pulseHeart = false, runKey, reducedMotion }) => {
  const animated = useCountUp(value, runKey, reducedMotion);

  return (
    <div className={`rounded-2xl p-4 flex flex-col justify-between gap-2 transition-colors ${tintClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-300/85 font-medium">{label}</span>
        <span className={pulseHeart && !reducedMotion ? 'animate-pulse text-rose-400' : 'text-slate-300/80'}>
          {icon}
        </span>
      </div>
      <div className="font-mono-tabular text-2xl font-semibold text-white">
        {animated.toLocaleString()}
        {suffix && <span className="text-sm font-normal text-slate-300/80 ml-1">{suffix}</span>}
      </div>
    </div>
  );
};

export const ImpactStatDashboard: React.FC<ImpactStatDashboardProps> = ({
  results,
  runKey,
  reducedMotion,
}) => {
  const dangerColors = getSeverityColor(results.dangerScore);
  const animatedFloodPct = useCountUp(results.floodLevelPct, runKey, reducedMotion);
  const animatedHospital = useCountUp(results.hospitalOverloadPct, runKey, reducedMotion);
  const animatedMedicine = useCountUp(results.medicineShortagePct, runKey, reducedMotion);

  return (
    <section aria-labelledby="impact-dashboard-heading" className="space-y-8">
      {/* Top Row: Severity Gauge + Health Emergency Gauge + Flood Depth Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center">
          <CircularGauge
            value={results.dangerScore}
            title="Severity Index"
            subtitle={`Impact Level: ${results.severityLabel}`}
            strokeColor={dangerColors.stroke}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <span className={`mt-3 px-3 py-1 rounded-full text-xs font-medium border ${dangerColors.badge}`}>
            {results.severityLabel} Event
          </span>
        </div>

        <div className="rounded-3xl p-6 bg-rose-950/30 border border-rose-400/25 backdrop-blur-xl flex flex-col items-center justify-center">
          <CircularGauge
            value={results.healthEmergencyScore}
            title="Health Emergency"
            subtitle="Disease & Triage Strain"
            strokeColor="#e11d48"
            trackColor="rgba(244,63,94,0.16)"
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-200 border border-rose-400/35">
            <HeartPulse className={`w-3.5 h-3.5 ${reducedMotion ? '' : 'animate-pulse'}`} aria-hidden="true" />
            Medical Response Needed
          </span>
        </div>

        {/* Animated Rising Flood Depth Meter */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="impact-dashboard-heading" className="text-sm font-semibold text-white">
                Peak Flood Depth
              </h2>
              <p className="text-xs text-slate-300/75 mt-0.5">Estimated surface standing level</p>
            </div>
            <Waves className="w-5 h-5 text-sky-300" aria-hidden="true" />
          </div>

          <div className="my-4 relative h-28 rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden flex items-end">
            <div
              className="w-full bg-gradient-to-t from-sky-600/85 via-cyan-500/65 to-sky-300/55 transition-all duration-700 relative"
              style={{ height: `${animatedFloodPct}%` }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-sky-200/70" />
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-sky-100/80">Level</div>
                <div className="font-display text-2xl font-semibold text-white">
                  {results.floodLevelLabel}
                </div>
              </div>
              <div className="font-mono-tabular text-2xl font-bold text-white drop-shadow">
                {animatedFloodPct}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300/80 font-mono-tabular">
            <span>Ankle · Knee · Waist · Chest · Rooftop</span>
            <span>{results.totalRainfallMm.toLocaleString()} mm</span>
          </div>
        </div>
      </div>

      {/* People, Animals & Infrastructure Grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300" aria-hidden="true" />
          <span>Human, Animal & Infrastructure Impact</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4 text-sky-300" />}
            label="People Affected"
            value={results.peopleAffected}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Users className="w-4 h-4 text-amber-300" />}
            label="People Displaced"
            value={results.peopleDisplaced}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Activity className="w-4 h-4 text-orange-300" />}
            label="Injuries"
            value={results.injuries}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-rose-300" />}
            label="Estimated Deaths"
            value={results.deaths}
            tintClass="bg-rose-950/25 border border-rose-400/20"
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<PawPrint className="w-4 h-4 text-emerald-300" />}
            label="Animals Affected"
            value={results.animalsAffected}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<PawPrint className="w-4 h-4 text-amber-300" />}
            label="Livestock / Pets Lost"
            value={results.animalsLost}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Droplets className="w-4 h-4 text-sky-300" />}
            label="Total Rainfall"
            value={results.totalRainfallMm}
            suffix="mm"
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Waves className="w-4 h-4 text-cyan-300" />}
            label="Rivers Overflowed"
            value={results.riversOverflowed}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Building2 className="w-4 h-4 text-amber-300" />}
            label="Roads Flooded"
            value={results.roadsFlooded}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Building2 className="w-4 h-4 text-orange-300" />}
            label="Bridges Damaged"
            value={results.bridgesDamaged}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-yellow-300" />}
            label="Power Outage"
            value={results.powerOutageHours}
            suffix="hrs"
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Building2 className="w-4 h-4 text-rose-300" />}
            label="Building Damage"
            value={results.buildingDamagePct}
            suffix="%"
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Flame className="w-4 h-4 text-orange-400" />}
            label="Gas Leaks / Fires"
            value={results.gasLeaks + results.fires}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Mountain className="w-4 h-4 text-amber-400" />}
            label="Landslides"
            value={results.landslides}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<Droplets className="w-4 h-4 text-lime-300" />}
            label="Crop Loss"
            value={results.cropLossPct}
            suffix="%"
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      {/* Health & Disease Outbreak Section (Crimson / Amber tinted glass + Heartbeat Pulse) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-rose-950/35 via-slate-950/60 to-amber-950/25 border border-rose-400/25 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/35 flex items-center justify-center text-rose-300">
              <HeartPulse className={`w-5 h-5 ${reducedMotion ? '' : 'animate-pulse'}`} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Public Health & Disease Outbreak Forecast</h3>
              <p className="text-xs text-rose-200/75">
                Calculated from standing water duration, population density, and sanitation level
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Cholera"
            value={results.choleraCases}
            tintClass="bg-rose-950/40 border border-rose-400/30"
            pulseHeart={results.choleraCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Diarrhea"
            value={results.diarrheaCases}
            tintClass="bg-rose-950/40 border border-rose-400/30"
            pulseHeart={results.diarrheaCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Typhoid"
            value={results.typhoidCases}
            tintClass="bg-rose-950/35 border border-rose-400/25"
            pulseHeart={results.typhoidCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Dengue"
            value={results.dengueCases}
            tintClass="bg-amber-950/35 border border-amber-400/30"
            pulseHeart={results.dengueCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Leptospirosis"
            value={results.leptospirosisCases}
            tintClass="bg-rose-950/35 border border-rose-400/25"
            pulseHeart={results.leptospirosisCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Skin Infections"
            value={results.skinInfectionCases}
            tintClass="bg-amber-950/30 border border-amber-400/25"
            pulseHeart={results.skinInfectionCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
          <StatCard
            icon={<HeartPulse className="w-4 h-4" />}
            label="Respiratory"
            value={results.respiratoryCases}
            tintClass="bg-amber-950/30 border border-amber-400/25"
            pulseHeart={results.respiratoryCases > 0}
            runKey={runKey}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Hospital Overload & Medicine Shortage Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 bg-slate-950/55 border border-rose-400/20">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-rose-100">
                <Hospital className="w-3.5 h-3.5 text-rose-300" aria-hidden="true" />
                Hospital Overload Capacity
              </span>
              <span className="font-mono-tabular font-semibold text-rose-200">{animatedHospital}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-700"
                style={{ width: `${animatedHospital}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-slate-950/55 border border-amber-400/20">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-100">
                <Pill className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                Essential Medicine Shortage
              </span>
              <span className="font-mono-tabular font-semibold text-amber-200">{animatedMedicine}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 transition-all duration-700"
                style={{ width: `${animatedMedicine}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emotional Care Note */}
      <p className="text-center text-xs sm:text-sm text-slate-300/80 italic pt-1">
        A fictional simulation — a reminder to respect the rain, protect health, and help each other.
      </p>
    </section>
  );
};
