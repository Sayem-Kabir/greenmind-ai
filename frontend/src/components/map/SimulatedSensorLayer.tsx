import {
  Box,
  Divider,
  Typography,
} from "@mui/material";
import {
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";

import { useSimulation } from "../../context/SimulationContext";

export default function SimulatedSensorLayer() {
  const { simulatedStations } = useSimulation();

  return (
    <>
      {simulatedStations.map((station) => {
        const recommendation = station.recommendation;

        return (
          <Box key={station.id} component="span">
            <Circle
              center={[station.lat, station.lng]}
              radius={2000}
              pathOptions={{
                color: "#8e24aa",
                fillColor: "#8e24aa",
                fillOpacity: 0.04,
                opacity: 0.45,
                weight: 2,
                dashArray: "8 8",
              }}
            />

            <CircleMarker
              center={[station.lat, station.lng]}
              radius={11}
              pathOptions={{
                color: "#6a1b9a",
                fillColor: "#8e24aa",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup minWidth={290}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  AI Simulated Sensor
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Proposed sensor added to the monitoring network.
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="body2">
                  <strong>Priority score:</strong>{" "}
                  {recommendation.priorityScore}/100
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Coverage gap:</strong>{" "}
                  {recommendation.coverageScore}/100
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Pollution risk:</strong>{" "}
                  {recommendation.pollutionRisk}/100
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Historical variability:</strong>{" "}
                  {recommendation.variabilityRisk}/100
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Low-wind risk:</strong>{" "}
                  {recommendation.windRisk}/100
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700 }}
                >
                  Estimated conditions
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>PM2.5:</strong>{" "}
                  {recommendation.estimatedPm25.toFixed(2)} µg/m³
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>PM10:</strong>{" "}
                  {recommendation.estimatedPm10.toFixed(2)} µg/m³
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>NO₂:</strong>{" "}
                  {recommendation.estimatedNo2.toFixed(2)} µg/m³
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>O₃:</strong>{" "}
                  {recommendation.estimatedO3.toFixed(2)} µg/m³
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Wind speed:</strong>{" "}
                  {recommendation.estimatedWindSpeed.toFixed(2)} km/h
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700 }}
                >
                  Historical variability
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>PM2.5 σ:</strong>{" "}
                  {recommendation.estimatedPm25Std.toFixed(2)}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>PM10 σ:</strong>{" "}
                  {recommendation.estimatedPm10Std.toFixed(2)}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>NO₂ σ:</strong>{" "}
                  {recommendation.estimatedNo2Std.toFixed(2)}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="body2">
                  <strong>Nearest station:</strong>
                  <br />
                  {recommendation.nearestStation}
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Distance:</strong>{" "}
                  {recommendation.distanceKm.toFixed(2)} km
                </Typography>

                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  <strong>Coordinates:</strong>{" "}
                  {station.lat.toFixed(5)},{" "}
                  {station.lng.toFixed(5)}
                </Typography>
              </Popup>
            </CircleMarker>
          </Box>
        );
      })}
    </>
  );
}