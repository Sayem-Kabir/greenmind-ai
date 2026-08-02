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
    (station) => station.station_type === 0,
  );

  if (airStations.length === 0) {
    return {
      station: null,
      distanceKm: null,
    };
  }

  let nearestStation = airStations[0];
  let shortestDistance = calculateDistanceKm(
    latitude,
    longitude,
    nearestStation.lat,
    nearestStation.lng,
  );

  for (const station of airStations.slice(1)) {
    const distance = calculateDistanceKm(
      latitude,
      longitude,
      station.lat,
      station.lng,
    );

    if (distance < shortestDistance) {
      nearestStation = station;
      shortestDistance = distance;
    }
  }

  return {
    station: nearestStation,
    distanceKm: shortestDistance,
  };
}