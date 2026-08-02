import type { Station } from "../types/station";
import { calculateDistanceKm } from "./distance";

export interface CandidateRiskEstimate {
  estimatedPm25: number;
  estimatedWindSpeed: number;
  pm25Risk: number;
  windRisk: number;
}

function normalize(value: number, minimum: number, maximum: number): number {
  if (maximum === minimum) {
    return 0;
  }

  const normalized = ((value - minimum) / (maximum - minimum)) * 100;

  return Math.max(0, Math.min(100, normalized));
}

export function estimateCandidateRisk(
  latitude: number,
  longitude: number,
  stations: Station[],
): CandidateRiskEstimate {
  const validAirStations = stations.filter(
    (station) =>
      station.station_type === 0 &&
      station.pm25 !== undefined &&
      Number.isFinite(station.pm25),
  );

  if (validAirStations.length === 0) {
    return {
      estimatedPm25: 0,
      estimatedWindSpeed: 0,
      pm25Risk: 0,
      windRisk: 0,
    };
  }

  let weightedPm25Total = 0;
  let weightedWindTotal = 0;
  let totalPm25Weight = 0;
  let totalWindWeight = 0;

  for (const station of validAirStations) {
    const distanceKm = Math.max(
      calculateDistanceKm(
        latitude,
        longitude,
        station.lat,
        station.lng,
      ),
      0.1,
    );

    const weight = 1 / distanceKm ** 2;

    weightedPm25Total += (station.pm25 ?? 0) * weight;
    totalPm25Weight += weight;

    if (
      station.windSpeed !== undefined &&
      Number.isFinite(station.windSpeed)
    ) {
      weightedWindTotal += station.windSpeed * weight;
      totalWindWeight += weight;
    }
  }

  const estimatedPm25 = weightedPm25Total / totalPm25Weight;

  const estimatedWindSpeed =
    totalWindWeight === 0 ? 0 : weightedWindTotal / totalWindWeight;

  const pm25Values = validAirStations.map(
    (station) => station.pm25 ?? 0,
  );

  const windValues = validAirStations
    .map((station) => station.windSpeed)
    .filter(
      (value): value is number =>
        value !== undefined && Number.isFinite(value),
    );

  const minimumPm25 = Math.min(...pm25Values);
  const maximumPm25 = Math.max(...pm25Values);

  const minimumWind =
    windValues.length === 0 ? 0 : Math.min(...windValues);

  const maximumWind =
    windValues.length === 0 ? 1 : Math.max(...windValues);

  return {
    estimatedPm25,
    estimatedWindSpeed,
    pm25Risk: normalize(estimatedPm25, minimumPm25, maximumPm25),

    // Lower wind means weaker pollutant dispersion, so risk is reversed.
    windRisk:
      100 -
      normalize(
        estimatedWindSpeed,
        minimumWind,
        maximumWind,
      ),
  };
}