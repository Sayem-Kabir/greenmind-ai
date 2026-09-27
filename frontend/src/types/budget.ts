import type { SensorRecommendation } from "./recommendation";

export type SensorTier = "air" | "water" | "noise";

export type OptimizationStrategy =
  | "balanced"
  | "coverage"
  | "precision"
  | "traffic";

export interface TierConfig {
  tier: SensorTier;
  name: string;
  badge: string;
  unitCost: number;
  annualOm: number;
  radiusKm: number;
  confidence: number;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

export const TIER_CONFIGS: Record<SensorTier, TierConfig> = {
  air: {
    tier: "air",
    name: "Air Quality Sensor",
    badge: "Air Quality",
    unitCost: 4500,
    annualOm: 600,
    radiusKm: 2.0,
    confidence: 90,
    description:
      "Multipollutant optical particulate (PM2.5/PM10) and electrochemical gas (NO2, SO2, O3) telemetry station.",
    color: "#0284c7",
    borderColor: "#38bdf8",
    bgColor: "#f0f9ff",
  },
  water: {
    tier: "water",
    name: "Water Quality Sensor",
    badge: "Water Quality",
    unitCost: 6200,
    annualOm: 800,
    radiusKm: 1.5,
    confidence: 92,
    description:
      "Submersible aquatic probe tracking pH, dissolved oxygen, electrical conductivity, turbidity, and chemical runoff.",
    color: "#0d9488",
    borderColor: "#14b8a6",
    bgColor: "#f0fdfa",
  },
  noise: {
    tier: "noise",
    name: "Noise Pollution Sensor",
    badge: "Noise Sensor",
    unitCost: 2800,
    annualOm: 350,
    radiusKm: 1.0,
    confidence: 85,
    description:
      "Precision acoustic Class 1/2 sound level sensor tracking continuous dBA noise levels and peak disturbance patterns.",
    color: "#7c3aed",
    borderColor: "#a855f7",
    bgColor: "#faf5ff",
  },
};

export interface OptimizedStation extends SensorRecommendation {
  sensorTier: SensorTier;
  tierName: string;
  tierBadge: string;
  unitCost: number;
  annualOm: number;
  effectiveRadiusKm: number;
  confidenceRating: number;
  placementRationale: string;
  tierDescription: string;
}

export interface PortfolioTradeoffComparison {
  name: string;
  badge: string;
  description: string;
  strategy: OptimizationStrategy;
  totalBudget: number;
  allocatedSpend: number;
  remainingBudget: number;
  budgetUtilizationPercent: number;
  totalStations: number;
  tierCounts: {
    air: number;
    water: number;
    noise: number;
  };
  estimatedAnnualOm: number;
  fiveYearTco: number;
  costPerResident: number;
  costPerKm2: number;
  regulatoryComplianceScore: number;
  calibrationRatio: string;
  estimatedCoverageGainPercent: number;
  meanConfidenceScore: number;
  estimatedPopulationCovered: number;
  allocatedStations: OptimizedStation[];
  optimizationEngine?: string;
  meanInformationGain?: number;
}

export interface TierSpecOverride {
  unitCost?: number;
  annualOm?: number;
  radiusKm?: number;
  confidence?: number;
}

export type CustomTierSpecs = Partial<Record<SensorTier, TierSpecOverride>>;

export interface BudgetPlanningPackage {
  id: string;
  title: string;
  subtitle: string;
  budget: number;
  strategy: OptimizationStrategy;
  icon: string;
  badge: string;
  color: string;
  rationale: string;
  targetFocus: string;
  recommendedTiers: {
    air: number;
    water: number;
    noise: number;
  };
  customSpecs?: CustomTierSpecs;
}

export const PLANNING_PACKAGES: BudgetPlanningPackage[] = [
  {
    id: "vulnerable_zones",
    title: "School & Health Clinic Protection Shield",
    subtitle: "Focus on sensitive pediatric and healthcare receptors",
    budget: 45000,
    strategy: "balanced",
    icon: "🏥",
    badge: "Vulnerable Populations",
    color: "#0f766e",
    rationale:
      "Deploys Air quality stations near schools, supplemented by acoustic Noise sensors across residential courtyards and Water quality monitors.",
    targetFocus: "Schools, kindergartens, clinics, and residential courtyards",
    recommendedTiers: { air: 5, water: 2, noise: 4 },
  },
  {
    id: "industrial_sentinel",
    title: "Southern Industrial & Battery Megafactory Perimeter",
    subtitle: "Regulatory baseline & heavy emissions compliance",
    budget: 85000,
    strategy: "precision",
    icon: "🏭",
    badge: "Industrial Baseline",
    color: "#b45309",
    rationale:
      "High-density Air and Water monitoring array tracking industrial plume boundaries and stormwater runoff around the industrial park.",
    targetFocus: "Debrecen Southern Economic Zone, freight bypass, industrial boundary",
    recommendedTiers: { air: 10, water: 4, noise: 5 },
  },
  {
    id: "transit_grid",
    title: "DKV Transit & Commuter Thoroughfare Grid",
    subtitle: "Public transport stops & passenger exposure tracking",
    budget: 60000,
    strategy: "traffic",
    icon: "🚌",
    badge: "Transit Network",
    color: "#6b21a8",
    rationale:
      "Target high-passenger-frequency DKV tram/bus junctions with Air and Noise monitoring nodes along heavy commuter corridors.",
    targetFocus: "Nagyállomás main hub, tram corridors, commuter radial avenues",
    recommendedTiers: { air: 7, water: 1, noise: 8 },
  },
  {
    id: "citywide_mesh",
    title: "Debrecen Hyper-Local Expansion Grid",
    subtitle: "Complete municipal blind-spot elimination",
    budget: 120000,
    strategy: "coverage",
    icon: "🌐",
    badge: "Citywide Reach",
    color: "#0284c7",
    rationale:
      "Comprehensive city coverage balancing Air stations, Water monitors along canals and reservoirs, and Noise pollution sentinels.",
    targetFocus: "Suburban districts, peri-urban residential belts, parks, outer ring",
    recommendedTiers: { air: 14, water: 5, noise: 10 },
  },
  {
    id: "rapid_pilot",
    title: "Fast-Track Starter Pilot",
    subtitle: "Low CapEx starter network for proof of concept",
    budget: 25000,
    strategy: "balanced",
    icon: "🚀",
    badge: "Starter Pilot",
    color: "#16a34a",
    rationale:
      "Cost-effective initial municipal rollout: balanced initial Air, Water, and Noise sensors providing immediate cross-domain environmental data.",
    targetFocus: "Inner-city ring and surrounding university campuses",
    recommendedTiers: { air: 3, water: 1, noise: 2 },
  },
];

export interface OptimizationConstraints {
  minAir?: number;
  minWater?: number;
  minNoise?: number;
  minReference?: number;
  minMicro?: number;
  maxAnnualOm?: number | null;
  includeFiveYearTco?: boolean;
  customTierSpecs?: CustomTierSpecs;
}

export interface BudgetOptimizationResult {
  name?: string;
  badge?: string;
  description?: string;
  strategy: OptimizationStrategy;
  totalBudget: number;
  allocatedSpend: number;
  remainingBudget: number;
  budgetUtilizationPercent: number;
  totalStations: number;
  tierCounts: {
    air: number;
    water: number;
    noise: number;
  };
  estimatedAnnualOm: number;
  fiveYearTco: number;
  costPerResident: number;
  costPerKm2: number;
  regulatoryComplianceScore: number;
  calibrationRatio: string;
  estimatedCoverageGainPercent: number;
  meanConfidenceScore: number;
  estimatedPopulationCovered: number;
  allocatedStations: OptimizedStation[];
  optimizationEngine?: string;
  meanInformationGain?: number;
  appliedTierSpecs?: Record<
    SensorTier,
    { unitCost: number; annualOm: number; radiusKm: number; confidence: number }
  >;
  comparisons?: {
    airOnly?: PortfolioTradeoffComparison;
    waterOnly?: PortfolioTradeoffComparison;
    referenceOnly?: PortfolioTradeoffComparison;
    iotOnly?: PortfolioTradeoffComparison;
    currentHybrid: PortfolioTradeoffComparison;
  };
}
