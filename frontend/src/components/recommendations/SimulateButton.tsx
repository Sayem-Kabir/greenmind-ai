import { Button } from "@mui/material";

import type { SensorRecommendation } from "../../services/recommendationEngine";
import { useSimulation } from "../../context/SimulationContext";

interface Props {
  recommendation: SensorRecommendation;
}

export default function SimulateButton({
  recommendation,
}: Props) {
  const { simulateRecommendation } = useSimulation();

  return (
    <Button
      fullWidth
      variant="contained"
      color="success"
      sx={{ mt: 2 }}
      onClick={() => simulateRecommendation(recommendation)}
    >
      Simulate Sensor
    </Button>
  );
}