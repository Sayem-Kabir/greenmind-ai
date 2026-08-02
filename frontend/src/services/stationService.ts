import type { Station } from "../types/station";

interface OfficialStationApiResponse {
  count: number;
  source: string;
  stations: Station[];
}

const API_URL = "http://localhost:8000/api/official-stations/";

export async function getStations(): Promise<Station[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load official stations: ${response.status} ${response.statusText}`,
    );
  }

  const data: OfficialStationApiResponse = await response.json();

  return data.stations;
}