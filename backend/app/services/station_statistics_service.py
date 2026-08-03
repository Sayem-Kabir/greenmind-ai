from functools import lru_cache
from typing import Any

import pandas as pd

from app.services.processed_dataset_service import (
    load_processed_air_data,
)


def safe_number(value: Any) -> float | None:
    if pd.isna(value):
        return None

    return round(float(value), 2)


@lru_cache(maxsize=1)
def get_station_statistics() -> list[dict[str, Any]]:
    data = load_processed_air_data()

    grouped = (
        data.groupby(
            ["station_code", "location"],
            as_index=False,
        )
        .agg(
            pm25=("pm25", "mean"),
            pm10=("pm10", "mean"),
            no2=("no2", "mean"),
            o3=("o3", "mean"),
            co=("co", "mean"),
            co2=("co2", "mean"),
            humidity=("humidity", "mean"),
            pressure=("pressure", "mean"),
            wind_speed=("wind_speed", "mean"),
            wind_direction=("wind_direction", "mean"),

            pm25_max=("pm25", "max"),
            pm10_max=("pm10", "max"),
            no2_max=("no2", "max"),

            pm25_std=("pm25", "std"),
            pm10_std=("pm10", "std"),
            no2_std=("no2", "std"),

            observation_count=("timestamp", "count"),
        )
        .sort_values("station_code")
    )

    stations: list[dict[str, Any]] = []

    for _, row in grouped.iterrows():
        stations.append(
            {
                "stationCode": row["station_code"],
                "location": row["location"],

                "pm25": safe_number(row["pm25"]),
                "pm10": safe_number(row["pm10"]),
                "no2": safe_number(row["no2"]),
                "o3": safe_number(row["o3"]),
                "co": safe_number(row["co"]),
                "co2": safe_number(row["co2"]),
                "humidity": safe_number(row["humidity"]),
                "pressure": safe_number(row["pressure"]),
                "windSpeed": safe_number(row["wind_speed"]),
                "windDirection": safe_number(
                    row["wind_direction"],
                ),

                "pm25Max": safe_number(row["pm25_max"]),
                "pm10Max": safe_number(row["pm10_max"]),
                "no2Max": safe_number(row["no2_max"]),

                "pm25Std": safe_number(row["pm25_std"]),
                "pm10Std": safe_number(row["pm10_std"]),
                "no2Std": safe_number(row["no2_std"]),

                "observationCount": int(
                    row["observation_count"],
                ),
            }
        )

    return stations


def clear_station_statistics_cache() -> None:
    get_station_statistics.cache_clear()