"""
Property valuation anomaly detection using Isolation Forest.

Model: scikit-learn Isolation Forest (contamination=0.05)
Features per parcel:
  - assessed_value_rands (GV Roll 2022)
  - area_sqm
  - zone_type (IZS code — encoded)
  - suburb_median_value (computed from neighbours)
  - distance_to_cbd_m
  - flood_risk_score (from flood risk layer)

Training: Fit on full GV Roll dataset (~500k parcels)
Output: anomaly_score (-1 = outlier, 1 = normal)
Serve: inline FastAPI (model loaded at startup, <50ms inference)
Storage: model ONNX → R2, parcel scores → valuation_data table
"""

import logging
from enum import Enum
from typing import Any

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

# Feature names for the model
FEATURE_NAMES = [
    "assessed_value_rands",
    "area_sqm",
    "zone_type_encoded",
    "suburb_median_value",
    "distance_to_cbd_m",
    "flood_risk_score",
]

# Zone type encoding (IZS codes → numeric)
ZONE_TYPE_ENCODING = {
    "SR-1": 1,   # Single Residential 1
    "SR-2": 2,   # Single Residential 2
    "GR-1": 3,   # General Residential 1
    "GR-2": 4,   # General Residential 2
    "GR-3": 5,   # General Residential 3
    "GR-4": 6,   # General Residential 4
    "GB-1": 7,   # General Business 1
    "GB-2": 8,   # General Business 2
    "GB-3": 9,   # General Business 3
    "GI-1": 10,  # General Industrial 1
    "GI-2": 11,  # General Industrial 2
    "OS-1": 12,  # Open Space 1
    "OS-2": 13,  # Open Space 2
    "OS-3": 14,  # Open Space 3
    "TR-1": 15,  # Transport 1
    "TR-2": 16,  # Transport 2
    "AG": 17,    # Agricultural
    "RU": 18,    # Rural
    "CU": 19,    # Community Use
    "MU": 20,    # Mixed Use
}

# CBD coordinates (Cape Town City Hall)
CBD_LAT = -33.9249
CBD_LNG = 18.4241

# Isolation Forest parameters
CONTAMINATION = 0.05  # Expected 5% anomalies
N_ESTIMATORS = 100
RANDOM_STATE = 42


class AnomalyVerdict(str, Enum):
    """Anomaly classification verdicts."""
    NORMAL = "normal"
    SUSPICIOUS = "suspicious"
    ANOMALOUS = "anomalous"


def encode_zone_type(zone_code: str) -> int:
    """Encode IZS zone type string to numeric value."""
    return ZONE_TYPE_ENCODING.get(zone_code.upper().strip(), 0)


def compute_distance_to_cbd(lat: float, lng: float) -> float:
    """
    Compute approximate distance to Cape Town CBD in metres.
    Uses Haversine formula.

    Args:
        lat: latitude of parcel centroid
        lng: longitude of parcel centroid

    Returns:
        Distance in metres
    """
    import math

    R = 6_371_000  # Earth radius in metres
    phi1 = math.radians(CBD_LAT)
    phi2 = math.radians(lat)
    dphi = math.radians(lat - CBD_LAT)
    dlambda = math.radians(lng - CBD_LNG)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def prepare_features(parcel: dict) -> np.ndarray:
    """
    Extract and prepare feature vector from a parcel record.

    Args:
        parcel: dict with parcel attributes

    Returns:
        1D numpy array of feature values
    """
    return np.array([
        float(parcel.get("assessed_value_rands", 0)),
        float(parcel.get("area_sqm", 0)),
        float(encode_zone_type(parcel.get("zone_type", ""))),
        float(parcel.get("suburb_median_value", 0)),
        float(parcel.get("distance_to_cbd_m", 0)),
        float(parcel.get("flood_risk_score", 0)),
    ])


def classify_anomaly_score(score: float) -> str:
    """
    Classify an Isolation Forest decision score into verdict.

    Args:
        score: decision_function output (negative = more anomalous)

    Returns:
        AnomalyVerdict string
    """
    if score < -0.5:
        return AnomalyVerdict.ANOMALOUS.value
    elif score < -0.1:
        return AnomalyVerdict.SUSPICIOUS.value
    return AnomalyVerdict.NORMAL.value


def validate_features(features: np.ndarray) -> tuple[bool, str]:
    """
    Validate feature vector before inference.

    Args:
        features: 1D numpy array of feature values

    Returns:
        Tuple of (is_valid, error_message)
    """
    if features.shape[0] != len(FEATURE_NAMES):
        return False, f"Expected {len(FEATURE_NAMES)} features, got {features.shape[0]}"

    if np.any(np.isnan(features)):
        return False, "Features contain NaN values"

    if np.any(np.isinf(features)):
        return False, "Features contain infinite values"

    # Assessed value sanity check (R0 to R10 billion)
    if features[0] < 0 or features[0] > 10_000_000_000:
        return False, f"Assessed value out of range: {features[0]}"

    # Area sanity check (1 sqm to 10 million sqm)
    if features[1] < 0 or features[1] > 10_000_000:
        return False, f"Area out of range: {features[1]}"

    return True, ""


async def train_isolation_forest(tenant_id: str) -> dict[str, Any]:
    """
    Train Isolation Forest on full GV Roll dataset for a tenant.

    Args:
        tenant_id: tenant UUID

    Returns:
        dict with model metadata and training stats
    """
    logger.info("Training Isolation Forest for tenant=%s", tenant_id)

    # In production:
    # 1. Query all parcels from valuation_data table (tenant-scoped)
    # 2. Prepare feature matrix
    # 3. Fit IsolationForest(contamination=0.05, n_estimators=100, random_state=42)
    # 4. Export model as ONNX → R2
    # 5. Score all parcels → write anomaly_score to valuation_data
    # 6. Update analysis_jobs row

    return {
        "status": "complete",
        "model_path": f"r2://capegis-rasters/models/anomaly/{tenant_id}/model.onnx",
        "training_stats": {
            "n_samples": 0,
            "n_features": len(FEATURE_NAMES),
            "contamination": CONTAMINATION,
            "n_estimators": N_ESTIMATORS,
            "n_anomalies_detected": 0,
        },
    }


async def predict_single(
    parcel: dict,
    tenant_id: str,
) -> dict[str, Any]:
    """
    Run anomaly prediction on a single parcel (inline, <50ms).

    Args:
        parcel: dict with parcel attributes
        tenant_id: tenant UUID

    Returns:
        dict with anomaly score and verdict
    """
    features = prepare_features(parcel)
    is_valid, error = validate_features(features)

    if not is_valid:
        return {
            "parcel_id": parcel.get("id", "unknown"),
            "status": "error",
            "error": error,
        }

    # In production: load ONNX model from cache, run inference
    # For now, return placeholder
    return {
        "parcel_id": parcel.get("id", "unknown"),
        "features": {name: float(features[i]) for i, name in enumerate(FEATURE_NAMES)},
        "anomaly_score": 0.0,
        "verdict": AnomalyVerdict.NORMAL.value,
        "status": "complete",
    }


async def predict_batch(
    parcels: list[dict],
    tenant_id: str,
) -> list[dict[str, Any]]:
    """
    Run anomaly prediction on a batch of parcels.

    Args:
        parcels: list of parcel dicts
        tenant_id: tenant UUID

    Returns:
        list of prediction result dicts
    """
    results = []
    for parcel in parcels:
        result = await predict_single(parcel, tenant_id)
        results.append(result)
    return results
