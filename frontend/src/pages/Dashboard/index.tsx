import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import KpiCard from "../../components/common/KpiCard";
import OfficialDatasetSummary from "../../components/common/OfficialDatasetSummary";
import { getStations } from "../../services/stationService";
import {
  getTrafficLocations,
  type TrafficLocation,
} from "../../services/trafficService";
import type { Station } from "../../types/station";

const OFFICIAL_NOISE_STATION_COUNT = 5;
const OFFICIAL_GROUNDWATER_STATION_COUNT = 15;

const OFFICIAL_NOISE_RECORD_COUNT = 300;
const OFFICIAL_GROUNDWATER_RECORD_COUNT = 31_625;

const AVERAGE_DAYTIME_NOISE_DB = 56.57;
const AVERAGE_NIGHTTIME_NOISE_DB = 48.92;
const AVERAGE_WATER_TEMPERATURE_C = 13.54;

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
              maxWidth: 900,
              lineHeight: 1.6,
            }}
          >
            Integrated Green Sentinel air, noise and
            groundwater measurements combined with DKV
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
            label="Air · Noise · Water"
            size="small"
            sx={{
              color: "#2563eb",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
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

      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: 2,
            md: 2.75,
          },
          borderRadius: 2.5,
          borderColor:
            "rgba(15, 118, 110, 0.14)",
          backgroundColor: "#ffffff",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1f2f2b",
          }}
        >
          Monitoring Network and Environmental Indicators
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            mb: 2.25,
          }}
        >
          Green Sentinel monitoring availability,
          environmental measurements and DKV transport
          activity from the official 30-day dataset.
        </Typography>

        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Monitoring Locations"
              value={stations.length || "—"}
              subtitle="Green Sentinel measuring points"
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Air Stations"
              value={airStations.length || "—"}
              subtitle={`${validPm25Stations.length} with valid PM2.5`}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Noise Stations"
              value={OFFICIAL_NOISE_STATION_COUNT}
              subtitle={`${OFFICIAL_NOISE_RECORD_COUNT.toLocaleString()} noise records`}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Groundwater Stations"
              value={
                OFFICIAL_GROUNDWATER_STATION_COUNT
              }
              subtitle={`${OFFICIAL_GROUNDWATER_RECORD_COUNT.toLocaleString()} measurements`}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="DKV Transport Stops"
              value={
                trafficLocations.length || "—"
              }
              subtitle={`${highActivityTrafficStops} high-activity locations`}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Average PM2.5"
              value={
                averagePm25 === null
                  ? "—"
                  : `${averagePm25.toFixed(
                      2,
                    )} µg/m³`
              }
              subtitle="Across valid air stations"
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Average Daytime Noise"
              value={`${AVERAGE_DAYTIME_NOISE_DB.toFixed(
                1,
              )} dB`}
              subtitle={`Nighttime average ${AVERAGE_NIGHTTIME_NOISE_DB.toFixed(
                1,
              )} dB`}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              lg: 3,
            }}
          >
            <KpiCard
              title="Average Water Temperature"
              value={`${AVERAGE_WATER_TEMPERATURE_C.toFixed(
                1,
              )}°C`}
              subtitle="Across groundwater measurements"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <OfficialDatasetSummary />
      </Box>

      <Grid
        container
        spacing={2.5}
        sx={{ mt: 0.25 }}
      >
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              p: 2.25,
              borderRadius: 2.5,
              borderColor: "#a7f3d0",
              backgroundColor: "#ecfdf5",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#0f766e",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              AIR QUALITY
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mt: 0.75,
                fontWeight: 800,
                color: "#0f766e",
              }}
            >
              {averagePm25 === null
                ? "—"
                : `${averagePm25.toFixed(
                    2,
                  )} µg/m³`}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                lineHeight: 1.55,
              }}
            >
              Average PM2.5 across currently valid
              air-quality monitoring stations.
            </Typography>
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              p: 2.25,
              borderRadius: 2.5,
              borderColor: "#ddd6fe",
              backgroundColor: "#f5f3ff",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#7c3aed",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              NOISE ENVIRONMENT
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mt: 0.75,
                fontWeight: 800,
                color: "#7c3aed",
              }}
            >
              {AVERAGE_DAYTIME_NOISE_DB.toFixed(
                1,
              )}{" "}
              dB
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                lineHeight: 1.55,
              }}
            >
              Average daytime noise. Nighttime
              average:{" "}
              {AVERAGE_NIGHTTIME_NOISE_DB.toFixed(
                1,
              )}{" "}
              dB.
            </Typography>
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              p: 2.25,
              borderRadius: 2.5,
              borderColor: "#bfdbfe",
              backgroundColor: "#eff6ff",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#2563eb",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              GROUNDWATER
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mt: 0.75,
                fontWeight: 800,
                color: "#2563eb",
              }}
            >
              {AVERAGE_WATER_TEMPERATURE_C.toFixed(
                1,
              )}
              °C
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                lineHeight: 1.55,
              }}
            >
              Average groundwater temperature
              across the processed official
              measurements.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}