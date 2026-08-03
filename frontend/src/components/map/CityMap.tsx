import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import CoverageHeatmap from "./CoverageHeatmap";
import DebrecenBoundary from "./DebrecenBoundary";
import MapBoundsController from "./MapBoundsController";
import MapLegend from "./MapLegend";
import SimulatedSensorLayer from "./SimulatedSensorLayer";

import { useSimulation } from "../../context/SimulationContext";
import { getStations } from "../../services/stationService";
import {
  getTrafficLocations,
  type TrafficLocation,
} from "../../services/trafficService";
import type { Station } from "../../types/station";

const MIN_VISIBLE_TRAFFIC_SCORE = 10;
const MAX_VISIBLE_TRAFFIC_STOPS = 40;

function getPm25Color(pm25?: number): string {
  if (pm25 === undefined || pm25 === null) {
    return "#9e9e9e";
  }

  if (pm25 <= 10) {
    return "#2ecc71";
  }

  if (pm25 <= 20) {
    return "#f1c40f";
  }

  if (pm25 <= 35) {
    return "#e67e22";
  }

  return "#e74c3c";
}

function getTrafficColor(score: number): string {
  if (score >= 50) {
    return "#4527a0";
  }

  if (score >= 25) {
    return "#7e57c2";
  }

  return "#971e22";
}

function getTrafficLevel(score: number): string {
  if (score >= 50) {
    return "Very high";
  }

  if (score >= 25) {
    return "High";
  }

  if (score >= 10) {
    return "Moderate";
  }

  return "Low";
}

function getTrafficMarkerRadius(score: number): number {
  return Math.max(
    4,
    Math.min(11, 4 + score / 12),
  );
}

function formatMeasurement(
  value: number | undefined,
  unit: string,
): string {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "No data";
  }

  return `${value.toFixed(2)} ${unit}`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString();
}

