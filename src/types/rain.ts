export type TimeMode = 'day' | 'noon' | 'afternoon' | 'night';

export type RainCategory =
  | 'all'
  | 'natural'
  | 'storm'
  | 'atmospheric'
  | 'frozen'
  | 'stylized';

export type ParticleShape =
  | 'streak'
  | 'dot'
  | 'needle'
  | 'ice'
  | 'hail'
  | 'mixed'
  | 'sparkle'
  | 'spiral'
  | 'drip';

export type SoundProfile =
  | 'soft-mist'
  | 'light-patter'
  | 'steady-rain'
  | 'heavy-downpour'
  | 'thunder-storm'
  | 'hail-clatter'
  | 'rooftop-drip'
  | 'wind-howl'
  | 'crystalline';

export interface RainRecipe {
  id: string;
  name: string;
  category: Exclude<RainCategory, 'all'>;
  subtitle: string;
  shape: ParticleShape;
  density: number; // 0.15 to 2.5 multiplier
  speedMin: number; // px/sec base
  speedMax: number;
  lengthMin: number;
  lengthMax: number;
  thickness: number;
  angleBias: number; // base angle in degrees
  windResponse: number; // 0.1 to 2.2
  splashIntensity: number; // 0 to 1.8
  rippleRate: number; // 0 to 2.0
  rippleMaxRadius: number;
  fogBoost: number; // 0 to 0.75
  cloudDarkness: number; // 0 to 0.85
  lightningFreq: number; // 0 to 1.0
  colorTint: string; // rgba or hex tint
  secondaryTint?: string;
  soundProfile: SoundProfile;
  // Special effects
  hasRainbow?: boolean;
  hasSunbeams?: boolean;
  hasGlassDroplets?: boolean;
  hasUmbrella?: boolean;
  hasRooftopEaves?: boolean;
  hasPetrichorSparkle?: boolean;
  hasSpiralVortex?: boolean;
  vortexStrength?: number;
  hasNeonGlow?: boolean;
  hasBokeh?: boolean;
  snowMixRatio?: number; // 0 to 1
}

export type LocationCategory =
  | 'all'
  | 'forest'
  | 'urban'
  | 'water'
  | 'tranquil';

export interface LocationConfig {
  id: string;
  name: string;
  region: string;
  category: Exclude<LocationCategory, 'all'>;
  atmosphere: string;
  groundLevel: number; // fraction from top (0.72 to 0.86)
  horizonHaze: number; // 0 to 1
  accentColor: string;
  reflectionStrength: number; // 0 to 1
  hasNeonLights?: boolean;
  hasWarmLanterns?: boolean;
  hasWaterSurface?: boolean;
  hasFoliageSway?: boolean;
  hasSteamOrMist?: boolean;
  defaultRainId?: string;
}

export interface TimePalette {
  id: TimeMode;
  label: string;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  cloudLight: string;
  cloudShadow: string;
  fogColor: string;
  groundTint: string;
  waterTint: string;
  ambientLightAlpha: number;
  celestialType: 'sun' | 'high-sun' | 'golden-sun' | 'moon';
  celestialColor: string;
  celestialGlow: string;
  accentHex: string;
  accentSoft: string;
  isDark: boolean;
  ambientParticles: 'birds' | 'haze' | 'bokeh' | 'fireflies';
}
