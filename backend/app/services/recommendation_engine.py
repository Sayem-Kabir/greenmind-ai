from __future__ import annotations

import csv
import re
from functools import lru_cache
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any

EARTH_RADIUS_KM = 6371.0

# Debrecen recommendation grid
MIN_LAT = 47.47
MAX_LAT = 47.59
MIN_LNG = 21.54
MAX_LNG = 21.73
GRID_STEP = 0.01

# Green Sentinel interpolation settings
MAX_INTERPOLATION_DISTANCE_KM = 15.0
NEAREST_STATION_COUNT = 5

# DKV transport influence settings
TRAFFIC_SEARCH_RADIUS_KM = 2.0
MAX_NEARBY_TRAFFIC_STOPS = 10
MIN_TRAFFIC_DISTANCE_KM = 0.10

# Project root:
# GREENMIND-AI/
#
# This file:
# GREENMIND-AI/backend/app/services/recommendation_engine.py
PROJECT_ROOT = Path(__file__).resolve().parents[3]

TRAFFIC_DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "traffic_activity.csv"
)

NOISE_DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "noise_measurements_cleaned.csv"
)

WATER_DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "water_measurements_cleaned.csv"
)

LOCATION_COORDINATE_PATTERN = re.compile(
    r"\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)\s*$"
)


