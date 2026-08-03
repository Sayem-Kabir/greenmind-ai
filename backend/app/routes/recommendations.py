import json
import re
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.station_statistics_service import (
    get_station_statistics,
)
from app.services.recommendation_engine import (
    generate_recommendations,
)

router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"],
)

STATION_METADATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "green-sentinel-points.json"
)


class SimulatedStation(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    station_type: int = 0
    pm25: float | None = None
    windSpeed: float | None = None
    windDirection: float | None = None


class SimulationRequest(BaseModel):
    simulatedStations: list[SimulatedStation] = Field(
        default_factory=list,
    )


def extract_station_id(station_code: str) -> int | None:
    match = re.search(r"(\d+)$", station_code)

    if not match:
        return None

    return int(match.group(1))


def load_station_metadata() -> dict[int, dict[str, Any]]:
    if not STATION_METADATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Station metadata file not found.",
        )

    try:
        with STATION_METADATA_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            raw_metadata = json.load(file)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=500,
            detail="Station metadata contains invalid JSON.",
        ) from error

    metadata_by_id: dict[int, dict[str, Any]] = {}

    for item in raw_metadata:
        station_id = item.get("id")

        if station_id is None:
            continue

        try:
            station_id = int(station_id)
            latitude = float(
                str(item.get("lat", "")).strip()
            )
            longitude = float(
                str(item.get("lng", "")).strip()
            )
        except (TypeError, ValueError):
            continue

        metadata_by_id[station_id] = {
            "id": station_id,
            "name": (
                item.get("title", {}).get("en")
                or item.get("name")
                or f"Station {station_id}"
            ),
            "lat": latitude,
            "lng": longitude,
            "station_type": int(
                item.get("station_type", 0)
            ),
        }

    return metadata_by_id


def load_official_air_stations() -> list[dict[str, Any]]:
    try:
        latest_measurements = (
            get_station_statistics()
        )
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    metadata_by_id = load_station_metadata()

    stations: list[dict[str, Any]] = []

    for measurement in latest_measurements:
        station_code = measurement["stationCode"]
        station_id = extract_station_id(station_code)

        if station_id is None:
            continue

        metadata = metadata_by_id.get(station_id)

        if metadata is None:
            continue

        stations.append(
    {
        **metadata,
        "stationCode": station_code,
        "location": measurement["location"],

        "pm25": measurement.get("pm25"),
        "pm10": measurement.get("pm10"),
        "no2": measurement.get("no2"),
        "o3": measurement.get("o3"),
        "co": measurement.get("co"),
        "co2": measurement.get("co2"),
        "humidity": measurement.get("humidity"),
        "pressure": measurement.get("pressure"),

        "windSpeed": measurement.get("windSpeed"),
        "windDirection": measurement.get(
            "windDirection"
        ),

        "pm25Max": measurement.get("pm25Max"),
        "pm10Max": measurement.get("pm10Max"),
        "no2Max": measurement.get("no2Max"),

        "pm25Std": measurement.get("pm25Std"),
        "pm10Std": measurement.get("pm10Std"),
        "no2Std": measurement.get("no2Std"),

        "observationCount": measurement.get(
            "observationCount"
        ),
        "coordinatesValid": True,
    }
)
    return stations


@router.get("/")
def get_recommendations() -> dict[str, Any]:
    stations = load_official_air_stations()

    recommendations = generate_recommendations(
        stations,
    )

    return {
        "count": len(recommendations),
        "simulatedStationCount": 0,
        "source": (
            "Official 30-day Green Sentinel dataset"
        ),
        "recommendations": recommendations,
    }


@router.post("/simulate")
def get_simulated_recommendations(
    request: SimulationRequest,
) -> dict[str, Any]:
    official_stations = load_official_air_stations()

    simulated_stations = [
        {
            **station.model_dump(),
            "coordinatesValid": True,
        }
        for station in request.simulatedStations
    ]

    effective_stations = [
        *official_stations,
        *simulated_stations,
    ]

    recommendations = generate_recommendations(
        effective_stations,
    )

    return {
        "count": len(recommendations),
        "simulatedStationCount": len(
            simulated_stations
        ),
        "source": (
            "Official 30-day Green Sentinel dataset"
        ),
        "recommendations": recommendations,
    }