import { CircleMarker, Popup } from "react-leaflet";

import { useSimulation } from "../../context/SimulationContext";

export default function SimulatedSensorLayer() {
  const { simulatedStations } = useSimulation();

  return (
    <>
      {simulatedStations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lng]}
          radius={10}
          pathOptions={{
            color: "#8e24aa",
            fillColor: "#8e24aa",
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>
            <strong>AI Simulated Sensor</strong>

            <br />
            <br />

            <b>Name:</b> {station.name}

            <br />

            <b>Estimated PM2.5:</b>{" "}
            {station.pm25?.toFixed(2)} µg/m³

            <br />

            <b>Estimated Wind Speed:</b>{" "}
            {station.windSpeed?.toFixed(2)} m/s
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}