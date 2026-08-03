import { useMemo } from "react";
import { CircleMarker } from "react-leaflet";

import { cityGrid } from "../../services/gridService";
import type { Station } from "../../types/station";
import { findNearestAirStation } from "../../utils/nearestStation";
import { isInsideDebrecenBoundary } from "../../utils/isInsideDebrecenBoundary";

interface CoverageHeatmapProps {
  stations: Station[];
}

function getCoverageColor(score: number): string {
  if (score >= 70) {
    return "#2e7d32";
  }

  if (score >= 40) {
    return "#f9a825";
  }

  return "#d32f2f";
}

function getCoverageOpacity(score: number): number {
  if (score >= 70) {
    return 0.08;
  }

  if (score >= 40) {
    return 0.1;
  }

  return 0.13;
}

export default function CoverageHeatmap({
  stations,
}: CoverageHeatmapProps) {
  const heatmapPoints = useMemo(() => {
    const airStations = stations.filter(
      (station) =>
        station.station_type === 0 &&
        Number.isFinite(station.lat) &&
        Number.isFinite(station.lng),
    );

    if (airStations.length === 0) {
      return [];
    }

    const gridWithDistances = cityGrid
      .filter((point) =>
        isInsideDebrecenBoundary(
          point.lat,
          point.lng,
        ),
      )
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
        } =>
          point.distanceKm !== null &&
          Number.isFinite(point.distanceKm),
      );

    if (gridWithDistances.length === 0) {
      return [];
    }

    const maximumDistance = Math.max(
      ...gridWithDistances.map(
        (point) => point.distanceKm,
      ),
    );

    return gridWithDistances.map((point) => {
      const coverageScore =
        maximumDistance === 0
          ? 100
          : Math.round(
              100 -
                (point.distanceKm /
                  maximumDistance) *
                  100,
            );

      return {
        ...point,
        coverageScore,
      };
    });
  }, [stations]);

  if (heatmapPoints.length === 0) {
    return null;
  }

  return (
    <>
      {heatmapPoints.map((point) => {
        const color = getCoverageColor(
          point.coverageScore,
        );

        return (
          <CircleMarker
            key={`coverage-heat-${point.id}`}
            center={[
              point.lat,
              point.lng,
            ]}
            radius={12}
            interactive={false}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: getCoverageOpacity(
                point.coverageScore,
              ),
              opacity: 0,
              weight: 0,
            }}
          />
        );
      })}
    </>
  );
}