import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

import debrecenBoundary from "../../data/debrecenBoundary.json";

export default function MapBoundsController() {
  const map = useMap();

  useEffect(() => {
    const boundaryLayer = L.geoJSON(
      debrecenBoundary as GeoJSON.GeoJsonObject,
    );

    const bounds = boundaryLayer.getBounds();

    if (!bounds.isValid()) {
      return;
    }

    map.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom: 10,
      animate: false,
    });

    map.setMaxBounds(
      bounds.pad(0.12),
    );

    map.options.maxBoundsViscosity = 0.8;
  }, [map]);

  return null;
}