def calculate_distance_km(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    """
    Calculate geographic distance using the Haversine formula.
    """

    latitude_difference = radians(
        latitude_2 - latitude_1
    )
    longitude_difference = radians(
        longitude_2 - longitude_1
    )

    first_latitude = radians(latitude_1)
    second_latitude = radians(latitude_2)

    value = (
        sin(latitude_difference / 2) ** 2
        + cos(first_latitude)
        * cos(second_latitude)
        * sin(longitude_difference / 2) ** 2
    )

    value = max(0.0, min(1.0, value))

    return (
        2
        * EARTH_RADIUS_KM
        * asin(sqrt(value))
    )


def normalize(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """
    Normalize a value to the range 0-100.
    """

    if maximum <= minimum:
        return 0.0

    normalized = (
        (value - minimum)
        / (maximum - minimum)
        * 100
    )

    return max(
        0.0,
        min(100.0, normalized),
    )


def round_optional(
    value: float | None,
    decimals: int = 2,
) -> float:
    if value is None:
        return 0.0

    return round(value, decimals)


def safe_float(
    value: Any,
) -> float | None:
    """
    Convert a value to float without allowing invalid,
    infinite or missing values to break the engine.
    """

    if value is None:
        return None

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return None

    if numeric_value != numeric_value:
        return None

    if numeric_value in (
        float("inf"),
        float("-inf"),
    ):
        return None

    return numeric_value


def generate_city_grid() -> list[dict[str, float | int]]:
    points: list[dict[str, float | int]] = []

    point_id = 1
    latitude = MIN_LAT

    while latitude <= MAX_LAT + 1e-9:
        longitude = MIN_LNG

        while longitude <= MAX_LNG + 1e-9:
            points.append(
                {
                    "id": point_id,
                    "lat": round(latitude, 6),
                    "lng": round(longitude, 6),
                }
            )

            point_id += 1
            longitude += GRID_STEP

        latitude += GRID_STEP

    return points


# =========================================================
# DKV TRANSPORT DATA
# =========================================================


@lru_cache(maxsize=1)
def load_traffic_locations() -> tuple[
    dict[str, Any],
    ...,
]:
    """
    Load the processed DKV traffic dataset once and cache it.

    Expected CSV columns:
    - stop_name
    - longitude
    - latitude
    - traffic_activity_score
    - passenger_frequency_total
    - passengers_in_total
    - passengers_out_total
    """

    if not TRAFFIC_DATA_PATH.exists():
        print(
            "Warning: DKV traffic dataset was not found at "
            f"{TRAFFIC_DATA_PATH}"
        )
        return tuple()

    traffic_locations: list[dict[str, Any]] = []

    try:
        with TRAFFIC_DATA_PATH.open(
            mode="r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:
            reader = csv.DictReader(csv_file)

            for row in reader:
                latitude = safe_float(
                    row.get("latitude")
                )
                longitude = safe_float(
                    row.get("longitude")
                )
                traffic_score = safe_float(
                    row.get("traffic_activity_score")
                )

                if (
                    latitude is None
                    or longitude is None
                    or traffic_score is None
                ):
                    continue

                traffic_locations.append(
                    {
                        "stopName": (
                            row.get("stop_name")
                            or "Unknown DKV stop"
                        ),
                        "latitude": latitude,
                        "longitude": longitude,
                        "trafficActivityScore": max(
                            0.0,
                            min(100.0, traffic_score),
                        ),
                        "passengerFrequencyTotal": (
                            safe_float(
                                row.get(
                                    "passenger_frequency_total"
                                )
                            )
                            or 0.0
                        ),
                        "passengersInTotal": (
                            safe_float(
                                row.get(
                                    "passengers_in_total"
                                )
                            )
                            or 0.0
                        ),
                        "passengersOutTotal": (
                            safe_float(
                                row.get(
                                    "passengers_out_total"
                                )
                            )
                            or 0.0
                        ),
                    }
                )

    except (OSError, csv.Error) as error:
        print(
            "Warning: Failed to load DKV traffic data:",
            error,
        )
        return tuple()

    return tuple(traffic_locations)


def get_nearby_traffic_stops(
    latitude: float,
    longitude: float,
    *,
    radius_km: float = TRAFFIC_SEARCH_RADIUS_KM,
    limit: int = MAX_NEARBY_TRAFFIC_STOPS,
) -> list[tuple[dict[str, Any], float]]:
    """
    Find DKV stops near a candidate sensor position.
    """

    nearby_stops: list[
        tuple[dict[str, Any], float]
    ] = []

    for stop in load_traffic_locations():
        distance = calculate_distance_km(
            latitude,
            longitude,
            float(stop["latitude"]),
            float(stop["longitude"]),
        )

        if distance <= radius_km:
            nearby_stops.append(
                (stop, distance)
            )

    nearby_stops.sort(
        key=lambda item: item[1]
    )

    return nearby_stops[:limit]


def estimate_traffic_influence(
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    """
    Estimate transport activity around a candidate location.

    Nearby stops are combined through inverse-distance
    weighting. Stops closer to the candidate location
    contribute more strongly.

    The source score is already normalized to 0-100 by
    the DKV preprocessing notebook.
    """

    nearby_stops = get_nearby_traffic_stops(
        latitude,
        longitude,
    )

    if not nearby_stops:
        return {
            "trafficActivityScore": 0,
            "trafficRisk": 0,
            "trafficConfidence": 0,
            "nearestTrafficStop": None,
            "trafficDistanceKm": None,
            "nearbyTrafficStopCount": 0,
            "nearbyPassengerFrequency": 0,
            "nearbyPassengersIn": 0,
            "nearbyPassengersOut": 0,
        }

    weighted_score_total = 0.0
    weight_total = 0.0
    squared_weight_total = 0.0

    passenger_frequency_total = 0.0
    passengers_in_total = 0.0
    passengers_out_total = 0.0

    for stop, distance in nearby_stops:
        safe_distance = max(
            distance,
            MIN_TRAFFIC_DISTANCE_KM,
        )

        # Inverse-distance weighting.
        weight = 1 / (safe_distance**2)

        weighted_score_total += (
            float(stop["trafficActivityScore"])
            * weight
        )
        weight_total += weight
        squared_weight_total += weight**2

        passenger_frequency_total += float(
            stop["passengerFrequencyTotal"]
        )
        passengers_in_total += float(
            stop["passengersInTotal"]
        )
        passengers_out_total += float(
            stop["passengersOutTotal"]
        )

    traffic_activity_score = (
        weighted_score_total / weight_total
        if weight_total > 0
        else 0.0
    )

    effective_stop_count = (
        (weight_total**2)
        / squared_weight_total
        if squared_weight_total > 0
        else 0.0
    )

    nearest_stop, nearest_distance = (
        nearby_stops[0]
    )

    stop_count_score = min(
        len(nearby_stops)
        / MAX_NEARBY_TRAFFIC_STOPS,
        1.0,
    ) * 100

    effective_count_score = min(
        effective_stop_count / 3,
        1.0,
    ) * 100

    distance_score = (
        100
        - min(
            nearest_distance
            / TRAFFIC_SEARCH_RADIUS_KM,
            1.0,
        )
        * 100
    )

    traffic_confidence = (
        stop_count_score * 0.30
        + effective_count_score * 0.30
        + distance_score * 0.40
    )

    return {
        "trafficActivityScore": round(
            traffic_activity_score
        ),
        "trafficRisk": round(
            traffic_activity_score
        ),
        "trafficConfidence": round(
            max(
                0.0,
                min(
                    100.0,
                    traffic_confidence,
                ),
            )
        ),
        "nearestTrafficStop": nearest_stop[
            "stopName"
        ],
        "trafficDistanceKm": round(
            nearest_distance,
            3,
        ),
        "nearbyTrafficStopCount": len(
            nearby_stops
        ),
        "nearbyPassengerFrequency": round(
            passenger_frequency_total
        ),
        "nearbyPassengersIn": round(
            passengers_in_total
        ),
        "nearbyPassengersOut": round(
            passengers_out_total
        ),
    }


# =========================================================
# GREEN SENTINEL STATION PROCESSING
# =========================================================


def get_air_stations(
    stations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    valid_stations: list[dict[str, Any]] = []

    for station in stations:
        if station.get("station_type") != 0:
            continue

        try:
            latitude = float(station["lat"])
            longitude = float(station["lng"])
        except (
            TypeError,
            ValueError,
            KeyError,
        ):
            continue

        valid_stations.append(
            {
                **station,
                "lat": latitude,
                "lng": longitude,
            }
        )

    return valid_stations


def get_nearby_stations(
    latitude: float,
    longitude: float,
    stations: list[dict[str, Any]],
    *,
    limit: int = NEAREST_STATION_COUNT,
) -> list[tuple[dict[str, Any], float]]:
    nearby: list[
        tuple[dict[str, Any], float]
    ] = []

    for station in get_air_stations(stations):
        distance = calculate_distance_km(
            latitude,
            longitude,
            float(station["lat"]),
            float(station["lng"]),
        )

        nearby.append(
            (station, distance)
        )

    nearby.sort(
        key=lambda item: item[1]
    )

    return nearby[:limit]


def find_nearest_station(
    latitude: float,
    longitude: float,
    stations: list[dict[str, Any]],
) -> tuple[
    dict[str, Any] | None,
    float | None,
]:
    nearby = get_nearby_stations(
        latitude,
        longitude,
        stations,
        limit=1,
    )

    if not nearby:
        return None, None

    return nearby[0]


def estimate_weighted_value(
    latitude: float,
    longitude: float,
    stations: list[dict[str, Any]],
    field_name: str,
) -> tuple[
    float | None,
    dict[str, float],
]:
    nearby = get_nearby_stations(
        latitude,
        longitude,
        stations,
    )

    weighted_total = 0.0
    weight_total = 0.0
    squared_weight_total = 0.0

    valid_station_count = 0
    nearest_valid_distance: float | None = None

    for station, distance in nearby:
        raw_value = station.get(field_name)

        if raw_value is None:
            continue

        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            continue

        if distance > MAX_INTERPOLATION_DISTANCE_KM:
            continue

        safe_distance = max(
            distance,
            0.25,
        )

        # Inverse-distance weighting with nearby stations.
        weight = 1 / (safe_distance**2)

        weighted_total += value * weight
        weight_total += weight
        squared_weight_total += weight**2

        valid_station_count += 1

        if nearest_valid_distance is None:
            nearest_valid_distance = distance

    if weight_total == 0:
        return None, {
            "stationCount": 0,
            "nearestDistance": (
                MAX_INTERPOLATION_DISTANCE_KM
            ),
            "effectiveStationCount": 0,
        }

    estimated_value = (
        weighted_total / weight_total
    )

    effective_station_count = (
        (weight_total**2)
        / squared_weight_total
        if squared_weight_total > 0
        else 0
    )

    return estimated_value, {
        "stationCount": float(
            valid_station_count
        ),
        "nearestDistance": float(
            nearest_valid_distance
            if nearest_valid_distance is not None
            else MAX_INTERPOLATION_DISTANCE_KM
        ),
        "effectiveStationCount": float(
            effective_station_count
        ),
    }


def get_field_range(
    stations: list[dict[str, Any]],
    field_name: str,
) -> tuple[float, float] | None:
    values: list[float] = []

    for station in stations:
        raw_value = station.get(field_name)

        if raw_value is None:
            continue

        try:
            values.append(float(raw_value))
        except (TypeError, ValueError):
            continue

    if not values:
        return None

    return min(values), max(values)


def calculate_field_risk(
    estimated_value: float | None,
    stations: list[dict[str, Any]],
    field_name: str,
) -> float:
    if estimated_value is None:
        return 0.0

    value_range = get_field_range(
        stations,
        field_name,
    )

    if value_range is None:
        return 0.0

    minimum, maximum = value_range

    return normalize(
        estimated_value,
        minimum,
        maximum,
    )


def calculate_low_wind_risk(
    estimated_wind_speed: float | None,
    stations: list[dict[str, Any]],
) -> float:
    if estimated_wind_speed is None:
        return 0.0

    wind_range = get_field_range(
        stations,
        "windSpeed",
    )

    if wind_range is None:
        return 0.0

    minimum, maximum = wind_range

    return 100 - normalize(
        estimated_wind_speed,
        minimum,
        maximum,
    )


def calculate_measurement_confidence(
    metadata: dict[str, float],
) -> float:
    station_count = metadata["stationCount"]

    effective_station_count = metadata[
        "effectiveStationCount"
    ]

    nearest_distance = metadata[
        "nearestDistance"
    ]

    station_count_score = min(
        station_count
        / NEAREST_STATION_COUNT,
        1.0,
    ) * 100

    effective_count_score = min(
        effective_station_count / 3,
        1.0,
    ) * 100

    distance_score = (
        100
        - min(
            nearest_distance
            / MAX_INTERPOLATION_DISTANCE_KM,
            1.0,
        )
        * 100
    )

    confidence = (
        station_count_score * 0.35
        + effective_count_score * 0.30
        + distance_score * 0.35
    )

    return max(
        0.0,
        min(100.0, confidence),
    )


def estimate_environmental_risk(
    latitude: float,
    longitude: float,
    stations: list[dict[str, Any]],
) -> dict[str, float]:
    air_stations = get_air_stations(stations)

    estimated_pm25, pm25_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "pm25",
        )
    )

    estimated_pm10, pm10_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "pm10",
        )
    )

    estimated_no2, no2_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "no2",
        )
    )

    estimated_o3, o3_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "o3",
        )
    )

    estimated_wind_speed, wind_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "windSpeed",
        )
    )

    estimated_pm25_std, pm25_std_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "pm25Std",
        )
    )

    estimated_pm10_std, pm10_std_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "pm10Std",
        )
    )

    estimated_no2_std, no2_std_metadata = (
        estimate_weighted_value(
            latitude,
            longitude,
            air_stations,
            "no2Std",
        )
    )

    pm25_risk = calculate_field_risk(
        estimated_pm25,
        air_stations,
        "pm25",
    )

    pm10_risk = calculate_field_risk(
        estimated_pm10,
        air_stations,
        "pm10",
    )

    no2_risk = calculate_field_risk(
        estimated_no2,
        air_stations,
        "no2",
    )

    o3_risk = calculate_field_risk(
        estimated_o3,
        air_stations,
        "o3",
    )

    wind_risk = calculate_low_wind_risk(
        estimated_wind_speed,
        air_stations,
    )

    pm25_variability_risk = (
        calculate_field_risk(
            estimated_pm25_std,
            air_stations,
            "pm25Std",
        )
    )

    pm10_variability_risk = (
        calculate_field_risk(
            estimated_pm10_std,
            air_stations,
            "pm10Std",
        )
    )

    no2_variability_risk = (
        calculate_field_risk(
            estimated_no2_std,
            air_stations,
            "no2Std",
        )
    )

    pollution_risk = (
        pm25_risk * 0.35
        + pm10_risk * 0.25
        + no2_risk * 0.25
        + o3_risk * 0.15
    )

    variability_risk = (
        pm25_variability_risk * 0.50
        + pm10_variability_risk * 0.30
        + no2_variability_risk * 0.20
    )

    pollutant_confidences = [
        calculate_measurement_confidence(
            pm25_metadata
        ),
        calculate_measurement_confidence(
            pm10_metadata
        ),
        calculate_measurement_confidence(
            no2_metadata
        ),
        calculate_measurement_confidence(
            o3_metadata
        ),
    ]

    variability_confidences = [
        calculate_measurement_confidence(
            pm25_std_metadata
        ),
        calculate_measurement_confidence(
            pm10_std_metadata
        ),
        calculate_measurement_confidence(
            no2_std_metadata
        ),
    ]

    pollution_confidence = (
        sum(pollutant_confidences)
        / len(pollutant_confidences)
    )

    variability_confidence = (
        sum(variability_confidences)
        / len(variability_confidences)
    )

    wind_confidence = (
        calculate_measurement_confidence(
            wind_metadata
        )
    )

    return {
        "estimatedPm25": round_optional(
            estimated_pm25
        ),
        "estimatedPm10": round_optional(
            estimated_pm10
        ),
        "estimatedNo2": round_optional(
            estimated_no2
        ),
        "estimatedO3": round_optional(
            estimated_o3
        ),
        "estimatedWindSpeed": round_optional(
            estimated_wind_speed
        ),
        "estimatedPm25Std": round_optional(
            estimated_pm25_std
        ),
        "estimatedPm10Std": round_optional(
            estimated_pm10_std
        ),
        "estimatedNo2Std": round_optional(
            estimated_no2_std
        ),
        "pm25Risk": round(pm25_risk),
        "pm10Risk": round(pm10_risk),
        "no2Risk": round(no2_risk),
        "o3Risk": round(o3_risk),
        "pm25VariabilityRisk": round(
            pm25_variability_risk
        ),
        "pm10VariabilityRisk": round(
            pm10_variability_risk
        ),
        "no2VariabilityRisk": round(
            no2_variability_risk
        ),
        "pollutionRisk": round(
            pollution_risk
        ),
        "variabilityRisk": round(
            variability_risk
        ),
        "windRisk": round(wind_risk),
        "pollutionConfidence": round(
            pollution_confidence
        ),
        "variabilityConfidence": round(
            variability_confidence
        ),
        "windConfidence": round(
            wind_confidence
        ),
    }



