export interface Station {
  id: number;
  name: string;
  lat: number;
  lng: number;
  pm25?: number;
  windSpeed?: number;
  windDirection?: number;
  station_type: number;
}