export interface PriorityInputs {
  coverageGap: number;
  pm25Risk: number;
  windRisk: number;
}

export interface PriorityResult {
  score: number;
}

export function calculatePriorityScore(
  inputs: PriorityInputs,
): PriorityResult {
  const score =
    inputs.coverageGap * 0.5 +
    inputs.pm25Risk * 0.3 +
    inputs.windRisk * 0.2;

  return {
    score: Math.round(score),
  };
}