import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import type { Station } from "../types/station";
import type { SensorRecommendation } from "../types/recommendation";

export interface SimulatedStation extends Station {
  recommendation: SensorRecommendation;
}

interface SimulationContextType {
  simulatedStations: SimulatedStation[];

  simulateRecommendation: (
    recommendation: SensorRecommendation,
  ) => void;

  clearSimulation: () => void;
}

const SimulationContext =
  createContext<SimulationContextType | null>(null);

export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [simulatedStations, setSimulatedStations] = useState<
    SimulatedStation[]
  >([]);

  function simulateRecommendation(
    recommendation: SensorRecommendation,
  ) {
    const station: SimulatedStation = {
      id: Date.now(),

      name: "Simulated AI Sensor",

      lat: recommendation.lat,
      lng: recommendation.lng,

      station_type: 0,

      pm25: recommendation.estimatedPm25,

      windSpeed: recommendation.estimatedWindSpeed,

      windDirection: 0,

      recommendation,
    };

    setSimulatedStations((previous) => {
      const alreadySimulated = previous.some(
        (existing) =>
          existing.lat === recommendation.lat &&
          existing.lng === recommendation.lng,
      );

      if (alreadySimulated) {
        return previous;
      }

      return [...previous, station];
    });
  }

  function clearSimulation() {
    setSimulatedStations([]);
  }

  const value = useMemo(
    () => ({
      simulatedStations,
      simulateRecommendation,
      clearSimulation,
    }),
    [simulatedStations],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error(
      "useSimulation must be used inside SimulationProvider",
    );
  }

  return context;
}