# =========================================================
# NOISE AND SUBSURFACE-WATER DATA
# =========================================================


def parse_location_coordinates(
    location: str,
) -> tuple[float, float] | None:
    """
    Extract latitude and longitude from location labels such as:
    "ÉNYGÖ, BMW körút (47.577175, 21.502204)".
    """

    match = LOCATION_COORDINATE_PATTERN.search(location)

    if match is None:
        return None

    try:
        latitude = float(match.group(1))
        longitude = float(match.group(2))
    except (TypeError, ValueError):
        return None

    return latitude, longitude


def standard_deviation(
    values: list[float],
) -> float:
    """
    Population standard deviation without adding another dependency.
    """

    if len(values) < 2:
        return 0.0

    mean_value = sum(values) / len(values)

    variance = sum(
        (value - mean_value) ** 2
        for value in values
    ) / len(values)

    return sqrt(variance)


def normalize_from_values(
    value: float,
    reference_values: list[float],
) -> float:
    if not reference_values:
        return 0.0

    return normalize(
        value,
        min(reference_values),
        max(reference_values),
    )


def estimate_point_value(
    latitude: float,
    longitude: float,
    points: tuple[dict[str, Any], ...],
    field_name: str,
    *,
    limit: int = NEAREST_STATION_COUNT,
    maximum_distance_km: float = MAX_INTERPOLATION_DISTANCE_KM,
) -> tuple[float | None, dict[str, float]]:
    """
    Interpolate one field from georeferenced noise or water stations.
    """

    nearby: list[tuple[dict[str, Any], float]] = []

    for point in points:
        value = safe_float(point.get(field_name))

        if value is None:
            continue

        distance = calculate_distance_km(
            latitude,
            longitude,
            float(point["lat"]),
            float(point["lng"]),
        )

        if distance <= maximum_distance_km:
            nearby.append((point, distance))

    nearby.sort(key=lambda item: item[1])
    nearby = nearby[:limit]

    weighted_total = 0.0
    weight_total = 0.0
    squared_weight_total = 0.0

    for point, distance in nearby:
        value = float(point[field_name])
        safe_distance = max(distance, 0.25)
        weight = 1 / (safe_distance**2)

        weighted_total += value * weight
        weight_total += weight
        squared_weight_total += weight**2

    if weight_total == 0:
        return None, {
            "stationCount": 0.0,
            "nearestDistance": maximum_distance_km,
            "effectiveStationCount": 0.0,
        }

    effective_station_count = (
        (weight_total**2) / squared_weight_total
        if squared_weight_total > 0
        else 0.0
    )

    return weighted_total / weight_total, {
        "stationCount": float(len(nearby)),
        "nearestDistance": float(nearby[0][1]),
        "effectiveStationCount": float(effective_station_count),
    }