export default function CityMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [trafficLocations, setTrafficLocations] = useState<
    TrafficLocation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showStations, setShowStations] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showCoverageCircles, setShowCoverageCircles] =
    useState(false);

  const { simulatedStations } = useSimulation();

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
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
        setError(
          "Could not load Green Sentinel or DKV transport data.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, []);

  const effectiveStations = useMemo(
    () => [...stations, ...simulatedStations],
    [stations, simulatedStations],
  );

  const visibleTrafficLocations = useMemo(
    () =>
      trafficLocations
        .filter(
          (location) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude) &&
            Number.isFinite(
              location.trafficActivityScore,
            ) &&
            location.trafficActivityScore >=
              MIN_VISIBLE_TRAFFIC_SCORE,
        )
        .sort(
          (first, second) =>
            second.trafficActivityScore -
            first.trafficActivityScore,
        )
        .slice(0, MAX_VISIBLE_TRAFFIC_STOPS),
    [trafficLocations],
  );

  if (loading) {
    return (
      <Card
        sx={{
          mt: 4,
          height: 560,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Card
      sx={{
        mt: 4,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MapContainer
        center={[47.5316, 21.6273]}
        zoom={10}
        minZoom={9}
        maxZoom={16}
        scrollWheelZoom
        style={{
          height: "560px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DebrecenBoundary />

        <MapBoundsController />

        {showHeatmap && (
          <CoverageHeatmap
            stations={effectiveStations}
          />
        )}

        {showCoverageCircles &&
          effectiveStations
            .filter(
              (station) =>
                station.station_type === 0,
            )
            .map((station) => {
              const isSimulated =
                simulatedStations.some(
                  (simulated) =>
                    simulated.id === station.id,
                );

              return (
                <Circle
                  key={`coverage-${station.id}`}
                  center={[
                    station.lat,
                    station.lng,
                  ]}
                  radius={2000}
                  pathOptions={{
                    color: isSimulated
                      ? "#8e24aa"
                      : "#2e7d32",
                    fillColor: isSimulated
                      ? "#ba68c8"
                      : "#66bb6a",
                    fillOpacity: isSimulated
                      ? 0.08
                      : 0.025,
                    opacity: isSimulated
                      ? 0.45
                      : 0.18,
                    weight: isSimulated ? 2 : 1,
                    dashArray: isSimulated
                      ? "8 6"
                      : undefined,
                  }}
                />
              );
            })}

        {showTraffic &&
          visibleTrafficLocations.map(
            (location) => {
              const markerColor =
                getTrafficColor(
                  location.trafficActivityScore,
                );

              return (
                <CircleMarker
                  key={`traffic-${location.stopName}-${location.latitude}-${location.longitude}`}
                  center={[
                    location.latitude,
                    location.longitude,
                  ]}
                  radius={getTrafficMarkerRadius(
                    location.trafficActivityScore,
                  )}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.45,
                    opacity: 0.7,
                    weight: 1,
                  }}
                >
                  <Popup minWidth={260}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {location.stopName}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      DKV public-transport stop
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700 }}
                    >
                      Transport activity
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      <strong>
                        Activity score:
                      </strong>{" "}
                      {location.trafficActivityScore.toFixed(
                        1,
                      )}
                      /100
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75 }}
                    >
                      <strong>
                        Activity level:
                      </strong>{" "}
                      {getTrafficLevel(
                        location.trafficActivityScore,
                      )}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75 }}
                    >
                      <strong>
                        Passenger frequency:
                      </strong>{" "}
                      {formatNumber(
                        location.passengerFrequencyTotal,
                      )}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75 }}
                    >
                      <strong>
                        Passengers in:
                      </strong>{" "}
                      {formatNumber(
                        location.passengersInTotal,
                      )}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75 }}
                    >
                      <strong>
                        Passengers out:
                      </strong>{" "}
                      {formatNumber(
                        location.passengersOutTotal,
                      )}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="body2">
                      <strong>Coordinates:</strong>{" "}
                      {location.latitude.toFixed(5)},{" "}
                      {location.longitude.toFixed(5)}
                    </Typography>
                  </Popup>
                </CircleMarker>
              );
            },
          )}

        {showStations &&
          stations.map((station) => {
            const markerColor =
              station.station_type === 1
                ? "#1976d2"
                : getPm25Color(station.pm25);

            return (
              <CircleMarker
                key={station.id}
                center={[
                  station.lat,
                  station.lng,
                ]}
                radius={9}
                pathOptions={{
                  color: markerColor,
                  fillColor: markerColor,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup minWidth={290}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {station.name}
                  </Typography>

                  {station.stationCode && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {station.stationCode}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700 }}
                  >
                    Air quality
                  </Typography>

                  {station.station_type === 1 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Air-quality measurements are not
                      applicable to this surface-water
                      station.
                    </Typography>
                  ) : (
                    <>
                      <Typography
                        variant="body2"
                        sx={{ mt: 1 }}
                      >
                        <strong>PM2.5:</strong>{" "}
                        {formatMeasurement(
                          station.pm25,
                          "µg/m³",
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75 }}
                      >
                        <strong>PM10:</strong>{" "}
                        {formatMeasurement(
                          station.pm10,
                          "µg/m³",
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75 }}
                      >
                        <strong>NO₂:</strong>{" "}
                        {formatMeasurement(
                          station.no2,
                          "µg/m³",
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75 }}
                      >
                        <strong>O₃:</strong>{" "}
                        {formatMeasurement(
                          station.o3,
                          "µg/m³",
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75 }}
                      >
                        <strong>CO:</strong>{" "}
                        {formatMeasurement(
                          station.co,
                          "µg/m³",
                        )}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75 }}
                      >
                        <strong>CO₂:</strong>{" "}
                        {formatMeasurement(
                          station.co2,
                          "µg/m³",
                        )}
                      </Typography>
                    </>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700 }}
                  >
                    Weather conditions
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1 }}
                  >
                    <strong>Humidity:</strong>{" "}
                    {formatMeasurement(
                      station.humidity,
                      "%",
                    )}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75 }}
                  >
                    <strong>Pressure:</strong>{" "}
                    {formatMeasurement(
                      station.pressure,
                      "mbar",
                    )}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75 }}
                  >
                    <strong>Wind speed:</strong>{" "}
                    {formatMeasurement(
                      station.windSpeed,
                      "km/h",
                    )}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75 }}
                  >
                    <strong>
                      Wind direction:
                    </strong>{" "}
                    {formatMeasurement(
                      station.windDirection,
                      "°",
                    )}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2">
                    <strong>Station type:</strong>{" "}
                    {station.station_type === 1
                      ? "Surface water"
                      : "Air quality"}
                  </Typography>

                  {station.location && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75 }}
                    >
                      <strong>Location:</strong>{" "}
                      {station.location}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75 }}
                  >
                    <strong>Coordinates:</strong>{" "}
                    {station.lat.toFixed(5)},{" "}
                    {station.lng.toFixed(5)}
                  </Typography>
                </Popup>
              </CircleMarker>
            );
          })}

        <SimulatedSensorLayer />
      </MapContainer>

      <Paper
        elevation={3}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          p: 1.5,
          minWidth: 215,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          Map layers
        </Typography>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showStations}
              onChange={(event) =>
                setShowStations(
                  event.target.checked,
                )
              }
            />
          }
          label="Monitoring stations"
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showHeatmap}
              onChange={(event) =>
                setShowHeatmap(
                  event.target.checked,
                )
              }
            />
          }
          label="Coverage heatmap"
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showTraffic}
              onChange={(event) =>
                setShowTraffic(
                  event.target.checked,
                )
              }
            />
          }
          label="DKV transport activity"
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showCoverageCircles}
              onChange={(event) =>
                setShowCoverageCircles(
                  event.target.checked,
                )
              }
            />
          }
          label="Coverage radius"
        />
      </Paper>

      <MapLegend />
    </Card>
  );
}