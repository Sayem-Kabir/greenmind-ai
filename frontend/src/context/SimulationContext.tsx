import { createContext, useContext, useMemo, useState } from "react";

import type { Station } from "../types/station";
import type { SensorRecommendation } from "../types/recommendation";

interface SimulationContextType {
  simulatedStations: Station[];

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
    Station[]
  >([]);

  function simulateRecommendation(
    recommendation: SensorRecommendation,
  ) {
    console.log("Simulation clicked", recommendation);
    const station: Station = {
      id: Date.now(),

      name: "Simulated AI Sensor",

      lat: recommendation.lat,
      lng: recommendation.lng,

      station_type: 0,

      pm25: recommendation.estimatedPm25,

      windSpeed: recommendation.estimatedWindSpeed,

      windDirection: 0,
    };

    setSimulatedStations((previous) => [
      ...previous,
      station,
    ]);
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