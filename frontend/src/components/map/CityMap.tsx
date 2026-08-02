import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Divider,
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
import MapLegend from "./MapLegend";
import SimulatedSensorLayer from "./SimulatedSensorLayer";

import { useSimulation } from "../../context/SimulationContext";
import { getStations } from "../../services/stationService";
import type { Station } from "../../types/station";
import MapBoundsController from "./MapBoundsController";

function getPm25Color(pm25?: number): string {
  if (pm25 === undefined || pm25 === null) {
    return "#9e9e9e";
  }

  if (pm25 <= 10) return "#2ecc71";
  if (pm25 <= 20) return "#f1c40f";
  if (pm25 <= 35) return "#e67e22";

  return "#e74c3c";
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

export default function CityMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { simulatedStations } = useSimulation();

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await getStations();
        setStations(data);
      } catch {
        setError("Could not load Green Sentinel stations.");
      } finally {
        setLoading(false);
      }
    }

    loadStations();
  }, []);

  const effectiveStations = useMemo(
    () => [...stations, ...simulatedStations],
    [stations, simulatedStations],
  );

  if (loading) {
    return (
      <Card
        sx={{
          mt: 4,
          height: 520,
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
        zoom={12}
        minZoom={11}
        maxZoom={16}
        scrollWheelZoom
        style={{
          height: "520px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsController stations={effectiveStations} />

        <CoverageHeatmap stations={effectiveStations} />

        {effectiveStations
          .filter((station) => station.station_type === 0)
          .map((station) => {
            const isSimulated = simulatedStations.some(
              (simulated) => simulated.id === station.id,
            );

            return (
              <Circle
                key={`coverage-${station.id}`}
                center={[station.lat, station.lng]}
                radius={2000}
                pathOptions={{
                  color: isSimulated ? "#8e24aa" : "#2e7d32",
                  fillColor: isSimulated
                    ? "#ba68c8"
                    : "#66bb6a",
                  fillOpacity: isSimulated ? 0.08 : 0.03,
                  opacity: isSimulated ? 0.45 : 0.2,
                  weight: isSimulated ? 2 : 1,
                  dashArray: isSimulated
                    ? "8 6"
                    : undefined,
                }}
              />
            );
          })}

        {stations.map((station) => {
          const markerColor =
            station.station_type === 1
              ? "#1976d2"
              : getPm25Color(station.pm25);

          return (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lng]}
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
                    Air-quality measurements are not applicable
                    to this surface-water station.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>PM2.5:</strong>{" "}
                      {formatMeasurement(
                        station.pm25,
                        "µg/m³",
                      )}
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                      <strong>PM10:</strong>{" "}
                      {formatMeasurement(
                        station.pm10,
                        "µg/m³",
                      )}
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                      <strong>NO₂:</strong>{" "}
                      {formatMeasurement(
                        station.no2,
                        "µg/m³",
                      )}
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                      <strong>O₃:</strong>{" "}
                      {formatMeasurement(
                        station.o3,
                        "µg/m³",
                      )}
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                      <strong>CO:</strong>{" "}
                      {formatMeasurement(
                        station.co,
                        "µg/m³",
                      )}
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.75 }}>
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

                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Humidity:</strong>{" "}
                  {formatMeasurement(
                    station.humidity,
                    "%",
                  )}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Pressure:</strong>{" "}
                  {formatMeasurement(
                    station.pressure,
                    "mbar",
                  )}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Wind speed:</strong>{" "}
                  {formatMeasurement(
                    station.windSpeed,
                    "km/h",
                  )}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Wind direction:</strong>{" "}
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
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    <strong>Location:</strong>{" "}
                    {station.location}
                  </Typography>
                )}

                <Typography variant="body2" sx={{ mt: 0.75 }}>
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

      <MapLegend />
    </Card>
  );
}