def nearest_point_distance(
    latitude: float,
    longitude: float,
    points: tuple[dict[str, Any], ...],
) -> float | None:
    if not points:
        return None

    return min(
        calculate_distance_km(
            latitude,
            longitude,
            float(point["lat"]),
            float(point["lng"]),
        )
        for point in points
    )


@lru_cache(maxsize=1)
def load_noise_stations() -> tuple[dict[str, Any], ...]:
    """
    Load and aggregate the cleaned noise dataset by monitoring location.

    Expected columns:
    timestamp, location, measurement_type, value, unit
    """

    if not NOISE_DATA_PATH.exists():
        print(
            "Warning: Noise dataset was not found at "
            f"{NOISE_DATA_PATH}"
        )
        return tuple()

    grouped: dict[
        str,
        dict[str, list[float]],
    ] = {}

    try:
        with NOISE_DATA_PATH.open(
            mode="r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:
            reader = csv.DictReader(csv_file)

            for row in reader:
                location = (row.get("location") or "").strip()
                measurement_type = (
                    row.get("measurement_type") or ""
                ).strip()
                value = safe_float(row.get("value"))

                if (
                    not location
                    or not measurement_type
                    or value is None
                    or value < 0
                ):
                    continue

                grouped.setdefault(location, {}).setdefault(
                    measurement_type,
                    [],
                ).append(value)

    except (OSError, csv.Error) as error:
        print(
            "Warning: Failed to load noise data:",
            error,
        )
        return tuple()

    station_rows: list[dict[str, Any]] = []

    for location, measurements in grouped.items():
        coordinates = parse_location_coordinates(location)

        if coordinates is None:
            continue

        daytime_values = measurements.get(
            "LAEQ nappali",
            [],
        )
        nighttime_values = measurements.get(
            "LAEQ éjszakai",
            [],
        )

        daytime_mean = (
            sum(daytime_values) / len(daytime_values)
            if daytime_values
            else None
        )
        nighttime_mean = (
            sum(nighttime_values) / len(nighttime_values)
            if nighttime_values
            else None
        )

        # Practical 0-100 exposure scales for the demo.
        daytime_risk = (
            normalize(daytime_mean, 45.0, 70.0)
            if daytime_mean is not None
            else 0.0
        )
        nighttime_risk = (
            normalize(nighttime_mean, 40.0, 60.0)
            if nighttime_mean is not None
            else 0.0
        )

        noise_risk = (
            daytime_risk * 0.55
            + nighttime_risk * 0.45
        )

        latitude, longitude = coordinates

        station_rows.append(
            {
                "name": location,
                "lat": latitude,
                "lng": longitude,
                "daytimeNoise": daytime_mean,
                "nighttimeNoise": nighttime_mean,
                "daytimeNoiseStd": standard_deviation(
                    daytime_values
                ),
                "nighttimeNoiseStd": standard_deviation(
                    nighttime_values
                ),
                "noiseRisk": noise_risk,
                "recordCount": (
                    len(daytime_values)
                    + len(nighttime_values)
                ),
            }
        )

    return tuple(station_rows)


@lru_cache(maxsize=1)
def load_water_stations() -> tuple[dict[str, Any], ...]:
    """
    Load and aggregate the cleaned subsurface-water dataset.

    The resulting score is a monitoring-priority indicator, not a
    declaration that the water is polluted.
    """

    if not WATER_DATA_PATH.exists():
        print(
            "Warning: Water dataset was not found at "
            f"{WATER_DATA_PATH}"
        )
        return tuple()

    grouped: dict[
        str,
        dict[str, list[float]],
    ] = {}

    try:
        with WATER_DATA_PATH.open(
            mode="r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:
            reader = csv.DictReader(csv_file)

            for row in reader:
                location = (row.get("location") or "").strip()
                measurement_type = (
                    row.get("measurement_type") or ""
                ).strip()
                value = safe_float(row.get("value"))

                if (
                    not location
                    or not measurement_type
                    or value is None
                    or value < 0
                ):
                    continue

                grouped.setdefault(location, {}).setdefault(
                    measurement_type,
                    [],
                ).append(value)

    except (OSError, csv.Error) as error:
        print(
            "Warning: Failed to load water data:",
            error,
        )
        return tuple()

    preliminary: list[dict[str, Any]] = []

    for location, measurements in grouped.items():
        coordinates = parse_location_coordinates(location)

        if coordinates is None:
            continue

        conductivity_values = measurements.get(
            "Conductivity",
            [],
        )
        water_level_values = measurements.get(
            "WaterLevel",
            [],
        )
        water_temp_values = measurements.get(
            "WaterTemp",
            [],
        )

        latitude, longitude = coordinates

        preliminary.append(
            {
                "name": location,
                "lat": latitude,
                "lng": longitude,
                "conductivity": (
                    sum(conductivity_values)
                    / len(conductivity_values)
                    if conductivity_values
                    else None
                ),
                "conductivityStd": standard_deviation(
                    conductivity_values
                ),
                "waterLevel": (
                    sum(water_level_values)
                    / len(water_level_values)
                    if water_level_values
                    else None
                ),
                "waterLevelStd": standard_deviation(
                    water_level_values
                ),
                "waterTemperature": (
                    sum(water_temp_values)
                    / len(water_temp_values)
                    if water_temp_values
                    else None
                ),
                "waterTemperatureStd": standard_deviation(
                    water_temp_values
                ),
                "recordCount": sum(
                    len(values)
                    for values in measurements.values()
                ),
            }
        )

    conductivity_means = [
        float(row["conductivity"])
        for row in preliminary
        if row["conductivity"] is not None
    ]
    conductivity_stds = [
        float(row["conductivityStd"])
        for row in preliminary
    ]
    level_stds = [
        float(row["waterLevelStd"])
        for row in preliminary
    ]
    temperature_stds = [
        float(row["waterTemperatureStd"])
        for row in preliminary
    ]

    stations: list[dict[str, Any]] = []

    for row in preliminary:
        conductivity = safe_float(row["conductivity"])

        conductivity_level_score = (
            normalize_from_values(
                conductivity,
                conductivity_means,
            )
            if conductivity is not None
            else 0.0
        )

        conductivity_variability_score = (
            normalize_from_values(
                float(row["conductivityStd"]),
                conductivity_stds,
            )
        )
        level_variability_score = (
            normalize_from_values(
                float(row["waterLevelStd"]),
                level_stds,
            )
        )
        temperature_variability_score = (
            normalize_from_values(
                float(row["waterTemperatureStd"]),
                temperature_stds,
            )
        )

        water_monitoring_priority = (
            conductivity_level_score * 0.40
            + conductivity_variability_score * 0.25
            + level_variability_score * 0.20
            + temperature_variability_score * 0.15
        )

        stations.append(
            {
                **row,
                "waterMonitoringPriority": (
                    water_monitoring_priority
                ),
            }
        )

    return tuple(stations)


def calculate_coverage_scores(
    grid: list[dict[str, float | int]],
    points: tuple[dict[str, Any], ...],
) -> dict[int, float]:
    """
    Normalize distance-to-nearest-station across the city grid.
    A higher score means a larger monitoring gap.
    """

    distances: dict[int, float] = {}

    for point in grid:
        distance = nearest_point_distance(
            float(point["lat"]),
            float(point["lng"]),
            points,
        )

        if distance is not None:
            distances[int(point["id"])] = distance

    if not distances:
        return {}

    maximum_distance = max(distances.values())

    if maximum_distance <= 0:
        return {
            point_id: 0.0
            for point_id in distances
        }

    return {
        point_id: (
            distance / maximum_distance * 100
        )
        for point_id, distance in distances.items()
    }


# =========================================================
# TRAFFIC-AWARE SENSOR RECOMMENDATIONS
# =========================================================


def generate_recommendations(
    stations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Recommend locations for complete Green Sentinel monitoring stations.

    The engine evaluates three independent suitability dimensions:
    air, noise and subsurface-water monitoring. Existing frontend fields
    remain available, while new multi-environmental fields are added.
    """

    grid = generate_city_grid()
    air_stations = get_air_stations(stations)
    noise_stations = load_noise_stations()
    water_stations = load_water_stations()

    candidates: list[dict[str, Any]] = []
    air_distances: dict[int, float] = {}

    for point in grid:
        nearest_station, distance = find_nearest_station(
            float(point["lat"]),
            float(point["lng"]),
            stations,
        )

        if nearest_station is None or distance is None:
            continue

        point_id = int(point["id"])
        air_distances[point_id] = distance

        candidates.append(
            {
                **point,
                "nearestStation": nearest_station.get(
                    "name",
                    "Unknown station",
                ),
                "distanceKm": distance,
            }
        )

    maximum_air_distance = (
        max(air_distances.values())
        if air_distances
        else 0.0
    )

    noise_coverage_scores = calculate_coverage_scores(
        grid,
        noise_stations,
    )
    water_coverage_scores = calculate_coverage_scores(
        grid,
        water_stations,
    )

    recommendations: list[dict[str, Any]] = []

    for candidate in candidates:
        point_id = int(candidate["id"])
        latitude = float(candidate["lat"])
        longitude = float(candidate["lng"])

        environmental_risk = estimate_environmental_risk(
            latitude,
            longitude,
            air_stations,
        )
        traffic_influence = estimate_traffic_influence(
            latitude,
            longitude,
        )

        air_coverage_score = (
            float(candidate["distanceKm"])
            / maximum_air_distance
            * 100
            if maximum_air_distance > 0
            else 0.0
        )

        estimated_noise_risk, noise_metadata = (
            estimate_point_value(
                latitude,
                longitude,
                noise_stations,
                "noiseRisk",
            )
        )
        estimated_daytime_noise, _ = estimate_point_value(
            latitude,
            longitude,
            noise_stations,
            "daytimeNoise",
        )
        estimated_nighttime_noise, _ = estimate_point_value(
            latitude,
            longitude,
            noise_stations,
            "nighttimeNoise",
        )

        estimated_water_priority, water_metadata = (
            estimate_point_value(
                latitude,
                longitude,
                water_stations,
                "waterMonitoringPriority",
            )
        )
        estimated_conductivity, _ = estimate_point_value(
            latitude,
            longitude,
            water_stations,
            "conductivity",
        )
        estimated_water_level, _ = estimate_point_value(
            latitude,
            longitude,
            water_stations,
            "waterLevel",
        )
        estimated_water_temperature, _ = (
            estimate_point_value(
                latitude,
                longitude,
                water_stations,
                "waterTemperature",
            )
        )

        noise_coverage_score = noise_coverage_scores.get(
            point_id,
            0.0,
        )
        water_coverage_score = water_coverage_scores.get(
            point_id,
            0.0,
        )

        noise_risk = estimated_noise_risk or 0.0
        water_monitoring_priority = (
            estimated_water_priority or 0.0
        )

        # Separate, explainable suitability scores.
        air_suitability = (
            air_coverage_score * 0.45
            + environmental_risk["pollutionRisk"] * 0.30
            + environmental_risk["variabilityRisk"] * 0.15
            + environmental_risk["windRisk"] * 0.10
        )

        # DKV activity has a direct connection to noise exposure.
        noise_suitability = (
            noise_coverage_score * 0.50
            + noise_risk * 0.30
            + traffic_influence["trafficRisk"] * 0.20
        )

        water_suitability = (
            water_coverage_score * 0.65
            + water_monitoring_priority * 0.35
        )

        # Overall full-station priority.
        # Noise receives substantial weight because only five locations
        # currently have noise measurements in the provided dataset.
        priority_score = (
            air_suitability * 0.40
            + noise_suitability * 0.40
            + water_suitability * 0.20
        )

        air_confidence = (
            environmental_risk["pollutionConfidence"] * 0.45
            + environmental_risk["variabilityConfidence"] * 0.30
            + environmental_risk["windConfidence"] * 0.25
        )
        noise_confidence = (
            calculate_measurement_confidence(
                noise_metadata
            )
            if noise_stations
            else 0.0
        )
        water_confidence = (
            calculate_measurement_confidence(
                water_metadata
            )
            if water_stations
            else 0.0
        )

        overall_confidence = (
            air_confidence * 0.40
            + noise_confidence * 0.25
            + water_confidence * 0.20
            + traffic_influence["trafficConfidence"] * 0.15
        )

        suitability_scores = {
            "air": air_suitability,
            "noise": noise_suitability,
            "water": water_suitability,
        }
        primary_need = max(
            suitability_scores,
            key=suitability_scores.get,
        )

        recommendations.append(
            {
                **candidate,
                **environmental_risk,
                **traffic_influence,
                "recommendationType": "full_station",
                "recommendedSensor": (
                    "Full Green Sentinel station"
                ),
                "primaryMonitoringNeed": primary_need,
                "distanceKm": round(
                    float(candidate["distanceKm"]),
                    3,
                ),
                # Existing frontend compatibility.
                "coverageScore": round(
                    air_coverage_score
                ),
                "priorityScore": round(
                    max(0.0, min(100.0, priority_score))
                ),
                "coverageConfidence": round(
                    air_coverage_score
                ),
                "overallConfidence": round(
                    max(0.0, min(100.0, overall_confidence))
                ),
                # New multi-environmental scores.
                "airSuitability": round(air_suitability),
                "noiseSuitability": round(
                    noise_suitability
                ),
                "waterSuitability": round(
                    water_suitability
                ),
                "airCoverageScore": round(
                    air_coverage_score
                ),
                "noiseCoverageScore": round(
                    noise_coverage_score
                ),
                "waterCoverageScore": round(
                    water_coverage_score
                ),
                "noiseRisk": round(noise_risk),
                "waterMonitoringPriority": round(
                    water_monitoring_priority
                ),
                "estimatedDaytimeNoise": round_optional(
                    estimated_daytime_noise
                ),
                "estimatedNighttimeNoise": round_optional(
                    estimated_nighttime_noise
                ),
                "estimatedConductivity": round_optional(
                    estimated_conductivity
                ),
                "estimatedWaterLevel": round_optional(
                    estimated_water_level
                ),
                "estimatedWaterTemperature": round_optional(
                    estimated_water_temperature
                ),
                "airConfidence": round(air_confidence),
                "noiseConfidence": round(
                    noise_confidence
                ),
                "waterConfidence": round(
                    water_confidence
                ),
                "noiseStationCount": len(
                    noise_stations
                ),
                "waterStationCount": len(
                    water_stations
                ),
            }
        )

    recommendations.sort(
        key=lambda recommendation: (
            recommendation["priorityScore"],
            recommendation["overallConfidence"],
            recommendation["noiseSuitability"],
            recommendation["airSuitability"],
            recommendation["waterSuitability"],
        ),
        reverse=True,
    )

    return select_separated_recommendations(
        recommendations,
        count=5,
        minimum_distance_km=2,
    )

def select_separated_recommendations(
    recommendations: list[dict[str, Any]],
    *,
    count: int,
    minimum_distance_km: float,
) -> list[dict[str, Any]]:
    selected: list[
        dict[str, Any]
    ] = []

    for candidate in recommendations:
        is_far_enough = all(
            calculate_distance_km(
                float(candidate["lat"]),
                float(candidate["lng"]),
                float(existing["lat"]),
                float(existing["lng"]),
            )
            >= minimum_distance_km
            for existing in selected
        )

        if is_far_enough:
            selected.append(candidate)

        if len(selected) >= count:
            break

    return selected