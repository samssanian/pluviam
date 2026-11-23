export type DisasterCategory = 'flood' | 'infrastructure' | 'hazard' | 'health' | 'human';
export type SeverityLevel = 'Low' | 'Moderate' | 'Severe' | 'Catastrophic';

export interface DisasterScene {
  id: string;
  number: number;
  title: string;
  category: DisasterCategory;
  severity: SeverityLevel;
  description: string;
  isHealth?: boolean;
  waterDepth: number; // 0.08 to 0.72 fraction of lower scene
  hasSparks?: boolean;
  hasFire?: boolean;
  hasGas?: boolean;
  hasLandslide?: boolean;
  hasFogging?: boolean;
  hasBoat?: boolean;
  hasSiren?: boolean;
  hasSunrise?: boolean;
  hasCandles?: boolean;
}

export const DISASTER_SCENES: DisasterScene[] = [
  // RAIN / FLOOD (1-14)
  { id: 'street-flooding', number: 1, title: 'Street Flooding', category: 'flood', severity: 'Moderate', description: 'Water climbs from ankle to waist depth across neighborhood streets.', waterDepth: 0.34 },
  { id: 'river-overflow', number: 2, title: 'River Overflowing Banks', category: 'flood', severity: 'Severe', description: 'Swollen riverbanks breach onto surrounding embankments.', waterDepth: 0.44 },
  { id: 'village-underwater', number: 3, title: 'Village Underwater', category: 'flood', severity: 'Catastrophic', description: 'Only pitched rooftops remain visible above dark floodwaters.', waterDepth: 0.62 },
  { id: 'bridge-submerged', number: 4, title: 'Bridge Partially Collapsed', category: 'flood', severity: 'Catastrophic', description: 'Raging currents undermine and fracture a concrete river span.', waterDepth: 0.5 },
  { id: 'road-sinkhole', number: 5, title: 'Road Washed Away & Sinkhole', category: 'flood', severity: 'Severe', description: 'Subsurface runoff carves a sudden chasm across asphalt.', waterDepth: 0.3 },
  { id: 'underpass-flooded', number: 6, title: 'Underpass Completely Flooded', category: 'flood', severity: 'Severe', description: 'Submerged roadway traps half-sunken vehicles below overpass.', waterDepth: 0.54 },
  { id: 'market-river', number: 7, title: 'Market Street Turned River', category: 'flood', severity: 'Severe', description: 'Shopfronts sit waist-deep while wooden boats navigate the lane.', waterDepth: 0.42, hasBoat: true },
  { id: 'farmland-flooded', number: 8, title: 'Farmland & Crops Underwater', category: 'flood', severity: 'Moderate', description: 'Standing rain submerges seasonal harvests across open plains.', waterDepth: 0.38 },
  { id: 'muddy-current', number: 9, title: 'Muddy Floodwater Debris Current', category: 'flood', severity: 'Severe', description: 'Fast silt-heavy water sweeps timber and debris downstream.', waterDepth: 0.46 },
  { id: 'dam-overflow', number: 10, title: 'Dam Embankment Overflowing', category: 'flood', severity: 'Catastrophic', description: 'Spillways roar as reservoir water crests protective levees.', waterDepth: 0.56 },
  { id: 'coastal-surge', number: 11, title: 'Coastal Storm Surge', category: 'flood', severity: 'Catastrophic', description: 'Wind-driven sea surge floods beachfront homes and piers.', waterDepth: 0.52 },
  { id: 'hillside-landslide', number: 12, title: 'Hillside Landslide', category: 'flood', severity: 'Catastrophic', description: 'Saturated slopes give way, sending mud and boulders downhill.', waterDepth: 0.28, hasLandslide: true },
  { id: 'flash-flood-wall', number: 13, title: 'Flash Flood Wall', category: 'flood', severity: 'Catastrophic', description: 'A sudden foaming wall of water sweeps down a steep street.', waterDepth: 0.58 },
  { id: 'megacity-waterlogging', number: 14, title: 'Megacity Waterlogging', category: 'flood', severity: 'Moderate', description: 'Stalled headlights glow across flooded multi-lane avenues.', waterDepth: 0.32 },

  // INFRASTRUCTURE (15-25)
  { id: 'power-lines-sparking', number: 15, title: 'Power Lines Sparking in Wind', category: 'infrastructure', severity: 'Severe', description: 'High-voltage cables whip and arc above wet pavement.', waterDepth: 0.24, hasSparks: true },
  { id: 'transformer-explosion', number: 16, title: 'Transformer Exploding in Rain', category: 'infrastructure', severity: 'Severe', description: 'Blue electrical arc flashes violently across rain sheets.', waterDepth: 0.26, hasSparks: true },
  { id: 'city-blackout', number: 17, title: 'City Block-by-Block Blackout', category: 'infrastructure', severity: 'Severe', description: 'District lights extinguish progressively into storm darkness.', waterDepth: 0.28 },
  { id: 'wall-collapse', number: 18, title: 'Building Wall Collapsing', category: 'infrastructure', severity: 'Catastrophic', description: 'Water-weakened masonry shears into the flooded roadway.', waterDepth: 0.36 },
  { id: 'tin-roof-collapse', number: 19, title: 'Old Tin-Roof House Collapsing', category: 'infrastructure', severity: 'Severe', description: 'Corrugated roofing buckles under relentless downpour and wind.', waterDepth: 0.35 },
  { id: 'building-cracking', number: 20, title: 'Multi-Storey Structural Crack', category: 'infrastructure', severity: 'Catastrophic', description: 'Foundation washout fractures a mid-rise facade.', waterDepth: 0.34 },
  { id: 'tree-uprooted', number: 21, title: 'Uprooted Tree Across Road', category: 'infrastructure', severity: 'Moderate', description: 'Saturated soil releases a tall roadside tree across traffic.', waterDepth: 0.25 },
  { id: 'pole-wires-water', number: 22, title: 'Fallen Power Pole in Water', category: 'infrastructure', severity: 'Catastrophic', description: 'Live wires hiss and spark along flooded curb edges.', waterDepth: 0.34, hasSparks: true },
  { id: 'billboards-ripping', number: 23, title: 'Signboards Ripping in Wind', category: 'infrastructure', severity: 'Moderate', description: 'Sheet-metal signs tear loose into storm gusts.', waterDepth: 0.22 },
  { id: 'crane-toppling', number: 24, title: 'Construction Crane Toppling', category: 'infrastructure', severity: 'Catastrophic', description: 'Extreme crosswinds buckle a high-rise tower crane.', waterDepth: 0.26, hasSparks: true },
  { id: 'water-tank-collapse', number: 25, title: 'Rooftop Water Tank Collapsing', category: 'infrastructure', severity: 'Severe', description: 'Overburdened rooftop supports give way in heavy squalls.', waterDepth: 0.3 },

  // GAS / FIRE / HAZARD (26-31)
  { id: 'gas-pipe-bubbles', number: 26, title: 'Gas Leak Bubbling Underground', category: 'hazard', severity: 'Severe', description: 'Ruptured mains vent turbulent gas bubbles through floodwater.', waterDepth: 0.38, hasGas: true },
  { id: 'gas-main-rupture', number: 27, title: 'Gas Main Rupture & Evacuation', category: 'hazard', severity: 'Catastrophic', description: 'Visible vapor haze spreads as emergency sirens sound.', waterDepth: 0.34, hasGas: true, hasSiren: true },
  { id: 'short-circuit-fire', number: 28, title: 'Short-Circuit Fire in Rain', category: 'hazard', severity: 'Severe', description: 'Electrical fire glows orange against wet concrete walls.', waterDepth: 0.26, hasFire: true, hasSparks: true },
  { id: 'fuel-spill-fire', number: 29, title: 'Fuel Spill Fire on Floodwater', category: 'hazard', severity: 'Catastrophic', description: 'Drifting fuel slick ignites across dark standing water.', waterDepth: 0.42, hasFire: true },
  { id: 'acid-corrosion', number: 30, title: 'Acid Rain Corroding Vehicles', category: 'hazard', severity: 'Severe', description: 'Toxic chartreuse precipitation pits metal surfaces in haze.', waterDepth: 0.24, hasGas: true },
  { id: 'sewage-overflow', number: 31, title: 'Sewage Overflow Contamination', category: 'hazard', severity: 'Severe', description: 'Backed-up storm drains contaminate flooded neighborhood lanes.', waterDepth: 0.4, hasGas: true },

  // HEALTH / DISEASE OUTBREAK (32-48)
  { id: 'cholera-ort', number: 32, title: 'Cholera Outbreak — ORT Corner', category: 'health', severity: 'Catastrophic', description: 'Oral rehydration clinic tent packed with IV stands and medics.', isHealth: true, waterDepth: 0.28 },
  { id: 'diarrhea-queue', number: 33, title: 'Diarrhea Outbreak — Mobile Camp', category: 'health', severity: 'Severe', description: 'Families queue beneath rain tarps outside a mobile health station.', isHealth: true, waterDepth: 0.26 },
  { id: 'typhoid-shelter', number: 34, title: 'Typhoid Outbreak in Shelter', category: 'health', severity: 'Severe', description: 'Fever patients rest on floor mats inside a crowded relief hall.', isHealth: true, waterDepth: 0.24 },
  { id: 'dengue-swarm', number: 35, title: 'Dengue Outbreak & Fogging', category: 'health', severity: 'Severe', description: 'Stagnant water breeds mosquitoes as fogging trucks spray mist.', isHealth: true, waterDepth: 0.36, hasFogging: true },
  { id: 'leptospirosis-warning', number: 36, title: 'Leptospirosis Flood Warning', category: 'health', severity: 'Severe', description: 'Biohazard markers warn against wading barefoot in contaminated water.', isHealth: true, waterDepth: 0.38 },
  { id: 'skin-infection-tent', number: 37, title: 'Skin Infection Clinic Tent', category: 'health', severity: 'Moderate', description: 'Medics treat water-immersion rashes inside a lit field tent.', isHealth: true, waterDepth: 0.28 },
  { id: 'respiratory-shelter', number: 38, title: 'Respiratory Illness in Cold Shelter', category: 'health', severity: 'Severe', description: 'Damp cold nights trigger respiratory infections in dense shelters.', isHealth: true, waterDepth: 0.22 },
  { id: 'waterborne-camp', number: 39, title: 'Waterborne Disease & Chlorine Camp', category: 'health', severity: 'Moderate', description: 'Boiled-water barrels and chlorine tablets distributed under tarps.', isHealth: true, waterDepth: 0.26 },
  { id: 'hospital-overload', number: 40, title: 'Hospital Corridor Overload', category: 'health', severity: 'Catastrophic', description: 'Emergency ward lights pulse as staff rush between overflow beds.', isHealth: true, waterDepth: 0.2, hasSiren: true },
  { id: 'ambulance-stuck', number: 41, title: 'Ambulance Stuck in Floodwater', category: 'health', severity: 'Catastrophic', description: 'Flashing red-blue beacons reflect on deep water as medics wade.', isHealth: true, waterDepth: 0.44, hasSiren: true },
  { id: 'memorial-tent', number: 42, title: 'Casualty Triage Canopy', category: 'health', severity: 'Catastrophic', description: 'Respectful silhouetted medical canopy under solemn night rain.', isHealth: true, waterDepth: 0.24 },
  { id: 'night-mosquito-fogging', number: 43, title: 'Night Mosquito Fogging Street', category: 'health', severity: 'Moderate', description: 'Thick white insecticide clouds drift beneath streetlamps.', isHealth: true, waterDepth: 0.3, hasFogging: true },
  { id: 'contaminated-water-markers', number: 44, title: 'Standing Water Bio-Hazard Markers', category: 'health', severity: 'Severe', description: 'Warning flags mark stagnant contaminated pools for cleanup.', isHealth: true, waterDepth: 0.36 },
  { id: 'medical-boat', number: 45, title: 'Mobile Medical Boat', category: 'health', severity: 'Severe', description: 'Doctors navigate submerged lanes to deliver medicine to villages.', isHealth: true, waterDepth: 0.52, hasBoat: true },
  { id: 'vaccine-queue', number: 46, title: 'Medicine & Vaccine Shelter Queue', category: 'health', severity: 'Moderate', description: 'Residents line up under a translucent glass relief awning.', isHealth: true, waterDepth: 0.24 },
  { id: 'hygiene-station', number: 47, title: 'Relief Camp Hygiene Station', category: 'health', severity: 'Moderate', description: 'Handwashing tanks and clean-water taps prevent secondary spread.', isHealth: true, waterDepth: 0.22 },
  { id: 'sanitation-breach-warning', number: 48, title: 'Sanitation Breach Hazard Zone', category: 'health', severity: 'Severe', description: 'High-risk contamination markers isolate overflowed drainage zones.', isHealth: true, waterDepth: 0.4, hasGas: true },

  // HUMAN / ANIMAL IMPACT (49-65)
  { id: 'rooftop-stranded', number: 49, title: 'Stranded on Rooftops Waving', category: 'human', severity: 'Catastrophic', description: 'Families signal from elevated roofs surrounded by rising water.', waterDepth: 0.6 },
  { id: 'rescue-boat-street', number: 50, title: 'Rescue Boat on Flooded Street', category: 'human', severity: 'Severe', description: 'Searchlights sweep storefronts from an inflatable rescue craft.', waterDepth: 0.48, hasBoat: true, hasSiren: true },
  { id: 'wading-chest-deep', number: 51, title: 'Wading Chest-Deep with Belongings', category: 'human', severity: 'Severe', description: 'Residents carry dry bundles overhead through murky currents.', waterDepth: 0.46 },
  { id: 'family-evacuation', number: 52, title: 'Family Evacuating Together', category: 'human', severity: 'Severe', description: 'Parents lift children onto shoulders while moving to higher ground.', waterDepth: 0.4 },
  { id: 'injured-carried', number: 53, title: 'Injured Carried Through Water', category: 'human', severity: 'Catastrophic', description: 'Neighbors bear a stretcher carefully toward dry ground.', waterDepth: 0.38 },
  { id: 'stray-pets-debris', number: 54, title: 'Stray Dogs & Cats on Debris', category: 'human', severity: 'Moderate', description: 'Stranded pets cling to floating timber rafts in the rain.', waterDepth: 0.46 },
  { id: 'cattle-trapped', number: 55, title: 'Cattle & Goats in Flooded Fields', category: 'human', severity: 'Severe', description: 'Livestock gather on a shrinking earthen mound amid floodwaters.', waterDepth: 0.44 },
  { id: 'birds-scattered', number: 56, title: 'Birds Scattered in Squalls', category: 'human', severity: 'Low', description: 'Flocks shelter along eaves as gusting rain sweeps branches.', waterDepth: 0.2 },
  { id: 'fish-on-roads', number: 57, title: 'Fish Washed onto Roads', category: 'human', severity: 'Low', description: 'Overflowing ponds spill darting fish across shallow street water.', waterDepth: 0.28 },
  { id: 'displaced-snakes', number: 58, title: 'Snakes Displaced into Floodwater', category: 'human', severity: 'Severe', description: 'Wildlife seeks dry perches along doorways and floating logs.', waterDepth: 0.4 },
  { id: 'shelter-crowd-surge', number: 59, title: 'Crowded Shelter Entry Surge', category: 'human', severity: 'Severe', description: 'Hundreds press toward elevated dry steps as storms intensify.', waterDepth: 0.34 },
  { id: 'swift-water-rescue', number: 60, title: 'Fast-Current Rescue Line', category: 'human', severity: 'Catastrophic', description: 'Rescuers cast ropes across surging street currents.', waterDepth: 0.5 },
  { id: 'night-torch-rescue', number: 61, title: 'Night Rescue with Torches', category: 'human', severity: 'Catastrophic', description: 'Sweeping flashlight beams and siren strobes cut through dark rain.', waterDepth: 0.48, hasBoat: true, hasSiren: true },
  { id: 'aftermath-lantern', number: 62, title: 'Silent Aftermath — One Lantern', category: 'human', severity: 'Moderate', description: 'Storm subsides over debris-strewn streets lit by a single lamp.', waterDepth: 0.26 },
  { id: 'memorial-candles', number: 63, title: 'Floating Memorial Candles', category: 'human', severity: 'Low', description: 'Warm candlelights drift quietly across calm evening floodwater.', waterDepth: 0.32, hasCandles: true },
  { id: 'aerial-flooded-city', number: 64, title: 'Aerial View — Half-Submerged City', category: 'human', severity: 'Catastrophic', description: 'High-altitude view of darkened blocks and tiny rescue boat lights.', waterDepth: 0.56, hasBoat: true },
  { id: 'first-clean-sunrise', number: 65, title: 'First Clean Sunrise After Flood', category: 'human', severity: 'Low', description: 'Golden mist rises as survivors watch dawn from dry rooftops.', waterDepth: 0.38, hasSunrise: true },
];

export const DISASTER_SCENE_MAP: Record<string, DisasterScene> = Object.fromEntries(
  DISASTER_SCENES.map((s) => [s.id, s])
);
