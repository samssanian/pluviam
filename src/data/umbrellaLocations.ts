export interface UmbrellaLocation {
  id: string;
  name: string;
  region: string;
  category: 'historic' | 'urban' | 'nature' | 'transit';
  atmosphere: string;
  groundLevel: number; // fraction from top (0.72 to 0.80)
  hasLanterns?: boolean;
  hasNeon?: boolean;
  hasWater?: boolean;
  hasSteps?: boolean;
  hasSignal?: boolean;
  hasDoorway?: boolean;
}

export interface UmbrellaPalette {
  id: string;
  name: string;
  colors: string[];
  swatch: string;
}

export const UMBRELLA_PALETTES: UmbrellaPalette[] = [
  {
    id: 'vibrant',
    name: 'Vibrant Multi',
    colors: ['#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#fb7185'],
    swatch: '#ef4444',
  },
  {
    id: 'crimson-amber',
    name: 'Crimson & Amber',
    colors: ['#dc2626', '#ea580c', '#f59e0b', '#be123c', '#991b1b', '#fbbf24'],
    swatch: '#dc2626',
  },
  {
    id: 'noir',
    name: 'Monochrome Noir',
    colors: ['#0f172a', '#1e293b', '#334155', '#475569', '#020617', '#64748b'],
    swatch: '#1e293b',
  },
  {
    id: 'pastel',
    name: 'Pastel Blossom',
    colors: ['#fda4af', '#bae6fd', '#fde68a', '#bbf7d0', '#ddd6fe', '#fbcfe8'],
    swatch: '#fda4af',
  },
  {
    id: 'translucent',
    name: 'Clear Glass',
    colors: [
      'rgba(224, 242, 254, 0.55)',
      'rgba(186, 230, 253, 0.55)',
      'rgba(241, 245, 249, 0.52)',
      'rgba(207, 250, 254, 0.55)',
    ],
    swatch: '#bae6fd',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    colors: ['#22d3ee', '#e879f9', '#f43f5e', '#a3e635', '#38bdf8', '#c084fc'],
    swatch: '#22d3ee',
  },
];

