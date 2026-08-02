export function isInsideUrbanArea(
  latitude: number,
  longitude: number,
): boolean {
  const minimumLatitude = 47.47;
  const maximumLatitude = 47.59;

  const minimumLongitude = 21.54;
  const maximumLongitude = 21.73;

  return (
    latitude >= minimumLatitude &&
    latitude <= maximumLatitude &&
    longitude >= minimumLongitude &&
    longitude <= maximumLongitude
  );
}