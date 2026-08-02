import type { Station } from "../types/station";

interface StationApiResponse {
  count: number;
  stations: Station[];
}

const API_URL = "http://localhost:8000/api/stations/";

export async function getStations(): Promise<Station[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load stations: ${response.status} ${response.statusText}`,
    );
  }

  const data: StationApiResponse = await response.json();

  return data.stations;
}