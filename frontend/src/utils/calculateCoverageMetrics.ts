import { cityGrid } from "../services/gridService";
import type { Station } from "../types/station";
import { isInsideUrbanArea } from "./isInsideUrbanArea";
import { findNearestAirStation } from "./nearestStation";

export interface CoverageMetrics {
  coveragePercentage: number;
  blindSpotCount: number;
  averageDistanceKm: number;
  coveredGridPoints: number;
  totalGridPoints: number;
}

const COVERAGE_DISTANCE_KM = 2;

export function calculateCoverageMetrics(
  stations: Station[],
): CoverageMetrics {
  const airStations = stations.filter(
    (station) => station.station_type === 0,
  );

  const urbanGrid = cityGrid.filter((point) =>
    isInsideUrbanArea(point.lat, point.lng),
  );

  if (airStations.length === 0 || urbanGrid.length === 0) {
    return {
      coveragePercentage: 0,
      blindSpotCount: urbanGrid.length,
      averageDistanceKm: 0,
      coveredGridPoints: 0,
      totalGridPoints: urbanGrid.length,
    };
  }

  const distances = urbanGrid
    .map((point) => {
      const nearest = findNearestAirStation(
        point.lat,
        point.lng,
        airStations,
      );

      return nearest.distanceKm;
    })
    .filter(
      (distance): distance is number =>
        distance !== null && Number.isFinite(distance),
    );

  if (distances.length === 0) {
    return {
      coveragePercentage: 0,
      blindSpotCount: urbanGrid.length,
      averageDistanceKm: 0,
      coveredGridPoints: 0,
      totalGridPoints: urbanGrid.length,
    };
  }

  const coveredGridPoints = distances.filter(
    (distance) => distance <= COVERAGE_DISTANCE_KM,
  ).length;

  const blindSpotCount = distances.length - coveredGridPoints;

  const averageDistanceKm =
    distances.reduce((sum, distance) => sum + distance, 0) /
    distances.length;

  const coveragePercentage =
    (coveredGridPoints / distances.length) * 100;

  return {
    coveragePercentage,
    blindSpotCount,
    averageDistanceKm,
    coveredGridPoints,
    totalGridPoints: distances.length,
  };
}