from typing import Any


def clean_number(
    value: Any,
    *,
    allow_negative: bool = False,
    decimals: int = 2,
) -> float | None:
    if value is None or value == "":
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if not allow_negative and number < 0:
        return None

    return round(number, decimals)


def is_negative_number(value: Any) -> bool:
    if value is None or value == "":
        return False

    try:
        return float(value) < 0
    except (TypeError, ValueError):
        return False


def analyse_station_data(
    raw_stations: list[dict[str, Any]],
) -> dict[str, Any]:
    cleaned_stations: list[dict[str, Any]] = []

    missing_pm25 = 0
    missing_wind_speed = 0
    missing_wind_direction = 0
    invalid_coordinates = 0
    negative_values_removed = 0

    air_station_count = 0
    surface_water_station_count = 0

    for item in raw_stations:
        station_type = int(item.get("station_type", 0))
        is_air_station = station_type == 0

        if is_air_station:
            air_station_count += 1
        else:
            surface_water_station_count += 1

        pm25_raw = item.get("pm25")
        wind_speed_raw = item.get("windSpeed")
        wind_direction_raw = item.get("windDirection")

        pm25 = clean_number(pm25_raw)
        wind_speed = clean_number(wind_speed_raw)
        wind_direction = clean_number(
            wind_direction_raw,
            allow_negative=False,
        )

        if is_air_station:
            if is_negative_number(pm25_raw):
                negative_values_removed += 1

            if is_negative_number(wind_speed_raw):
                negative_values_removed += 1

            if is_negative_number(wind_direction_raw):
                negative_values_removed += 1

            if item.get("pm25Missing") or pm25 is None:
                pm25 = None
                missing_pm25 += 1

            if item.get("windSpeedMissing") or wind_speed is None:
                wind_speed = None
                missing_wind_speed += 1

            if (
                item.get("windDirectionMissing")
                or wind_direction is None
            ):
                wind_direction = None
                missing_wind_direction += 1
        else:
            # Air-quality measurements are not applicable
            # to surface-water stations.
            pm25 = None
            wind_speed = None
            wind_direction = None

        latitude = clean_number(
            str(item.get("lat", "")).strip(),
            allow_negative=True,
            decimals=6,
        )

        longitude = clean_number(
            str(item.get("lng", "")).strip(),
            allow_negative=True,
            decimals=6,
        )

        coordinates_valid = (
            latitude is not None
            and longitude is not None
            and -90 <= latitude <= 90
            and -180 <= longitude <= 180
        )

        if not coordinates_valid:
            invalid_coordinates += 1

        cleaned_stations.append(
            {
                "id": item.get("id"),
                "name": (
                    item.get("title", {}).get("en")
                    or item.get("name")
                    or "Unknown station"
                ),
                "lat": latitude,
                "lng": longitude,
                "pm25": pm25,
                "windSpeed": wind_speed,
                "windDirection": wind_direction,
                "station_type": station_type,
                "coordinatesValid": coordinates_valid,
            }
        )

    valid_pm25_count = sum(
        1
        for station in cleaned_stations
        if station["station_type"] == 0
        and station["pm25"] is not None
    )

    pm25_completeness = (
        round(
            (valid_pm25_count / air_station_count) * 100,
            1,
        )
        if air_station_count
        else 0
    )

    return {
        "summary": {
            "totalRecords": len(cleaned_stations),
            "airStations": air_station_count,
            "surfaceWaterStations": surface_water_station_count,
            "validPm25": valid_pm25_count,
            "missingPm25": missing_pm25,
            "missingWindSpeed": missing_wind_speed,
            "missingWindDirection": missing_wind_direction,
            "invalidCoordinates": invalid_coordinates,
            "negativeValuesRemoved": negative_values_removed,
            "pm25Completeness": pm25_completeness,
        },
        "stations": cleaned_stations,
    }