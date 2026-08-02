import type { Station } from "../types/station";
import type { SensorRecommendation } from "./recommendationEngine";

interface RecommendationApiResponse {
  count: number;
  simulatedStationCount: number;
  recommendations: SensorRecommendation[];
}

const BASE_URL = "http://localhost:8000/api/recommendations";

export async function getRecommendations(
  simulatedStations: Station[] = [],
): Promise<SensorRecommendation[]> {
  const hasSimulation = simulatedStations.length > 0;

  const response = await fetch(
    hasSimulation ? `${BASE_URL}/simulate` : `${BASE_URL}/`,
    hasSimulation
      ? {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            simulatedStations,
          }),
        }
      : undefined,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load recommendations: ${response.status} ${response.statusText}`,
    );
  }

  const data: RecommendationApiResponse = await response.json();

  return data.recommendations;
}