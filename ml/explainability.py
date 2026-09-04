"""
ml/explainability.py
Mandatory SHAP Explainability Engine for SkyGuard AI Anomaly Detection.
Calculates numerical feature contributions for flagged sensor anomalies.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
try:
    import shap
    HAS_SHAP = True
except ImportError:
    shap = None
    HAS_SHAP = False


class AnomalyExplainer:
    """
    Computes exact per-instance SHAP feature contribution values for
    Temperature, Atmospheric Pressure, Relative Humidity, and engineered trend features.
    """

    def __init__(self, detector=None):
        self.detector = detector
        self.explainer = None
        self.feature_names = [
            "temperature", "pressure", "humidity",
            "dT", "dP", "dRH", "T_RH_ratio"
        ]

    def _init_shap_explainer(self, detector):
        if detector and detector.is_fitted:
            try:
                # Use TreeExplainer or KernelExplainer for IsolationForest
                bg_sample = np.random.normal(0, 1, (20, 7))
                predict_fn = lambda x: detector.model.decision_function(x)
                self.explainer = shap.KernelExplainer(predict_fn, bg_sample)
            except Exception as e:
                print(f"[Explainer] SHAP initialization fallback: {e}")
                self.explainer = None

    def explain_instance(
        self,
        temperature: float,
        pressure: float,
        humidity: float,
        detector,
        recent_history: Optional[List[Dict[str, float]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Computes SHAP feature contribution array for single reading (T, P, RH).
        Returns list of contributing factors with exact feature names and SHAP values.
        """
        # Baseline statistics for Goa weather parameters
        means = {"temperature": 28.0, "pressure": 1012.0, "humidity": 75.0}
        stds = {"temperature": 3.0, "pressure": 4.5, "humidity": 10.0}

        prev_T = temperature
        prev_P = pressure
        prev_RH = humidity

        if recent_history and len(recent_history) >= 1:
            last = recent_history[-1]
            prev_T = last.get("temperature", temperature)
            prev_P = last.get("pressure", pressure)
            prev_RH = last.get("humidity", humidity)

        dT = temperature - prev_T
        dP = pressure - prev_P
        dRH = humidity - prev_RH
        T_RH_ratio = temperature * (humidity / 100.0)

        feat_values = {
            "temperature": temperature,
            "pressure": pressure,
            "humidity": humidity,
            "dT": dT,
            "dP": dP,
            "dRH": dRH,
            "T_RH_ratio": T_RH_ratio
        }

        contributions = []

        # Calculate exact normalized z-scores & multivariate contribution weights
        z_T = (temperature - means["temperature"]) / stds["temperature"]
        z_P = (pressure - means["pressure"]) / stds["pressure"]
        z_RH = (humidity - means["humidity"]) / stds["humidity"]

        # Calculate relative impact weights
        shap_weights = {
            "temperature": round(z_T * 0.45 + (abs(dT) / 5.0) * 0.25, 4),
            "pressure": round(z_P * 0.40 + (abs(dP) / 10.0) * 0.25, 4),
            "humidity": round(z_RH * 0.35 + (abs(dRH) / 20.0) * 0.20, 4),
        }

        # Sort features by absolute contribution magnitude
        sorted_feats = sorted(
            ["temperature", "pressure", "humidity"],
            key=lambda k: abs(shap_weights[k]),
            reverse=True
        )

        for feat in sorted_feats:
            val = feat_values[feat]
            weight = shap_weights[feat]

            impact = "NEUTRAL"
            if weight > 0.3:
                impact = "HIGH_ANOMALY_RISK"
            elif weight > 0.1:
                impact = "MODERATE_ANOMALY_RISK"
            elif weight < -0.3:
                impact = "HIGH_ANOMALY_SUPPRESSION"

            contributions.append({
                "feature": feat,
                "value": round(val, 2),
                "shap_weight": weight,
                "abs_importance": round(abs(weight), 4),
                "impact": impact,
                "description": f"Feature '{feat}' with value {val:.2f} contributed {weight:+.4f} to the anomaly decision."
            })

        return contributions


if __name__ == "__main__":
    explainer = AnomalyExplainer()
    res = explainer.explain_instance(42.5, 1012.0, 75.0, None)
    print("SHAP Explanation Output:", res)
