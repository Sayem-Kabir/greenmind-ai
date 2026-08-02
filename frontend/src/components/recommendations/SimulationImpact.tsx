import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";

import { useSimulation } from "../../context/SimulationContext";
import { getStations } from "../../services/stationService";
import type { Station } from "../../types/station";
import { calculateCoverageMetrics } from "../../utils/calculateCoverageMetrics";

function formatChange(value: number, suffix = ""): string {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(1)}${suffix}`;
}

export default function SimulationImpact() {
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState("");

  const { simulatedStations } = useSimulation();

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await getStations();
        setStations(data);
      } catch {
        setError("Could not calculate simulation impact.");
      }
    }

    loadStations();
  }, []);

  const beforeMetrics = useMemo(
    () => calculateCoverageMetrics(stations),
    [stations],
  );

  const afterMetrics = useMemo(
    () =>
      calculateCoverageMetrics([
        ...stations,
        ...simulatedStations,
      ]),
    [stations, simulatedStations],
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (simulatedStations.length === 0) {
    return null;
  }

  const coverageChange =
    afterMetrics.coveragePercentage -
    beforeMetrics.coveragePercentage;

  const blindSpotChange =
    afterMetrics.blindSpotCount -
    beforeMetrics.blindSpotCount;

  const distanceChange =
    afterMetrics.averageDistanceKm -
    beforeMetrics.averageDistanceKm;

  const metrics = [
    {
      title: "Monitoring Coverage",
      before: `${beforeMetrics.coveragePercentage.toFixed(1)}%`,
      after: `${afterMetrics.coveragePercentage.toFixed(1)}%`,
      change: formatChange(coverageChange, "%"),
      positive: coverageChange >= 0,
    },
    {
      title: "Blind-Spot Grid Cells",
      before: beforeMetrics.blindSpotCount.toString(),
      after: afterMetrics.blindSpotCount.toString(),
      change: formatChange(blindSpotChange),
      positive: blindSpotChange <= 0,
    },
    {
      title: "Average Station Distance",
      before: `${beforeMetrics.averageDistanceKm.toFixed(2)} km`,
      after: `${afterMetrics.averageDistanceKm.toFixed(2)} km`,
      change: formatChange(distanceChange, " km"),
      positive: distanceChange <= 0,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        Simulation Impact
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric) => (
          <Grid
            key={metric.title}
            size={{ xs: 12, md: 4 }}
          >
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  {metric.title}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 1,
                    mt: 1.5,
                  }}
                >
                  <Typography
                    variant="h6"
                    color="text.secondary"
                  >
                    {metric.before}
                  </Typography>

                  <Typography color="text.secondary">
                    →
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700 }}
                  >
                    {metric.after}
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  color={metric.positive ? "success" : "warning"}
                  label={metric.change}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}