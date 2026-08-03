from typing import Any

import pandas as pd


VALID_RANGES: dict[str, tuple[float, float]] = {
    "PM2.5": (0, 1000),
    "PM10": (0, 1500),
    "CO": (0, 100000),
    "CO2": (0, 10000),
    "NO2": (0, 1000),
    "O3": (0, 1000),
    "Humidity": (0, 100),
    "Pressure": (800, 1200),
    "Wind Speed": (0, 100),
    "Wind Direction": (0, 360),
}


def clean_official_air_dataset(
    raw_data: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    data = raw_data.copy()

    original_rows = len(data)

    data = data.rename(
        columns={
            "Location": "location",
            "Mérőeszköz": "measurement_type",
            "érték": "value",
            "mértékegység": "unit",
        }
    )

    data["timestamp"] = pd.to_datetime(
        data["timestamp"],
        format="%Y-%m-%d-%H-%M",
        errors="coerce",
    )

    data["value"] = pd.to_numeric(
        data["value"],
        errors="coerce",
    )

    missing_timestamp_before = int(
        data["timestamp"].isna().sum()
    )

    missing_value_before = int(
        data["value"].isna().sum()
    )

    duplicate_mask = data.duplicated(
        subset=[
            "timestamp",
            "location",
            "measurement_type",
            "value",
        ],
        keep="first",
    )

    duplicate_count = int(duplicate_mask.sum())

    data = data.loc[~duplicate_mask].copy()

    data["value_status"] = "observed"

    invalid_value_count = 0

    for measurement_type, (minimum, maximum) in VALID_RANGES.items():
        mask = (
            data["measurement_type"].eq(measurement_type)
            & data["value"].notna()
            & (
                (data["value"] < minimum)
                | (data["value"] > maximum)
            )
        )

        invalid_value_count += int(mask.sum())

        data.loc[mask, "value"] = pd.NA
        data.loc[mask, "value_status"] = "invalid"

    missing_after_validation = data["value"].isna()

    data.loc[
        missing_after_validation
        & data["value_status"].eq("observed"),
        "value_status",
    ] = "missing"

    data["value"] = data["value"].round(2)

    usable_data = data[
        data["timestamp"].notna()
        & data["location"].notna()
        & data["measurement_type"].notna()
    ].copy()

    report = {
        "originalRows": original_rows,
        "duplicateRowsRemoved": duplicate_count,
        "missingTimestamps": missing_timestamp_before,
        "missingValuesBeforeCleaning": missing_value_before,
        "invalidValuesConvertedToMissing": invalid_value_count,
        "missingValuesAfterCleaning": int(
            usable_data["value"].isna().sum()
        ),
        "finalRows": len(usable_data),
        "stationCount": int(
            usable_data["location"].nunique()
        ),
        "measurementTypeCount": int(
            usable_data["measurement_type"].nunique()
        ),
    }

    return usable_data, report