import {
  Alert,
  Box,
  Button,
  Chip,
  Typography,
} from "@mui/material";

import { useSimulation } from "../../context/SimulationContext";

export default function SimulationStatus() {
  const { simulatedStations, clearSimulation } = useSimulation();

  if (simulatedStations.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Select a recommendation below to simulate adding a new sensor.
      </Alert>
    );
  }

  return (
    <Alert
      severity="success"
      sx={{
        mb: 3,
        alignItems: "center",
      }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={clearSimulation}
        >
          Reset simulation
        </Button>
      }
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          Simulation active
        </Typography>

        <Chip
          size="small"
          color="secondary"
          label={`${simulatedStations.length} virtual ${
            simulatedStations.length === 1 ? "sensor" : "sensors"
          }`}
        />
      </Box>
    </Alert>
  );
}