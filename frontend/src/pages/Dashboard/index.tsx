import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Grid,
  Typography,
} from "@mui/material";

import KpiCard from "../../components/common/KpiCard";
import OfficialDatasetSummary from "../../components/common/OfficialDatasetSummary";
import StationSummary from "../../components/common/StationSummary";
import { getStations } from "../../services/stationService";
import {
  getTrafficLocations,
  type TrafficLocation,
} from "../../services/trafficService";
import type { Station } from "../../types/station";

export default function Dashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [trafficLocations, setTrafficLocations] = useState<
    TrafficLocation[]
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      setError("");

      try {
        const [stationData, trafficData] =
          await Promise.all([
            getStations(),
            getTrafficLocations(),
          ]);

        setStations(stationData);
        setTrafficLocations(trafficData);
      } catch {
        setError("Could not load dashboard data.");
      }
    }

    loadDashboardData();
  }, []);

  const airStations = useMemo(
    () =>
      stations.filter(
        (station) => station.station_type === 0,
      ),
    [stations],
  );

  const waterStations = useMemo(
    () =>
      stations.filter(
        (station) => station.station_type === 1,
      ),
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
      (sum, station) =>
        sum + (station.pm25 ?? 0),
      0,
    );

    return total / validPm25Stations.length;
  }, [validPm25Stations]);

  const highActivityTrafficStops = useMemo(
    () =>
      trafficLocations.filter(
        (location) =>
          location.trafficActivityScore >= 25,
      ).length,
    [trafficLocations],
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#173c35",
              letterSpacing: "-0.03em",
            }}
          >
            Environmental Monitoring Overview
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 0.75,
              lineHeight: 1.6,
            }}
          >
            Current Green Sentinel measurements and DKV
            transport activity across Debrecen.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label="Green Sentinel"
            size="small"
            sx={{
              color: "#0f766e",
              backgroundColor: "#e4f5f0",
              border: "1px solid #cdece4",
              fontWeight: 700,
            }}
          />

          <Chip
            label="DKV Traffic"
            size="small"
            sx={{
              color: "#5b21b6",
              backgroundColor: "#f3e8ff",
              border: "1px solid #e9d5ff",
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
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
            title="DKV Transport Stops"
            value={trafficLocations.length || "—"}
            subtitle={`${highActivityTrafficStops} high-activity locations`}
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

      <Box sx={{ mt: 3 }}>
        <OfficialDatasetSummary />
      </Box>

      <StationSummary
        totalStations={stations.length}
        airStations={airStations.length}
        waterStations={waterStations.length}
        validPm25Stations={
          validPm25Stations.length
        }
      />
    </Box>
  );
}