import type { SensorRecommendation } from "../services/recommendationEngine";

export interface RecommendationExplanation {
  title: string;
  reasons: string[];
  confidence: number;
}

export function explainRecommendation(
  recommendation: SensorRecommendation,
): RecommendationExplanation {
  const reasons: string[] = [];

  if (recommendation.coverageScore >= 80) {
    reasons.push(
      `The location has a major monitoring coverage gap and is ${recommendation.distanceKm.toFixed(
        2,
      )} km from the nearest air-quality station.`,
    );
  } else if (recommendation.coverageScore >= 60) {
    reasons.push(
      "The location has limited coverage from the existing monitoring network.",
    );
  }

  if (recommendation.pm25Risk >= 70) {
    reasons.push(
      `The estimated PM2.5 level is relatively high at ${recommendation.estimatedPm25.toFixed(
        2,
      )} µg/m³.`,
    );
  } else if (recommendation.pm25Risk >= 40) {
    reasons.push(
      "The estimated PM2.5 level indicates moderate environmental risk.",
    );
  }

  if (recommendation.windRisk >= 70) {
    reasons.push(
      `The estimated wind speed is low at ${recommendation.estimatedWindSpeed.toFixed(
        2,
      )} m/s, which may reduce pollutant dispersion.`,
    );
  } else if (recommendation.windRisk >= 40) {
    reasons.push(
      "Wind conditions may provide only moderate pollutant dispersion.",
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "The location provides a balanced improvement across monitoring coverage and environmental risk indicators.",
    );
  }

  let confidence = 70;

  if (recommendation.priorityScore >= 85) {
    confidence = 92;
  } else if (recommendation.priorityScore >= 75) {
    confidence = 85;
  } else if (recommendation.priorityScore >= 65) {
    confidence = 78;
  }

  return {
    title: "Why this location?",
    reasons,
    confidence,
  };
}