export const UMBRELLA_LOCATIONS: UmbrellaLocation[] = [
  {
    id: 'old-town-bazaar',
    name: 'Old Town Bazaar',
    region: 'Lantern Arcade',
    category: 'historic',
    atmosphere: 'Arched stone awnings, hanging brass lamps & wet flagstones',
    groundLevel: 0.78,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'japanese-alley',
    name: 'Japanese Alley',
    region: 'Kyoto Yokocho',
    category: 'urban',
    atmosphere: 'Paper chochin lanterns, timber eaves & glowing shopfronts',
    groundLevel: 0.78,
    hasLanterns: true,
    hasNeon: true,
    hasDoorway: true,
  },
  {
    id: 'neon-cyber-city',
    name: 'Neon Cyber City',
    region: 'District 04',
    category: 'urban',
    atmosphere: 'Holographic billboards & electric magenta puddle glare',
    groundLevel: 0.77,
    hasNeon: true,
    hasSignal: true,
  },
  {
    id: 'modern-city-crossing',
    name: 'Modern City Crossing',
    region: 'Downtown Avenue',
    category: 'urban',
    atmosphere: 'Zebra crosswalks, traffic signals & glass towers',
    groundLevel: 0.77,
    hasNeon: true,
    hasSignal: true,
  },
  {
    id: 'village-mud-road',
    name: 'Village Mud Road',
    region: 'Countryside Lane',
    category: 'nature',
    atmosphere: 'Thatched cottages, wooden fences & deep muddy puddles',
    groundLevel: 0.76,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'rice-field-path',
    name: 'Rice-Field Path',
    region: 'Terraced Valley',
    category: 'nature',
    atmosphere: 'Raised earthen footpath between flooded mirror paddies',
    groundLevel: 0.75,
    hasWater: true,
  },
  {
    id: 'train-station-platform',
    name: 'Busy Train Station Platform',
    region: 'Central Terminal',
    category: 'transit',
    atmosphere: 'Overhanging iron roof, departure clock & commuters hurrying',
    groundLevel: 0.78,
    hasLanterns: true,
    hasSignal: true,
  },
  {
    id: 'rooftop-cafe',
    name: 'Rooftop Cafe',
    region: 'Skyline Terrace',
    category: 'urban',
    atmosphere: 'Bistro string lights, striped awning & city skyline',
    groundLevel: 0.78,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'lakeside-promenade',
    name: 'Lakeside Promenade',
    region: 'Waterfront Walk',
    category: 'nature',
    atmosphere: 'Stone balustrade, iron lamps & calm misty lake',
    groundLevel: 0.75,
    hasWater: true,
    hasLanterns: true,
  },
  {
    id: 'temple-courtyard',
    name: 'Temple Courtyard',
    region: 'Sanctuary Grounds',
    category: 'historic',
    atmosphere: 'Curved pagoda eaves, stone lanterns & tranquil rain',
    groundLevel: 0.78,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'college-campus',
    name: 'College Campus',
    region: 'Ivy Quad',
    category: 'historic',
    atmosphere: 'Brick arches, oak trees & students crossing the quad',
    groundLevel: 0.77,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'market-street',
    name: 'Market Street',
    region: 'Evening Quarter',
    category: 'urban',
    atmosphere: 'Canvas vendor stalls, warm bulbs & bustling foot traffic',
    groundLevel: 0.78,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'stone-bridge',
    name: 'Stone Bridge',
    region: 'Old Canal Crossing',
    category: 'historic',
    atmosphere: 'Arched stone parapet & lantern reflections over water',
    groundLevel: 0.75,
    hasWater: true,
    hasLanterns: true,
  },
  {
    id: 'harbour-dock',
    name: 'Harbour Dock',
    region: 'Pier 12',
    category: 'transit',
    atmosphere: 'Timber pilings, distant lighthouse & moored boat masts',
    groundLevel: 0.76,
    hasWater: true,
    hasLanterns: true,
  },
  {
    id: 'park-garden-lane',
    name: 'Park Garden Lane',
    region: 'Botanical Walk',
    category: 'nature',
    atmosphere: 'Tree-lined gravel path, wrought-iron benches & hedges',
    groundLevel: 0.77,
    hasLanterns: true,
  },
  {
    id: 'autumn-street',
    name: 'Autumn Street',
    region: 'Maple Boulevard',
    category: 'nature',
    atmosphere: 'Amber maples shedding wet leaves across glistening sidewalks',
    groundLevel: 0.77,
    hasLanterns: true,
  },
  {
    id: 'snow-village-lane',
    name: 'Snow Village Lane',
    region: 'Nordic Hamlet',
    category: 'historic',
    atmosphere: 'Frosted gables, warm hearth windows & slushy cobbles',
    groundLevel: 0.78,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'mountain-village-steps',
    name: 'Mountain Village Steps',
    region: 'Hillside Ascent',
    category: 'historic',
    atmosphere: 'Tiered stone staircases climbing through misty cottages',
    groundLevel: 0.77,
    hasSteps: true,
    hasLanterns: true,
  },
  {
    id: 'beach-boardwalk',
    name: 'Beach Boardwalk',
    region: 'Coastal Pier',
    category: 'nature',
    atmosphere: 'Weathered timber planks, ocean surf & sweeping wind gusts',
    groundLevel: 0.76,
    hasWater: true,
    hasLanterns: true,
  },
  {
    id: 'narrow-balcony-lane',
    name: 'Narrow Old Lane with Balconies',
    region: 'Mediterranean Alley',
    category: 'historic',
    atmosphere: 'Wrought-iron balconies overhead & dripping flower boxes',
    groundLevel: 0.79,
    hasLanterns: true,
    hasDoorway: true,
  },
  {
    id: 'metro-entrance-stairs',
    name: 'Metro Entrance Stairs',
    region: 'Underground Plaza',
    category: 'transit',
    atmosphere: 'Illuminated subway sign, descending stairs & commuters',
    groundLevel: 0.78,
    hasSteps: true,
    hasNeon: true,
    hasDoorway: true,
  },
  {
    id: 'tea-stall-roadside',
    name: 'Tea Stall Roadside',
    region: 'Monsoon Corner',
    category: 'historic',
    atmosphere: 'Steaming kettle glow, tin awning & rain-soaked tarmac',
    groundLevel: 0.78,
    hasLanterns: true,
    hasDoorway: true,
  },
];

export const UMBRELLA_LOCATION_MAP: Record<string, UmbrellaLocation> = Object.fromEntries(
  UMBRELLA_LOCATIONS.map((l) => [l.id, l])
);
