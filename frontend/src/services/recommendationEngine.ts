import { cityGrid } from "./gridService";
import type { Station } from "../types/station";

import { estimateCandidateRisk } from "../utils/estimateCandidateRisk";
import { findNearestAirStation } from "../utils/nearestStation";
import { calculatePriorityScore } from "../utils/calculatePriorityScore";
import { calculateDistanceKm } from "../utils/distance";
import { isInsideUrbanArea } from "../utils/isInsideUrbanArea";

export interface SensorRecommendation {
  id: number;
  lat: number;
  lng: number;

  nearestStation: string;
  distanceKm: number;

  estimatedPm25: number;
  estimatedWindSpeed: number;

  coverageScore: number;
  pm25Risk: number;
  windRisk: number;

  priorityScore: number;
}

export function generateRecommendations(
  stations: Station[],
): SensorRecommendation[] {
  if (stations.length === 0) {
    return [];
  }

  const recommendations: SensorRecommendation[] = [];

  const urbanGrid = cityGrid.filter((point) =>
    isInsideUrbanArea(point.lat, point.lng),
  );

  let maxDistance = 0;

  const distances = urbanGrid.map((point) => {
    const nearest = findNearestAirStation(
      point.lat,
      point.lng,
      stations,
    );

    if (nearest.distanceKm !== null) {
      maxDistance = Math.max(maxDistance, nearest.distanceKm);
    }

    return {
      point,
      nearest,
    };
  });

  for (const item of distances) {
    if (
      item.nearest.station === null ||
      item.nearest.distanceKm === null
    ) {
      continue;
    }

    const risk = estimateCandidateRisk(
      item.point.lat,
      item.point.lng,
      stations,
    );

    const coverageScore =
      maxDistance === 0
        ? 0
        : Math.round(
            (item.nearest.distanceKm / maxDistance) * 100,
          );

    const priority = calculatePriorityScore({
      coverageGap: coverageScore,
      pm25Risk: risk.pm25Risk,
      windRisk: risk.windRisk,
    });

    recommendations.push({
      id: item.point.id,

      lat: item.point.lat,
      lng: item.point.lng,

      nearestStation: item.nearest.station.name,
      distanceKm: item.nearest.distanceKm,

      estimatedPm25: risk.estimatedPm25,
      estimatedWindSpeed: risk.estimatedWindSpeed,

      coverageScore,
      pm25Risk: risk.pm25Risk,
      windRisk: risk.windRisk,

      priorityScore: priority.score,
    });
  }

  return recommendations.sort(
    (a, b) => b.priorityScore - a.priorityScore,
  );
}

export function selectSeparatedRecommendations(
  recommendations: SensorRecommendation[],
  count = 5,
  minimumDistanceKm = 2,
): SensorRecommendation[] {
  const selected: SensorRecommendation[] = [];

  for (const candidate of recommendations) {
    const isFarEnough = selected.every(
      (existing) =>
        calculateDistanceKm(
          candidate.lat,
          candidate.lng,
          existing.lat,
          existing.lng,
        ) >= minimumDistanceKm,
    );

    if (isFarEnough) {
      selected.push(candidate);
    }

    if (selected.length === count) {
      break;
    }
  }

  return selected;
}