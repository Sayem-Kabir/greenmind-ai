import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CircularProgress } from "@mui/material";
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

function getPm25Color(pm25?: number): string {
  if (pm25 === undefined || pm25 === null) {
    return "#9e9e9e";
  }

  if (pm25 <= 10) return "#2ecc71";
  if (pm25 <= 20) return "#f1c40f";
  if (pm25 <= 35) return "#e67e22";

  return "#e74c3c";
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
          height: 500,
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
        zoom={11}
        style={{
          height: "500px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
                  fillColor: isSimulated ? "#ba68c8" : "#66bb6a",
                  fillOpacity: isSimulated ? 0.08 : 0.03,
                  opacity: isSimulated ? 0.45 : 0.2,
                  weight: isSimulated ? 2 : 1,
                  dashArray: isSimulated ? "8 6" : undefined,
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
              <Popup>
                <strong>{station.name}</strong>

                <br />
                <br />

                <b>PM2.5:</b>{" "}
                {station.station_type === 1
                  ? "Not applicable"
                  : station.pm25 ?? "No data"}{" "}
                {station.station_type === 0 ? "µg/m³" : ""}

                <br />

                <b>Wind speed:</b>{" "}
                {station.windSpeed ?? "No data"} m/s

                <br />

                <b>Wind direction:</b>{" "}
                {station.windDirection ?? "No data"}°

                <br />

                <b>Station type:</b>{" "}
                {station.station_type === 1
                  ? "Surface water"
                  : "Air quality"}
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