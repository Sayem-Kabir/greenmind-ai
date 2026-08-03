import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/stations", tags=["Stations"])

DATA_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "green-sentinel-points.json"
)


@router.get("/")
def get_stations() -> dict[str, Any]:
    if not DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Station data file not found.",
        )

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            raw_stations = json.load(file)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=500,
            detail="Station data file contains invalid JSON.",
        ) from error

    stations = []

    for item in raw_stations:
        stations.append(
            {
                "id": item.get("id"),
                "name": (
                    item.get("title", {}).get("en")
                    or item.get("name")
                    or "Unknown station"
                ),
                "lat": float(str(item.get("lat", "")).strip()),
                "lng": float(str(item.get("lng", "")).strip()),
                "pm25": (
                    None
                    if item.get("pm25Missing")
                    else item.get("pm25")
                ),
                "windSpeed": (
                    None
                    if item.get("windSpeedMissing")
                    else float(item.get("windSpeed", 0))
                ),
                "windDirection": (
                    None
                    if item.get("windDirectionMissing")
                    else float(item.get("windDirection", 0))
                ),
                "station_type": item.get("station_type", 0),
            }
        )

    return {
        "count": len(stations),
        "stations": stations,
    }