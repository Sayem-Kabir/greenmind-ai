import { CircleMarker, Popup } from "react-leaflet";

import { cityGrid } from "../../services/gridService";
import type { Station } from "../../types/station";
import { isInsideUrbanArea } from "../../utils/isInsideUrbanArea";
import { findNearestAirStation } from "../../utils/nearestStation";

interface CoverageHeatmapProps {
  stations: Station[];
}

function getCoverageColor(score: number): string {
  if (score >= 70) return "#2e7d32";
  if (score >= 40) return "#f9a825";

  return "#d32f2f";
}

export default function CoverageHeatmap({
  stations,
}: CoverageHeatmapProps) {
  const airStations = stations.filter(
    (station) => station.station_type === 0,
  );

  if (airStations.length === 0) {
    return null;
  }

  const gridWithDistances = cityGrid
    .filter((point) => isInsideUrbanArea(point.lat, point.lng))
    .map((point) => {
      const nearest = findNearestAirStation(
        point.lat,
        point.lng,
        airStations,
      );

      return {
        ...point,
        distanceKm: nearest.distanceKm,
      };
    })
    .filter(
      (
        point,
      ): point is {
        id: number;
        lat: number;
        lng: number;
        distanceKm: number;
      } => point.distanceKm !== null,
    );

  if (gridWithDistances.length === 0) {
    return null;
  }

  const maximumDistance = Math.max(
    ...gridWithDistances.map((point) => point.distanceKm),
  );

  return (
    <>
      {gridWithDistances.map((point) => {
        const coverageScore =
          maximumDistance === 0
            ? 100
            : Math.round(
                100 - (point.distanceKm / maximumDistance) * 100,
              );

        const color = getCoverageColor(coverageScore);

        return (
          <CircleMarker
            key={`heat-${point.id}`}
            center={[point.lat, point.lng]}
            radius={8}
            interactive
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.14,
              opacity: 0,
              weight: 0,
            }}
          >
            <Popup>
              <strong>Monitoring coverage</strong>

              <br />
              <br />

              <b>Coverage score:</b> {coverageScore}/100

              <br />

              <b>Distance to nearest air station:</b>{" "}
              {point.distanceKm.toFixed(2)} km
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}