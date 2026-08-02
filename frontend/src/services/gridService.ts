export interface GridPoint {
  id: number;
  lat: number;
  lng: number;
}

const MIN_LAT = 47.47;
const MAX_LAT = 47.59;
const MIN_LNG = 21.54;
const MAX_LNG = 21.73;
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