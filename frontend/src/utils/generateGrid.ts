export interface GridPoint {
  id: number;
  lat: number;
  lng: number;
}

export function generateGrid(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  step: number,
): GridPoint[] {
  const points: GridPoint[] = [];

  let id = 1;

  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      points.push({
        id: id++,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    }
  }

  return points;
}