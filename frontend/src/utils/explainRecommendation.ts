import type { SensorRecommendation } from "../types/recommendation";

export interface RecommendationExplanation {
  title: string;
  reasons: string[];
  confidence: number;
}

export function explainRecommendation(
  recommendation: SensorRecommendation,
): RecommendationExplanation {
  const reasons: string[] = [];

  if (recommendation.coverageScore >= 75) {
    reasons.push(
      `The location is ${recommendation.distanceKm.toFixed(
        2,
      )} km from the nearest station, indicating a major monitoring gap.`,
    );
  } else if (recommendation.coverageScore >= 45) {
    reasons.push(
      "The area has a moderate monitoring coverage gap.",
    );
  } else {
    reasons.push(
      "The area has relatively good existing monitoring coverage.",
    );
  }

  if (recommendation.pollutionRisk >= 65) {
    reasons.push(
      "Estimated PM2.5, PM10, NO₂ and O₃ levels indicate elevated pollution risk.",
    );
  } else if (recommendation.pollutionRisk >= 40) {
    reasons.push(
      "Estimated pollutant levels indicate moderate environmental risk.",
    );
  } else {
    reasons.push(
      "Estimated average pollutant levels are comparatively low.",
    );
  }

  if (recommendation.variabilityRisk >= 60) {
    reasons.push(
      "Historical measurements fluctuate strongly, so additional monitoring may capture short-term pollution events.",
    );
  } else if (recommendation.variabilityRisk >= 30) {
    reasons.push(
      "Historical pollution levels show moderate variability.",
    );
  } else {
    reasons.push(
      "Historical pollution measurements are relatively stable.",
    );
  }

  if (recommendation.windRisk >= 60) {
    reasons.push(
      "Low average wind conditions may reduce pollutant dispersion.",
    );
  }

  const scoreSpread = Math.max(
    recommendation.coverageScore,
    recommendation.pollutionRisk,
    recommendation.variabilityRisk,
    recommendation.windRisk,
  );

  const confidence = Math.min(
    95,
    Math.max(
      55,
      Math.round(
        recommendation.priorityScore * 0.7 +
          scoreSpread * 0.3,
      ),
    ),
  );

  let title = "Balanced monitoring opportunity";

  if (
    recommendation.coverageScore >= 75 &&
    recommendation.pollutionRisk >= 55
  ) {
    title = "High-priority monitoring blind spot";
  } else if (recommendation.coverageScore >= 75) {
    title = "Major monitoring coverage gap";
  } else if (recommendation.pollutionRisk >= 65) {
    title = "Elevated environmental risk area";
  } else if (recommendation.variabilityRisk >= 60) {
    title = "Highly variable pollution area";
  }

  return {
    title,
    reasons,
    confidence,
  };
}