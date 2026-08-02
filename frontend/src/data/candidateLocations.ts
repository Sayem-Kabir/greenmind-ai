export interface CandidateLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export const candidateLocations: CandidateLocation[] = [
  {
    id: 1,
    name: "North Debrecen",
    lat: 47.585,
    lng: 21.64,
  },
  {
    id: 2,
    name: "West Debrecen",
    lat: 47.54,
    lng: 21.55,
  },
  {
    id: 3,
    name: "East Debrecen",
    lat: 47.54,
    lng: 21.73,
  },
  {
    id: 4,
    name: "South Debrecen",
    lat: 47.47,
    lng: 21.66,
  },
  {
    id: 5,
    name: "South-West Debrecen",
    lat: 47.49,
    lng: 21.57,
  },
];