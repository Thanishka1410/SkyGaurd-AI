"""
backend/routers/anomalies.py
Tier 1 Anomaly Feed router for SkyGuard AI.
Returns detected anomalies, SHAP feature breakdowns, imputed values, and spatial consensus.
"""

from fastapi import APIRouter
from typing import List, Dict, Any, Optional
import datetime
from ml.anomaly_detector import Tier1AnomalyDetector
from ml.explainability import AnomalyExplainer
from ml.imputer import ValueImputer
from backend.services.spatial_check import spatial_engine
from simulator.aws_simulator import simulator_instance

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection (Tier 1 Core)"])

detector = Tier1AnomalyDetector()
explainer = AnomalyExplainer()
imputer = ValueImputer()


# Pre-populated live demonstration sample anomalies
SAMPLE_ANOMALIES = [
    {
        "id": "ANOM_2026_001",
        "station_id": "AWS-01",
        "station_name": "Panaji Coastal Station",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "origin": "SIMULATED",
        "readings": {"temperature": 45.8, "pressure": 1012.1, "humidity": 78.5},
        "is_anomaly": True,
        "severity": "HIGH",
        "root_cause": "temperature_spike",
        "confidence": 0.9250,
        "isolation_forest_score": -0.2450,
        "spatial_verdict": "CONTRADICTED_BY_NEIGHBORS (ISOLATED SENSOR FAULT)",
        "contributing_factors": [
            {
                "feature": "temperature",
                "value": 45.8,
                "shap_weight": 0.7850,
                "abs_importance": 0.7850,
                "impact": "HIGH_ANOMALY_RISK",
                "description": "Temperature value +45.80°C deviates severely from station diurnal baseline."
            },
            {
                "feature": "humidity",
                "value": 78.5,
                "shap_weight": 0.1200,
                "abs_importance": 0.1200,
                "impact": "NEUTRAL",
                "description": "Humidity reading within standard baseline."
            },
            {
                "feature": "pressure",
                "value": 1012.1,
                "shap_weight": 0.0450,
                "abs_importance": 0.0450,
                "impact": "NEUTRAL",
                "description": "Barometric pressure aligns with regional sea-level mean."
            }
        ],
        "imputed_value_suggestion": {
            "target_feature": "temperature",
            "original_value": 45.8,
            "corrected_value": 28.2,
            "difference": -17.6,
            "confidence": 0.9150,
            "method": "HYBRID_SPATIO_TEMPORAL_EMA"
        }
    },
    {
        "id": "ANOM_2026_002",
        "station_id": "AWS-02",
        "station_name": "Margao Inland Station",
        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=15)).isoformat(),
        "origin": "SIMULATED",
        "readings": {"temperature": 29.2, "pressure": 965.0, "humidity": 82.0},
        "is_anomaly": True,
        "severity": "CRITICAL",
        "root_cause": "pressure_drop",
        "confidence": 0.9850,
        "isolation_forest_score": -0.3850,
        "spatial_verdict": "CONTRADICTED_BY_NEIGHBORS (ISOLATED SENSOR FAULT)",
        "contributing_factors": [
            {
                "feature": "pressure",
                "value": 965.0,
                "shap_weight": 0.8920,
                "abs_importance": 0.8920,
                "impact": "HIGH_ANOMALY_RISK",
                "description": "Pressure 965.0 hPa is below valid physical sensor bounds (900-1060 hPa)."
            },
            {
                "feature": "temperature",
                "value": 29.2,
                "shap_weight": 0.0820,
                "abs_importance": 0.0820,
                "impact": "NEUTRAL",
                "description": "Temperature within standard bounds."
            }
        ],
        "imputed_value_suggestion": {
            "target_feature": "pressure",
            "original_value": 965.0,
            "corrected_value": 1011.2,
            "difference": 46.2,
            "confidence": 0.9400,
            "method": "HYBRID_SPATIO_TEMPORAL_EMA"
        }
    }
]

CANONICAL_STATION_NAMES = {
    "AWS-01": "Panaji Coastal Station",
    "AWS-IND-GA-01": "Panaji Coastal Station",
    "AWS-02": "Margao Inland Station",
    "AWS-IND-GA-02": "Margao Inland Station",
    "AWS-03": "Vasco Port Station",
    "AWS-IND-GA-03": "Vasco Port Station",
    "AWS-04": "Mapusa North Station",
    "AWS-IND-GA-04": "Mapusa North Station",
    "AWS-IND-MUM": "Mumbai Coastal AWS",
    "AWS-IND-BLR": "Bengaluru Plateau AWS",
    "AWS-IND-MAA": "Chennai Coastal AWS",
    "AWS-IND-CCU": "Kolkata Delta AWS",
    "AWS-IND-HYD": "Hyderabad Deccan AWS",
    "AWS-IND-AMD": "Ahmedabad Western AWS",
    "AWS-IND-JAI": "Jaipur Desert Fringe AWS",
    "AWS-IND-LKO": "Lucknow Gangetic AWS",
    "AWS-IND-BHO": "Bhopal Central AWS",
}

