import type { CandidateLocation } from "../data/candidateLocations";
import type { Station } from "../types/station";

import { calculatePriorityScore } from "./calculatePriorityScore";
import { estimateCandidateRisk } from "./estimateCandidateRisk";
import { findNearestAirStation } from "./nearestStation";

export interface RankedCandidate extends CandidateLocation {
  nearestStationName: string;
  distanceToNearestStationKm: number;
  coverageScore: number;
  estimatedPm25: number;
  estimatedWindSpeed: number;
  pm25Risk: number;
  windRisk: number;
  priorityScore: number;
}

export function rankCandidateLocations(
  candidates: CandidateLocation[],
  stations: Station[],
): RankedCandidate[] {
  const candidatesWithData = candidates
    .map((candidate) => {
      const nearest = findNearestAirStation(
        candidate.lat,
        candidate.lng,
        stations,
      );

      if (!nearest.station || nearest.distanceKm === null) {
        return null;
      }

      const riskEstimate = estimateCandidateRisk(
        candidate.lat,
        candidate.lng,
        stations,
      );

      return {
        ...candidate,
        nearestStationName: nearest.station.name,
        distanceToNearestStationKm: nearest.distanceKm,
        ...riskEstimate,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is CandidateLocation & {
        nearestStationName: string;
        distanceToNearestStationKm: number;
        estimatedPm25: number;
        estimatedWindSpeed: number;
        pm25Risk: number;
        windRisk: number;
      } => candidate !== null,
    );

  if (candidatesWithData.length === 0) {
    return [];
  }

  const maximumDistance = Math.max(
    ...candidatesWithData.map(
      (candidate) => candidate.distanceToNearestStationKm,
    ),
  );

  return candidatesWithData
    .map((candidate) => {
      const coverageScore =
        maximumDistance === 0
          ? 0
          : Math.round(
              (candidate.distanceToNearestStationKm / maximumDistance) * 100,
            );

      const priorityResult = calculatePriorityScore({
        coverageGap: coverageScore,
        pm25Risk: candidate.pm25Risk,
        windRisk: candidate.windRisk,
      });

      return {
        ...candidate,
        coverageScore,
        priorityScore: priorityResult.score,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}