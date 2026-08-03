import json
import re
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.services.processed_dataset_service import (
    get_latest_station_measurements,
)

router = APIRouter(
    prefix="/api/official-stations",
    tags=["Official Stations"],
)

STATION_METADATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "green-sentinel-points.json"
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
            latitude = float(str(item.get("lat", "")).strip())
            longitude = float(str(item.get("lng", "")).strip())
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
            "station_type": int(item.get("station_type", 0)),
        }

    return metadata_by_id


@router.get("/")
def get_official_stations() -> dict[str, Any]:
    try:
        latest_measurements = get_latest_station_measurements()
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
                "timestamp": measurement["timestamp"],
                "pm25": measurement.get("pm25"),
                "pm10": measurement.get("pm10"),
                "no2": measurement.get("no2"),
                "o3": measurement.get("o3"),
                "co": measurement.get("co"),
                "co2": measurement.get("co2"),
                "humidity": measurement.get("humidity"),
                "pressure": measurement.get("pressure"),
                "windSpeed": measurement.get("wind_speed"),
                "windDirection": measurement.get(
                    "wind_direction"
                ),
            }
        )

    stations.sort(key=lambda station: station["id"])

    return {
        "count": len(stations),
        "source": "Official 30-day Green Sentinel dataset",
        "stations": stations,
    }