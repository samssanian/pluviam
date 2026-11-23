export type LogoAnimationId =
  | 'droplet-cascade'
  | 'rippling-reflection'
  | 'neon-wet-glass'
  | 'condensation-reveal'
  | 'lightning-flash'
  | 'puddle-bloom'
  | 'wind-swept-mist'
  | 'prismatic-shower';

export interface LogoAnimationOption {
  id: LogoAnimationId;
  name: string;
  description: string;
}

export const LOGO_ANIMATIONS: LogoAnimationOption[] = [
  {
    id: 'droplet-cascade',
    name: 'Droplet Cascade',
    description: 'Rain droplets fall through the glassy letters, ripple on edges, and slide down in glowing trails.',
  },
  {
    id: 'rippling-reflection',
    name: 'Rippling Reflection',
    description: 'Crisp typography suspended above a shimmering, continuously rippling water mirror.',
  },
  {
    id: 'neon-wet-glass',
    name: 'Neon Wet Glass',
    description: 'Electric wet-glass rim glow with nocturnal neon flicker and humid vapor sheen.',
  },
  {
    id: 'condensation-reveal',
    name: 'Condensation Reveal',
    description: 'Frosted window mist clears along vertical droplet trails to reveal the brand beneath.',
  },
  {
    id: 'lightning-flash',
    name: 'Lightning Strike Flash',
    description: 'Storm-lit silhouette pierced by crisp electric flashes and silver edge highlights.',
  },
  {
    id: 'puddle-bloom',
    name: 'Puddle Bloom',
    description: 'Letters emerge outward from expanding concentric water ripple rings.',
  },
  {
    id: 'wind-swept-mist',
    name: 'Wind-Swept Mist',
    description: 'Gentle gale streaks and silver mist drift across swaying glass letterforms.',
  },
  {
    id: 'prismatic-shower',
    name: 'Prismatic Sun Shower',
    description: 'Refracted rainbow spectrum shimmer glides across wet glass with soft bokeh motes.',
  },
];

export const DEFAULT_LOGO_ANIMATION: LogoAnimationId = 'droplet-cascade';
export const LOGO_STORAGE_KEY = 'rain_bristi_logo_animation';

export function getSavedLogoAnimation(): LogoAnimationId {
  try {
    const saved = localStorage.getItem(LOGO_STORAGE_KEY);
    if (saved && LOGO_ANIMATIONS.some((a) => a.id === saved)) {
      return saved as LogoAnimationId;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_LOGO_ANIMATION;
}

export function saveLogoAnimation(id: LogoAnimationId) {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, id);
  } catch {
    // ignore storage errors
  }
}
