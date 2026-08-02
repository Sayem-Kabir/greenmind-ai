import type { Station } from "../types/station";
import { calculateDistanceKm } from "./distance";

export interface NearestStationResult {
  station: Station | null;
  distanceKm: number | null;
}

export function findNearestAirStation(
  latitude: number,
  longitude: number,
  stations: Station[],
): NearestStationResult {
  const airStations = stations.filter(
    (station) =>
      station.station_type === 0 &&
      Number.isFinite(station.lat) &&
      Number.isFinite(station.lng),
  );

  if (airStations.length === 0) {
    return {
      station: null,
      distanceKm: null,
    };
  }

  let nearestStation: Station | null = null;
  let nearestDistance: number | null = null;

  for (const station of airStations) {
    const distance = calculateDistanceKm(
      latitude,
      longitude,
      station.lat,
      station.lng,
    );

    if (
      nearestDistance === null ||
      distance < nearestDistance
    ) {
      nearestStation = station;
      nearestDistance = distance;
    }
  }

  return {
    station: nearestStation,
    distanceKm: nearestDistance,
  };
}