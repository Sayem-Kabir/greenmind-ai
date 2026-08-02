import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Grid, Typography } from "@mui/material";

import KpiCard from "../../components/common/KpiCard";
import StationSummary from "../../components/common/StationSummary";
import { getStations } from "../../services/stationService";
import type { Station } from "../../types/station";

export default function Dashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await getStations();
        setStations(data);
      } catch {
        setError("Could not load dashboard data.");
      }
    }

    loadStations();
  }, []);

  const airStations = useMemo(
    () => stations.filter((station) => station.station_type === 0),
    [stations],
  );

  const waterStations = useMemo(
    () => stations.filter((station) => station.station_type === 1),
    [stations],
  );

  const validPm25Stations = useMemo(
    () =>
      airStations.filter(
        (station) =>
          station.pm25 !== undefined &&
          station.pm25 !== null &&
          Number.isFinite(station.pm25),
      ),
    [airStations],
  );

  const averagePm25 = useMemo(() => {
    if (validPm25Stations.length === 0) {
      return null;
    }

    const total = validPm25Stations.reduce(
      (sum, station) => sum + (station.pm25 ?? 0),
      0,
    );

    return total / validPm25Stations.length;
  }, [validPm25Stations]);

  const dataCompleteness = useMemo(() => {
    if (airStations.length === 0) {
      return null;
    }

    return (validPm25Stations.length / airStations.length) * 100;
  }, [airStations, validPm25Stations]);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Environmental Monitoring Overview
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Current monitoring coverage and environmental data summary.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Monitoring Stations"
            value={stations.length || "—"}
            subtitle="Green Sentinel measuring points"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Air-Quality Stations"
            value={airStations.length || "—"}
            subtitle="Stations reporting air measurements"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="PM2.5 Data Completeness"
            value={
              dataCompleteness === null
                ? "—"
                : `${dataCompleteness.toFixed(1)}%`
            }
            subtitle={`${validPm25Stations.length} of ${airStations.length} stations`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Average PM2.5"
            value={
              averagePm25 === null
                ? "—"
                : `${averagePm25.toFixed(2)} µg/m³`
            }
            subtitle="Average across valid air stations"
          />
        </Grid>
      </Grid>

      <StationSummary
        totalStations={stations.length}
        airStations={airStations.length}
        waterStations={waterStations.length}
        validPm25Stations={validPm25Stations.length}
      />
    </Box>
  );
}