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

  coverageScore: number;

  pm25Risk: number;
  pm10Risk: number;
  no2Risk: number;
  o3Risk: number;

  pollutionRisk: number;
  windRisk: number;
  priorityScore: number;
}