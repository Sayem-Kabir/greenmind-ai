export interface SensorRecommendation {
  id: number;
  lat: number;
  lng: number;

  nearestStation: string;
  distanceKm: number;

  estimatedPm25: number;
  estimatedPm10: number;
  estimatedNo2: number;
  estimatedO3: number;
  estimatedWindSpeed: number;

  estimatedPm25Std: number;
  estimatedPm10Std: number;
  estimatedNo2Std: number;

  coverageScore: number;

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

  priorityScore: number;
  coverageConfidence: number;
pollutionConfidence: number;
variabilityConfidence: number;
windConfidence: number;
overallConfidence: number;
}