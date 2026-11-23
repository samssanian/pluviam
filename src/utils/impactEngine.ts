import { DISASTER_SCENES, DisasterScene, SeverityLevel } from '../data/disasterScenes';
import { RAIN_TYPE_MAP } from '../data/rainTypes';
import { LOCATION_MAP } from '../data/locations';
import { TimeMode } from '../types/rain';

export type TerrainType =
  | 'Plains'
  | 'Hills'
  | 'Coastal'
  | 'River delta'
  | 'Urban'
  | 'Forest'
  | 'Desert oasis'
  | 'Mountain valley';

export type PopulationDensity = 'Rural' | 'Town' | 'City' | 'Megacity';
export type SanitationLevel = 'Good' | 'Average' | 'Poor';

export interface SimulationInputs {
  durationHours: number; // 1 to 720 (30 days)
  timeMode: TimeMode;
  startHour: number; // 0 to 23
  rainId: string;
  intensity: number; // 0 to 100
  wind: number; // 0 to 100
  locationId: string;
  terrain: TerrainType;
  populationDensity: PopulationDensity;
  sanitation: SanitationLevel;
}

export interface TimelineKeyframe {
  index: number;
  label: string; // e.g. "Day 1 · 08:00"
  progress: number; // 0 to 1
  scene: DisasterScene;
}

export interface SimulationResults {
  dangerScore: number; // 0 to 100
  healthEmergencyScore: number; // 0 to 100
  severityLabel: SeverityLevel;
  totalRainfallMm: number;
  floodLevelLabel: 'Ankle' | 'Knee' | 'Waist' | 'Chest' | 'Rooftop';
  floodLevelPct: number; // 0 to 100
  riversOverflowed: number;
  roadsFlooded: number;
  bridgesDamaged: number;
  powerOutageHours: number;
  buildingDamagePct: number;
  peopleAffected: number;
  peopleDisplaced: number;
  injuries: number;
  deaths: number;
  animalsAffected: number;
  animalsLost: number;
  cropLossPct: number;
  gasLeaks: number;
  fires: number;
  landslides: number;
  // Health outbreaks
  choleraCases: number;
  diarrheaCases: number;
  typhoidCases: number;
  dengueCases: number;
  leptospirosisCases: number;
  skinInfectionCases: number;
  respiratoryCases: number;
  hospitalOverloadPct: number;
  medicineShortagePct: number;
  timeline: TimelineKeyframe[];
}

const TERRAIN_RISK: Record<TerrainType, number> = {
  Plains: 1.05,
  Hills: 1.15,
  Coastal: 1.38,
  'River delta': 1.48,
  Urban: 1.25,
  Forest: 0.85,
  'Desert oasis': 1.12,
  'Mountain valley': 1.32,
};

const POP_FACTOR: Record<PopulationDensity, number> = {
  Rural: 0.25,
  Town: 0.75,
  City: 2.2,
  Megacity: 5.5,
};

const SANITATION_RISK: Record<SanitationLevel, number> = {
  Good: 0.45,
  Average: 1.0,
  Poor: 2.15,
};

function formatDayHour(startHour: number, offsetHours: number): string {
  const totalH = Math.floor(startHour + offsetHours);
  const day = Math.floor(totalH / 24) + 1;
  const hour = totalH % 24;
  return `Day ${day} · ${String(hour).padStart(2, '0')}:00`;
}

