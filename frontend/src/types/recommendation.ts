export type RecommendationType =
  | "full_station"
  | "air_sensor"
  | "noise_sensor"
  | "water_sensor";

export type MonitoringNeed =
  | "air"
  | "noise"
  | "water";

export interface SensorRecommendation {
  id: number;
  lat: number;
  lng: number;

  nearestStation: string;
  distanceKm: number;

  recommendationType: RecommendationType;
  recommendedSensor: string;
  primaryMonitoringNeed: MonitoringNeed;

  estimatedPm25: number;
  estimatedPm10: number;
  estimatedNo2: number;
  estimatedO3: number;
  estimatedWindSpeed: number;

  estimatedPm25Std: number;
  estimatedPm10Std: number;
  estimatedNo2Std: number;

  estimatedDaytimeNoise: number;
  estimatedNighttimeNoise: number;

  estimatedConductivity: number;
  estimatedWaterLevel: number;
  estimatedWaterTemperature: number;

  coverageScore: number;
  airCoverageScore: number;
  noiseCoverageScore: number;
  waterCoverageScore: number;

  pm25Risk: number;
  pm10Risk: number;
  no2Risk: number;
  o3Risk: number;

  pm25VariabilityRisk: number;
  pm10VariabilityRisk: number;
  no2VariabilityRisk: number;

  pollutionRisk: number;
  variabilityRisk: number;
  windRisk: number;
  noiseRisk: number;
  waterMonitoringPriority: number;

  airSuitability: number;
  noiseSuitability: number;
  waterSuitability: number;

  priorityScore: number;

  coverageConfidence: number;
  pollutionConfidence: number;
  variabilityConfidence: number;
  windConfidence: number;
  overallConfidence: number;

  airConfidence: number;
  noiseConfidence: number;
  waterConfidence: number;

  noiseStationCount: number;
  waterStationCount: number;

  trafficActivityScore: number;
  trafficRisk: number;
  trafficConfidence: number;

  nearestTrafficStop: string | null;
  trafficDistanceKm: number | null;

  nearbyTrafficStopCount: number;
  nearbyPassengerFrequency: number;
  nearbyPassengersIn: number;
  nearbyPassengersOut: number;
}