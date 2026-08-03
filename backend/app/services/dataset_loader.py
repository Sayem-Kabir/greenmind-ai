from pathlib import Path

import pandas as pd

DATASET_ROOT = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "raw"
    / "monitoring_2026-05-21_2026-06-19"
)


def load_air_dataset() -> pd.DataFrame:
    """
    Loads every *_Levego.xlsx file from the official
    Green Sentinel competition dataset.
    """

    excel_files = sorted(DATASET_ROOT.glob("DEB-KER*/**/*Levego*.xlsx"))

    if not excel_files:
        raise FileNotFoundError(
            "No *_Levego.xlsx files found."
        )

    dataframes = []

    for file in excel_files:
        df = pd.read_excel(file)

        df["source_file"] = file.stem

        dataframes.append(df)

    return pd.concat(
        dataframes,
        ignore_index=True,
    )