# Rolling memory feed of live anomalies
LIVE_ANOMALIES_FEED: List[Dict[str, Any]] = list(SAMPLE_ANOMALIES)


def record_live_anomaly(reading: Dict[str, Any], pred: Dict[str, Any], factors: List[Dict[str, Any]], imputed: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Appends or updates in-place a live detected anomaly into the rolling memory feed (max 50 entries).
    Deduplicates by station_id and root_cause.
    """
    st_id = reading["station_id"]
    if st_id == "AWS-IND-DEL" or st_id == "DELHI":
        st_id = "AWS-01"
    st_name = CANONICAL_STATION_NAMES.get(st_id) or reading.get("station_name") or CANONICAL_STATION_NAMES["AWS-01"]
    root_cause = reading.get("injected_fault_type") or pred.get("root_cause") or "sensor_anomaly"
    if root_cause == "NONE":
        root_cause = pred.get("root_cause") or "sensor_anomaly"

    # Search for an existing anomaly for this station with same root cause
    for entry in LIVE_ANOMALIES_FEED:
        if entry["station_id"] == st_id and (entry.get("root_cause") == root_cause or entry.get("rootCause") == root_cause):
            # Update in-place
            entry["timestamp"] = reading["timestamp"]
            entry["readings"] = {
                "temperature": reading["temperature"],
                "pressure": reading["pressure"],
                "humidity": reading["humidity"]
            }
            entry["confidence"] = pred["confidence"]
            entry["isolation_forest_score"] = pred["isolation_forest_score"]
            entry["spatial_verdict"] = pred["spatial_verdict"]
            if factors:
                entry["contributing_factors"] = factors
            if imputed:
                entry["imputed_value_suggestion"] = imputed
            return entry

    anom_entry = {
        "id": f"ANOM_{st_id}_{root_cause}",
        "station_id": st_id,
        "stationId": st_id,
        "station_name": st_name,
        "stationName": st_name,
        "timestamp": reading["timestamp"],
        "origin": reading.get("origin", "SIMULATED"),
        "readings": {
            "temperature": reading["temperature"],
            "pressure": reading["pressure"],
            "humidity": reading["humidity"]
        },
        "is_anomaly": True,
        "isAnomaly": True,
        "severity": pred["severity"],
        "root_cause": root_cause,
        "rootCause": root_cause,
        "confidence": pred["confidence"],
        "isolation_forest_score": pred["isolation_forest_score"],
        "spatial_verdict": pred["spatial_verdict"],
        "contributing_factors": factors,
        "imputed_value_suggestion": imputed
    }
    LIVE_ANOMALIES_FEED.insert(0, anom_entry)
    if len(LIVE_ANOMALIES_FEED) > 50:
        LIVE_ANOMALIES_FEED.pop()
    return anom_entry


def clear_live_anomalies():
    """
    Clears all active anomalies in the rolling memory feed.
    """
    LIVE_ANOMALIES_FEED.clear()



@router.get("")
async def get_anomalies_feed(limit: int = 20):
    """
    Returns live feed of detected Tier 1 anomalies with SHAP explanations,
    imputed value suggestions, and spatial consistency verdicts.
    """
    return {
        "tier_label": "TIER 1 — CORE ANOMALY DETECTION FEED",
        "count": len(LIVE_ANOMALIES_FEED),
        "anomalies": LIVE_ANOMALIES_FEED[:limit]
    }


@router.post("/evaluate")
async def evaluate_custom_reading(
    station_id: str = "AWS-01",
    temperature: float = 28.5,
    pressure: float = 1012.0,
    humidity: float = 78.0
):
    """
    Evaluates arbitrary reading directly against Tier 1 ML pipeline + SHAP explainer + Spatial check.
    """
    all_readings = [simulator_instance.generate_reading(s) for s in simulator_instance.stations if s != station_id]
    valid_neighbors = [r for r in all_readings if r is not None]

    pred = detector.predict_single(temperature, pressure, humidity, spatial_neighbors=valid_neighbors)
    shap_factors = explainer.explain_instance(temperature, pressure, humidity, detector)

    imputed = None
    if pred["is_anomaly"]:
        primary_feat = shap_factors[0]["feature"]
        bad_val = temperature if primary_feat == "temperature" else (pressure if primary_feat == "pressure" else humidity)
        imputed = imputer.suggest_correction(primary_feat, bad_val, spatial_neighbors=valid_neighbors)

    st_info = simulator_instance.stations.get(station_id, {"coordinates": {"lat": 15.4989, "lon": 73.8278}})
    spatial_res = spatial_engine.evaluate_spatial_consensus(
        st_info,
        {"temperature": temperature, "pressure": pressure, "humidity": humidity},
        valid_neighbors
    )

    return {
        "station_id": station_id,
        "input_readings": {"temperature": temperature, "pressure": pressure, "humidity": humidity},
        "detection_result": pred,
        "contributing_factors": shap_factors,
        "imputed_value_suggestion": imputed,
        "spatial_consensus": spatial_res
    }
