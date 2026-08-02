export interface Station {
  id: number;

  name: string;

  lat: number;
  lng: number;

  station_type: number;

  stationCode?: string;
  location?: string;
  timestamp?: string;

  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  co?: number;
  co2?: number;

  humidity?: number;
  pressure?: number;

  windSpeed?: number;
  windDirection?: number;
}