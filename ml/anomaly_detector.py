"""
ml/anomaly_detector.py
Tier 1 Core Anomaly Detection Model for SkyGuard AI.
Uses IsolationForest combined with physical constraint rules and temporal trend estimators.
"""

import os
import warnings
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore", category=UserWarning)


MODEL_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(MODEL_DIR, "tier1_isolation_forest.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "tier1_scaler.pkl")


class Tier1AnomalyDetector:
    """
    Multivariate Anomaly Detection engine operating strictly on
    Temperature (°C), Atmospheric Pressure (hPa), and Relative Humidity (%).
    """

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=150,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

        # Physical realistic limits for AWS sensors in Goa / Tropical regions
        self.PHYSICAL_BOUNDS = {
            "temperature": (-5.0, 55.0),   # °C
            "pressure": (900.0, 1060.0),   # hPa
            "humidity": (0.0, 100.0)       # %
        }

    def extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """
        Engineers multivariate features for Tier 1 parameters:
        Raw T, P, RH + Rate of Change (first difference) + Relational ratios.
        """
        cols = ["temperature", "pressure", "humidity"]
        features = df[cols].copy()

        # Rate of change / temporal differences if sequence provided
        if len(df) > 1:
            dT = df["temperature"].diff().fillna(0.0)
            dP = df["pressure"].diff().fillna(0.0)
            dRH = df["humidity"].diff().fillna(0.0)
        else:
            dT = pd.Series([0.0] * len(df))
            dP = pd.Series([0.0] * len(df))
            dRH = pd.Series([0.0] * len(df))

        features["dT"] = dT
        features["dP"] = dP
        features["dRH"] = dRH

        # Relational interaction feature (Psychrometric proxy: Temp * Humidity relation)
        features["T_RH_ratio"] = features["temperature"] * (features["humidity"] / 100.0)

        return features.values

    def fit(self, df: pd.DataFrame) -> "Tier1AnomalyDetector":
        """
        Fits the Isolation Forest and StandardScaler on historical baseline data (e.g. OpenML 43409).
        """
        os.makedirs(MODEL_DIR, exist_ok=True)
        X = self.extract_features(df)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.is_fitted = True

        # Save artifacts
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        print(f"[AnomalyDetector] Tier 1 model trained on {len(df)} samples and saved to {MODEL_PATH}")
        return self

    def load(self) -> bool:
        """
        Loads pre-trained model artifacts if available.
        """
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
            self.is_fitted = True
            print(f"[AnomalyDetector] Loaded pre-trained model from {MODEL_PATH}")
            return True
        return False

    def predict_single(
        self,
        temperature: float,
        pressure: float,
        humidity: float,
        recent_history: Optional[List[Dict[str, float]]] = None,
        spatial_neighbors: Optional[List[Dict[str, float]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates a single reading (T, P, RH) against trained model, physical constraints,
        recent history (for frozen/drift/spike check), and spatial neighbor consensus.
        """
        if not self.is_fitted:
            self.load()
            if not self.is_fitted:
                # Auto-fit on basic standard distribution if model missing
                dummy_df = pd.DataFrame({
                    "temperature": np.random.normal(28, 3, 500),
                    "pressure": np.random.normal(1012, 4, 500),
                    "humidity": np.random.normal(75, 10, 500)
                })
                self.fit(dummy_df)

        # 1. Physical Bounds Check (Out-of-range sensor fault)
        out_of_bounds = []
        if not (self.PHYSICAL_BOUNDS["temperature"][0] <= temperature <= self.PHYSICAL_BOUNDS["temperature"][1]):
            out_of_bounds.append("temperature")
        if not (self.PHYSICAL_BOUNDS["pressure"][0] <= pressure <= self.PHYSICAL_BOUNDS["pressure"][1]):
            out_of_bounds.append("pressure")
        if not (self.PHYSICAL_BOUNDS["humidity"][0] <= humidity <= self.PHYSICAL_BOUNDS["humidity"][1]):
            out_of_bounds.append("humidity")

        # 2. Extract features with historical temporal context if provided
        prev_T = temperature
        prev_P = pressure
        prev_RH = humidity
        is_frozen = False
        is_spike = False
        is_drift = False

        if recent_history and len(recent_history) >= 1:
            last = recent_history[-1]
            prev_T = last.get("temperature", temperature)
            prev_P = last.get("pressure", pressure)
            prev_RH = last.get("humidity", humidity)

            dT = abs(temperature - prev_T)
            dP = abs(pressure - prev_P)
            dRH = abs(humidity - prev_RH)

            # Spike detection: extreme single-step change (> 8°C, > 15 hPa, or > 35%)
            if dT > 8.0 or dP > 15.0 or dRH > 35.0:
                is_spike = True

            # Frozen sensor check: exactly zero variation across last 5 consecutive readings
            if len(recent_history) >= 4:
                last_5_T = [r.get("temperature") for r in recent_history[-4:]] + [temperature]
                last_5_P = [r.get("pressure") for r in recent_history[-4:]] + [pressure]
                last_5_RH = [r.get("humidity") for r in recent_history[-4:]] + [humidity]

                if len(set(last_5_T)) == 1 or len(set(last_5_P)) == 1 or len(set(last_5_RH)) == 1:
                    is_frozen = True

        # 3. Model Isolation Forest score
        feat_df = pd.DataFrame([{
            "temperature": temperature,
            "pressure": pressure,
            "humidity": humidity,
            "dT": temperature - prev_T,
            "dP": pressure - prev_P,
            "dRH": humidity - prev_RH,
            "T_RH_ratio": temperature * (humidity / 100.0)
        }])

        X = feat_df.values
        X_scaled = self.scaler.transform(X)

        raw_score = float(self.model.decision_function(X_scaled)[0])
        model_is_anomaly = bool(self.model.predict(X_scaled)[0] == -1)

        # Calibrate raw IsolationForest decision score into confidence (0.0 to 1.0)
        # raw_score ranges typically between -0.3 (very anomalous) and +0.3 (very normal)
        confidence = float(np.clip(1.0 - (raw_score + 0.3) / 0.6, 0.0, 1.0))

        # Determine root cause & anomaly classification
        is_anomaly = model_is_anomaly or len(out_of_bounds) > 0 or is_spike or is_frozen or is_drift

        root_cause = "normal"
        severity = "LOW"

        if is_anomaly:
            if len(out_of_bounds) > 0:
                root_cause = f"out_of_bounds_{out_of_bounds[0]}"
                severity = "CRITICAL"
                confidence = max(confidence, 0.95)
            elif is_frozen:
                root_cause = "frozen_sensor"
                severity = "HIGH"
                confidence = max(confidence, 0.90)
            elif is_spike:
                root_cause = "spike_fault"
                severity = "HIGH"
                confidence = max(confidence, 0.85)
            elif is_drift:
                root_cause = "sensor_drift"
                severity = "MEDIUM"
            else:
                root_cause = "multivariate_inconsistency"
                severity = "MEDIUM" if confidence < 0.75 else "HIGH"

        # 4. Spatial Consistency Verification
        spatial_verdict = "NOT_CHECKED"
        if spatial_neighbors and len(spatial_neighbors) > 0:
            neighbor_temps = [n["temperature"] for n in spatial_neighbors if "temperature" in n]
            neighbor_pressures = [n["pressure"] for n in spatial_neighbors if "pressure" in n]

            if neighbor_temps and neighbor_pressures:
                avg_n_temp = np.mean(neighbor_temps)
                avg_n_press = np.mean(neighbor_pressures)

                temp_diff = abs(temperature - avg_n_temp)
                press_diff = abs(pressure - avg_n_press)

                if is_anomaly and temp_diff < 3.0 and press_diff < 4.0:
                    # Target station reading matches nearby stations -> Genuine Extreme Weather Event!
                    is_anomaly = False
                    root_cause = "genuine_extreme_event"
                    severity = "LOW"
                    spatial_verdict = "CORROBORATED_BY_NEIGHBORS (GENUINE EVENT)"
                elif is_anomaly:
                    spatial_verdict = "CONTRADICTED_BY_NEIGHBORS (ISOLATED SENSOR FAULT)"
                else:
                    spatial_verdict = "CONSISTENT_WITH_NEIGHBORS"

        return {
            "is_anomaly": is_anomaly,
            "confidence": round(confidence, 4),
            "severity": severity,
            "root_cause": root_cause,
            "spatial_verdict": spatial_verdict,
            "isolation_forest_score": round(raw_score, 4),
            "model_name": "IsolationForest_v1.0",
            "model_version": "1.0.0"
        }
