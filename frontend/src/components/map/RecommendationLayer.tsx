import { CircleMarker, Popup } from "react-leaflet";

import type { SensorRecommendation } from "../../services/recommendationEngine";

interface Props {
  recommendations: SensorRecommendation[];
}

export default function RecommendationLayer({
  recommendations,
}: Props) {
  return (
    <>
      {recommendations.map((item, index) => (
        <CircleMarker
          key={item.id}
          center={[item.lat, item.lng]}
          radius={11}
          pathOptions={{
            color: "#d32f2f",
            fillColor: "#f44336",
            fillOpacity: 0.95,
            weight: 3,
          }}
        >
          <Popup>
            <strong>AI Recommendation #{index + 1}</strong>

            <br />
            <br />

            Priority: {item.priorityScore}/100

            <br />

            Coverage Gap: {item.coverageScore}/100

            <br />

            Estimated PM2.5:
            {" "}
            {item.estimatedPm25.toFixed(2)} µg/m³

            <br />

            Nearest Station:
            {" "}
            {item.nearestStation}

            <br />

            Distance:
            {" "}
            {item.distanceKm.toFixed(2)} km
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}