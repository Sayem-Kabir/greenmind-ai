export interface GridPoint {
  id: number;
  lat: number;
  lng: number;
}

/*
 * Bounding box of the Debrecen GeoJSON boundary.
 *
 * The generated rectangle is later clipped using
 * isInsideDebrecenBoundary(), so only points inside
 * Debrecen will be displayed.
 */
const MIN_LAT = 47.39058;
const MAX_LAT = 47.73228;
const MIN_LNG = 21.41611;
const MAX_LNG = 21.86276;

/*
 * 0.01 degrees is roughly:
 * - 1.11 km latitude
 * - 0.75 km longitude around Debrecen
 *
 * This gives reasonable performance while covering
 * the complete administrative boundary.
 */
const GRID_STEP = 0.01;

function generateCityGrid(): GridPoint[] {
  const points: GridPoint[] = [];
  let id = 1;

  for (
    let lat = MIN_LAT;
    lat <= MAX_LAT + 1e-9;
    lat += GRID_STEP
  ) {
    for (
      let lng = MIN_LNG;
      lng <= MAX_LNG + 1e-9;
      lng += GRID_STEP
    ) {
      points.push({
        id,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });

      id += 1;
    }
  }

  return points;
}

export const cityGrid = generateCityGrid();