import debrecenBoundaryJson from "../data/debrecenBoundary.json";

type Coordinate = [number, number];

interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: Coordinate[][][];
}

interface BoundaryFeature {
  type: "Feature";
  geometry: MultiPolygonGeometry;
}

interface BoundaryCollection {
  type: "FeatureCollection";
  features: BoundaryFeature[];
}

const debrecenBoundary =
  debrecenBoundaryJson as unknown as BoundaryCollection;

function isPointInsideRing(
  longitude: number,
  latitude: number,
  ring: Coordinate[],
): boolean {
  let inside = false;

  for (
    let currentIndex = 0,
      previousIndex = ring.length - 1;
    currentIndex < ring.length;
    previousIndex = currentIndex++
  ) {
    const [currentLongitude, currentLatitude] =
      ring[currentIndex];

    const [previousLongitude, previousLatitude] =
      ring[previousIndex];

    const crossesLatitude =
      currentLatitude > latitude !==
      previousLatitude > latitude;

    if (!crossesLatitude) {
      continue;
    }

    const longitudeAtIntersection =
      ((previousLongitude - currentLongitude) *
        (latitude - currentLatitude)) /
        (previousLatitude - currentLatitude) +
      currentLongitude;

    if (longitude < longitudeAtIntersection) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInsidePolygon(
  longitude: number,
  latitude: number,
  polygon: Coordinate[][],
): boolean {
  if (polygon.length === 0) {
    return false;
  }

  const outerRing = polygon[0];

  if (
    !isPointInsideRing(
      longitude,
      latitude,
      outerRing,
    )
  ) {
    return false;
  }

  // Any additional ring represents a hole.
  for (
    let ringIndex = 1;
    ringIndex < polygon.length;
    ringIndex += 1
  ) {
    if (
      isPointInsideRing(
        longitude,
        latitude,
        polygon[ringIndex],
      )
    ) {
      return false;
    }
  }

  return true;
}

export function isInsideDebrecenBoundary(
  latitude: number,
  longitude: number,
): boolean {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return false;
  }

  for (const feature of debrecenBoundary.features) {
    for (const polygon of feature.geometry.coordinates) {
      if (
        isPointInsidePolygon(
          longitude,
          latitude,
          polygon,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}