import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import type { Station } from "../../types/station";

interface Props {
  stations: Station[];
}

export default function MapBoundsController({
  stations,
}: Props) {
  const map = useMap();

  useEffect(() => {
    const validStations = stations.filter(
      (station) =>
        Number.isFinite(station.lat) &&
        Number.isFinite(station.lng),
    );

    if (validStations.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      validStations.map((station) => [
        station.lat,
        station.lng,
      ]),
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12,
      animate: true,
    });
  }, [map, stations]);

  return null;
}