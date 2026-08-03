from fastapi import APIRouter

from app.services.recommendation_engine import (
    load_traffic_locations,
)

router = APIRouter(
    prefix="/traffic",
    tags=["traffic"],
)


@router.get("")
def get_traffic_locations() -> dict:
    locations = list(load_traffic_locations())

    return {
        "count": len(locations),
        "source": "DKV Debrecen stop statistics",
        "locations": locations,
    }