export function runImpactSimulation(inputs: SimulationInputs): SimulationResults {
  const rain = RAIN_TYPE_MAP[inputs.rainId];
  const loc = LOCATION_MAP[inputs.locationId];

  const rainMult = rain ? 0.55 + rain.density * 0.55 + rain.lightningFreq * 0.35 : 1.0;
  const locFloodBias = loc?.hasWaterSurface ? 1.22 : 1.0;
  const terrainMult = TERRAIN_RISK[inputs.terrain];
  const popMult = POP_FACTOR[inputs.populationDensity];
  const sanMult = SANITATION_RISK[inputs.sanitation];

  const durationDays = inputs.durationHours / 24;
  const durationLog = Math.log2(inputs.durationHours + 1) / Math.log2(721); // 0.1 to 1.0
  const intNorm = inputs.intensity / 100;
  const windNorm = inputs.wind / 100;

  // Rainfall mm/hr scaled by rain recipe & intensity
  const hourlyMm = (3 + intNorm * 32) * rainMult;
  const totalRainfallMm = Math.round(hourlyMm * Math.pow(inputs.durationHours, 0.78));

  // Core Danger Score (0-100)
  const rawDanger =
    (intNorm * 34 + windNorm * 18 + durationLog * 34) *
    terrainMult *
    (0.75 + rainMult * 0.22) *
    locFloodBias;
  const dangerScore = Math.min(100, Math.max(4, Math.round(rawDanger)));

  const severityLabel: SeverityLevel =
    dangerScore >= 76
      ? 'Catastrophic'
      : dangerScore >= 50
        ? 'Severe'
        : dangerScore >= 25
          ? 'Moderate'
          : 'Low';

  const floodLevelPct = Math.min(100, Math.round(dangerScore * 0.92 + (loc?.hasWaterSurface ? 8 : 0)));
  const floodLevelLabel: SimulationResults['floodLevelLabel'] =
    floodLevelPct >= 82
      ? 'Rooftop'
      : floodLevelPct >= 62
        ? 'Chest'
        : floodLevelPct >= 42
          ? 'Waist'
          : floodLevelPct >= 22
            ? 'Knee'
            : 'Ankle';

  const riversOverflowed = Math.max(0, Math.round((dangerScore / 20) * (inputs.terrain === 'River delta' ? 1.8 : 1.0)));
  const roadsFlooded = Math.round((dangerScore * 1.4 + durationDays * 6) * (inputs.populationDensity === 'Megacity' ? 2.4 : 1.0));
  const bridgesDamaged = Math.max(0, Math.round((dangerScore - 22) * 0.18 * terrainMult));
  const powerOutageHours = Math.round(inputs.durationHours * (0.18 + windNorm * 0.45 + intNorm * 0.22));
  const buildingDamagePct = Math.min(96, Math.round(dangerScore * 0.65 + windNorm * 22));

  const peopleAffected = Math.round((dangerScore * 280 + totalRainfallMm * 14) * popMult);
  const peopleDisplaced = Math.round(peopleAffected * Math.min(0.68, floodLevelPct / 135));
  const injuries = Math.round(peopleAffected * (0.008 + windNorm * 0.014));
  const deaths = Math.max(0, Math.round(injuries * (dangerScore > 65 ? 0.14 : 0.04)));

  const animalsAffected = Math.round(
    (dangerScore * 190 + totalRainfallMm * 9) * (inputs.populationDensity === 'Rural' ? 2.4 : 0.95)
  );
  const animalsLost = Math.round(animalsAffected * (floodLevelPct / 240));
  const cropLossPct = Math.min(
    98,
    Math.round(
      (floodLevelPct * 0.7 + durationDays * 2.2) *
        (inputs.terrain === 'Plains' || inputs.terrain === 'River delta' ? 1.25 : 0.78)
    )
  );

  const gasLeaks = Math.max(0, Math.round((dangerScore - 30) * 0.22 * (inputs.populationDensity === 'Megacity' ? 2.2 : 0.7)));
  const fires = Math.max(0, Math.round(gasLeaks * 0.45 + windNorm * 3));
  const landslides =
    inputs.terrain === 'Hills' || inputs.terrain === 'Mountain valley'
      ? Math.max(1, Math.round((dangerScore / 14) * 1.6))
      : Math.max(0, Math.round((dangerScore - 55) * 0.15));

  // Health Outbreaks scaled by flood duration, sanitation, and population density
  const stagnationFactor = Math.min(3.5, 0.35 + durationDays * 0.24) * sanMult * (0.55 + popMult * 0.35);
  const choleraCases = dangerScore > 28 ? Math.round(dangerScore * 3.4 * stagnationFactor) : 0;
  const diarrheaCases = Math.round(dangerScore * 9.5 * stagnationFactor);
  const typhoidCases = dangerScore > 24 ? Math.round(dangerScore * 2.6 * stagnationFactor) : 0;
  const dengueCases = Math.round((durationDays * 26 + floodLevelPct * 1.8) * sanMult * (0.6 + popMult * 0.3));
  const leptospirosisCases = dangerScore > 30 ? Math.round(floodLevelPct * 1.9 * stagnationFactor) : 0;
  const skinInfectionCases = Math.round(peopleDisplaced * 0.045 * sanMult);
  const respiratoryCases = Math.round(peopleDisplaced * 0.055 * (inputs.timeMode === 'night' ? 1.3 : 1.0));

  const hospitalOverloadPct = Math.min(
    100,
    Math.round(18 + (choleraCases + diarrheaCases + injuries) / Math.max(60, 180 * popMult))
  );
  const medicineShortagePct = Math.min(
    100,
    Math.round(hospitalOverloadPct * 0.78 * (inputs.sanitation === 'Poor' ? 1.25 : 0.9))
  );

  const healthEmergencyScore = Math.min(
    100,
    Math.round(hospitalOverloadPct * 0.55 + medicineShortagePct * 0.25 + Math.min(20, sanMult * 8))
  );

  // Build 5-moment chronological disaster story timeline
  const floodPool = DISASTER_SCENES.filter((s) => s.category === 'flood');
  const infraPool = DISASTER_SCENES.filter((s) => s.category === 'infrastructure' || s.category === 'hazard');
  const healthPool = DISASTER_SCENES.filter((s) => s.category === 'health');
  const humanPool = DISASTER_SCENES.filter((s) => s.category === 'human');

  const pickByDanger = (pool: DisasterScene[], offset: number) => {
    const idx = Math.min(pool.length - 1, Math.floor((dangerScore / 100) * pool.length * 0.75 + offset) % pool.length);
    return pool[idx];
  };

  const chosenScenes: DisasterScene[] = [
    inputs.terrain === 'Hills' || inputs.terrain === 'Mountain valley'
      ? DISASTER_SCENES[11] // hillside-landslide
      : inputs.terrain === 'Coastal'
        ? DISASTER_SCENES[10] // coastal-surge
        : pickByDanger(floodPool, 0),
    pickByDanger(infraPool, 1),
    pickByDanger(humanPool, 2),
    pickByDanger(healthPool, inputs.sanitation === 'Poor' ? 2 : 0),
    dangerScore >= 75
      ? DISASTER_SCENES[63] // aerial-flooded-city
      : DISASTER_SCENES[64], // first-clean-sunrise
  ];

  const timeline: TimelineKeyframe[] = chosenScenes.map((scene, i) => {
    const progress = i / (chosenScenes.length - 1);
    return {
      index: i,
      label: formatDayHour(inputs.startHour, progress * inputs.durationHours),
      progress,
      scene,
    };
  });

  return {
    dangerScore,
    healthEmergencyScore,
    severityLabel,
    totalRainfallMm,
    floodLevelLabel,
    floodLevelPct,
    riversOverflowed,
    roadsFlooded,
    bridgesDamaged,
    powerOutageHours,
    buildingDamagePct,
    peopleAffected,
    peopleDisplaced,
    injuries,
    deaths,
    animalsAffected,
    animalsLost,
    cropLossPct,
    gasLeaks,
    fires,
    landslides,
    choleraCases,
    diarrheaCases,
    typhoidCases,
    dengueCases,
    leptospirosisCases,
    skinInfectionCases,
    respiratoryCases,
    hospitalOverloadPct,
    medicineShortagePct,
    timeline,
  };
}
