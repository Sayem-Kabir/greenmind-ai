from app.services.dataset_loader import load_air_dataset
from app.services.official_dataset_cleaner import (
    clean_official_air_dataset,
)

raw_data = load_air_dataset()

cleaned_data, report = clean_official_air_dataset(
    raw_data,
)

print("Cleaning report:")
for key, value in report.items():
    print(f"{key}: {value}")

print()

print(cleaned_data.head())

print()

print(cleaned_data["measurement_type"].value_counts())