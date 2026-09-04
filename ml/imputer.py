"""
ml/imputer.py
Suggests physics-constrained corrected / imputed values for flagged anomalous readings
in SkyGuard AI using temporal trend regression and spatial neighbor averaging.
"""

import numpy as np
from typing import Dict, Any, List, Optional


class ValueImputer:
    """
    Imputes corrected values for anomalous readings in Temperature (°C),
    Pressure (hPa), and Relative Humidity (%).
    """

    def __init__(self):
        # Baseline reference stats for Goa region
        self.defaults = {
            "temperature": 28.2,
            "pressure": 1012.4,
            "humidity": 76.5
        }

    def suggest_correction(
        self,
        target_feature: str,
        anomalous_value: float,
        recent_history: Optional[List[Dict[str, float]]] = None,
        spatial_neighbors: Optional[List[Dict[str, float]]] = None
    ) -> Dict[str, Any]:
        """
        Calculates suggested imputed value with confidence level.
        Combines Exponential Moving Average (EMA) from station history
        with Spatial Neighbor Weighted Mean.
        """
        weights = []
        estimates = []

        # 1. Spatial Neighbor Estimate
        if spatial_neighbors and len(spatial_neighbors) > 0:
            neighbor_vals = [
                n[target_feature] for n in spatial_neighbors
                if target_feature in n and n[target_feature] is not None
            ]
            if len(neighbor_vals) > 0:
                spatial_est = float(np.mean(neighbor_vals))
                estimates.append(spatial_est)
                weights.append(0.6)  # High weight for spatial neighbors

        # 2. Temporal History EMA Estimate
        if recent_history and len(recent_history) > 0:
            valid_hist = [
                r[target_feature] for r in recent_history
                if target_feature in r and r[target_feature] is not None
            ]
            if len(valid_hist) > 0:
                # 3-period Exponential Moving Average
                alpha = 0.5
                ema = valid_hist[0]
                for v in valid_hist[1:]:
                    ema = alpha * v + (1 - alpha) * ema
                estimates.append(float(ema))
                weights.append(0.4)

        if len(estimates) == 0:
            suggested = self.defaults.get(target_feature, anomalous_value)
            imputation_confidence = 0.50
            method = "CLIMATOLOGICAL_DEFAULT"
        else:
            w_norm = np.array(weights) / sum(weights)
            suggested = float(np.dot(estimates, w_norm))
            imputation_confidence = min(0.92, 0.70 + 0.10 * len(estimates))
            method = "HYBRID_SPATIO_TEMPORAL_EMA"

        # Ensure imputed values respect physical bounds
        if target_feature == "temperature":
            suggested = float(np.clip(suggested, 15.0, 45.0))
        elif target_feature == "pressure":
            suggested = float(np.clip(suggested, 980.0, 1040.0))
        elif target_feature == "humidity":
            suggested = float(np.clip(suggested, 20.0, 100.0))

        return {
            "target_feature": target_feature,
            "original_value": round(anomalous_value, 2),
            "corrected_value": round(suggested, 2),
            "difference": round(suggested - anomalous_value, 2),
            "confidence": round(imputation_confidence, 4),
            "method": method
        }


if __name__ == "__main__":
    imputer = ValueImputer()
    res = imputer.suggest_correction("temperature", 48.5, recent_history=[{"temperature": 27.5}, {"temperature": 28.0}], spatial_neighbors=[{"temperature": 28.2}, {"temperature": 28.4}])
    print("Imputed Correction Output:", res)
