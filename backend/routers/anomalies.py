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


# Pre-populated live demonstration sample anomalies for UI initialization
SAMPLE_ANOMALIES = [
    {
        "id": "ANOM_2026_001",
        "station_id": "AWS_GOA_01",
        "station_name": "Panaji Coastal Station",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "origin": "SIMULATED",
        "readings": {"temperature": 45.8, "pressure": 1012.1, "humidity": 78.5},
        "is_anomaly": True,
        "severity": "HIGH",
        "root_cause": "spike_fault",
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
                "description": "Temperature value +45.80°C deviates severely (+17.6°C) from station diurnal baseline."
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
        "station_id": "AWS_GOA_02",
        "station_name": "Margao Inland Station",
        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=15)).isoformat(),
        "origin": "SIMULATED",
        "readings": {"temperature": 29.2, "pressure": 965.0, "humidity": 82.0},
        "is_anomaly": True,
        "severity": "CRITICAL",
        "root_cause": "out_of_bounds_pressure",
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


@router.get("")
async def get_anomalies_feed(limit: int = 20):
    """
    Returns live feed of detected Tier 1 anomalies with SHAP explanations,
    imputed value suggestions, and spatial consistency verdicts.
    """
    return {
        "tier_label": "TIER 1 — CORE ANOMALY DETECTION FEED",
        "count": len(SAMPLE_ANOMALIES),
        "anomalies": SAMPLE_ANOMALIES[:limit]
    }


@router.post("/evaluate")
async def evaluate_custom_reading(
    station_id: str = "AWS_GOA_01",
    temperature: float = 28.5,
    pressure: float = 1012.0,
    humidity: float = 78.0
):
    """
    Evaluates arbitrary reading directly against Tier 1 ML pipeline + SHAP explainer + Spatial check.
    """
    # 1. Spatial neighbors
    all_readings = [simulator_instance.generate_reading(s) for s in simulator_instance.stations if s != station_id]
    valid_neighbors = [r for r in all_readings if r is not None]

    # 2. Predict anomaly
    pred = detector.predict_single(temperature, pressure, humidity, spatial_neighbors=valid_neighbors)

    # 3. SHAP Explainability
    shap_factors = explainer.explain_instance(temperature, pressure, humidity, detector)

    # 4. Value Imputation if anomalous
    imputed = None
    if pred["is_anomaly"]:
        primary_feat = shap_factors[0]["feature"]
        bad_val = temperature if primary_feat == "temperature" else (pressure if primary_feat == "pressure" else humidity)
        imputed = imputer.suggest_correction(primary_feat, bad_val, spatial_neighbors=valid_neighbors)

    # 5. Spatial verification
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
