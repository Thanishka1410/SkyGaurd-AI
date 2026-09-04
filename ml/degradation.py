"""
ml/degradation.py
Sensor Health Degradation & Preventive Maintenance Forecasting Engine for SkyGuard AI.
Tracks per-station noise, variance drift, freeze frequency, and error rate over sliding windows.
"""

import numpy as np
from typing import Dict, Any, List, Optional


class SensorDegradationTracker:
    """
    Evaluates sensor operational reliability and predicts maintenance needs
    over sliding windows of historical sensor readings.
    """

    def calculate_station_health(
        self,
        station_id: str,
        readings_history: List[Dict[str, Any]],
        anomalies_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Computes overall health score (0% to 100%), per-sensor degradation scores,
        and preventive maintenance recommendations.
        """
        if not readings_history or len(readings_history) == 0:
            return {
                "station_id": station_id,
                "overall_health_score": 100.0,
                "maintenance_recommended": False,
                "urgency": "NONE",
                "sensor_scores": {
                    "temperature": 100.0,
                    "pressure": 100.0,
                    "humidity": 100.0
                },
                "degradation_reasons": []
            }

        total_readings = len(readings_history)
        total_anomalies = len(anomalies_history)

        # Calculate anomaly frequency ratio
        anomaly_ratio = total_anomalies / float(total_readings) if total_readings > 0 else 0.0

        # Count specific anomaly types per parameter
        temp_faults = sum(1 for a in anomalies_history if "temperature" in str(a.get("root_cause", "")).lower() or a.get("contributing_factors", [{}])[0].get("feature") == "temperature")
        press_faults = sum(1 for a in anomalies_history if "pressure" in str(a.get("root_cause", "")).lower() or a.get("contributing_factors", [{}])[0].get("feature") == "pressure")
        humid_faults = sum(1 for a in anomalies_history if "humidity" in str(a.get("root_cause", "")).lower() or a.get("contributing_factors", [{}])[0].get("feature") == "humidity")

        # Per-sensor health penalties
        temp_health = max(0.0, 100.0 - (temp_faults * 8.0) - (anomaly_ratio * 20.0))
        press_health = max(0.0, 100.0 - (press_faults * 8.0) - (anomaly_ratio * 20.0))
        humid_health = max(0.0, 100.0 - (humid_faults * 8.0) - (anomaly_ratio * 20.0))

        # Check for noise variance expansion (drift signal)
        temps = [r.get("temperature") for r in readings_history if r.get("temperature") is not None]
        if len(temps) >= 10:
            std_recent = float(np.std(temps[-5:]))
            std_older = float(np.std(temps[:5]))
            if std_recent > 2.5 * (std_older + 0.1):
                temp_health -= 15.0

        overall_health = float(np.mean([temp_health, press_health, humid_health]))
        overall_health = round(max(0.0, min(100.0, overall_health)), 1)

        maintenance_recommended = overall_health < 70.0
        urgency = "NONE"
        if overall_health < 40.0:
            urgency = "CRITICAL"
        elif overall_health < 70.0:
            urgency = "WARNING"

        reasons = []
        if temp_health < 70.0:
            reasons.append(f"Temperature sensor exhibits high anomaly rate ({temp_faults} fault events recorded).")
        if press_health < 70.0:
            reasons.append(f"Barometric pressure sensor shows drift/instability ({press_faults} fault events recorded).")
        if humid_health < 70.0:
            reasons.append(f"Relative humidity sensor exhibits saturation/dropout ({humid_faults} fault events recorded).")

        return {
            "station_id": station_id,
            "overall_health_score": overall_health,
            "maintenance_recommended": maintenance_recommended,
            "urgency": urgency,
            "sensor_scores": {
                "temperature": round(temp_health, 1),
                "pressure": round(press_health, 1),
                "humidity": round(humid_health, 1)
            },
            "degradation_reasons": reasons
        }


if __name__ == "__main__":
    tracker = SensorDegradationTracker()
    res = tracker.calculate_station_health("AWS_GOA_01", [{"temperature": 28.0}] * 20, [{"root_cause": "spike_fault"}] * 5)
    print("Health Tracker Output:", res)
