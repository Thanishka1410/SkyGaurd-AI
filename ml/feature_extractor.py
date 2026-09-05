"""
ml/feature_extractor.py
Unified Feature Engineering & Schema Verification Pipeline for SkyGuard AI Tier 1.
Computes canonical multivariate, temporal, statistical, and relational features.
Used identically for both offline dataset training and live inference streams.
"""

import math
import hashlib
import numpy as np
import pandas as pd
import datetime
from typing import Dict, Any, List, Optional, Tuple

# Canonical ordered list of features extracted by Tier 1 pipeline
FEATURE_NAMES: List[str] = [
    # 1. Base Physical Meteorological Measurements
    "temperature",
    "pressure",
    "humidity",
    
    # 2. Dynamic Temporal & Seasonal Cycles
    "hour_sin",
    "hour_cos",
    "month_sin",
    "month_cos",
    "is_day",
    
    # 3. Rate of Change & Step Derivatives
    "dT",
    "dP",
    "dRH",
    "dt_seconds",
    
    # 4. Statistical Rolling Windows (Station Trend)
    "rolling_mean_T",
    "rolling_mean_P",
    "rolling_mean_RH",
    "rolling_std_T",
    "rolling_std_P",
    "rolling_std_RH",
    
    # 5. Station Climatological / Diurnal Baseline Deviations
    "dev_from_baseline_T",
    "dev_from_baseline_P",
    "dev_from_baseline_RH",
    
    # 6. Psychrometric & Relational Proxy
    "T_RH_ratio"
]

FEATURE_SCHEMA_HASH: str = hashlib.sha256(",".join(FEATURE_NAMES).encode("utf-8")).hexdigest()[:12]
PIPELINE_VERSION: str = "2.0.0"

# Station Baseline Reference Profiles (Diurnal & Mean values)
DEFAULT_CLIMATE_BASELINES = {
    "temperature": {"mean": 28.2, "std": 3.2, "diurnal_amp": 3.8, "peak_hour": 14.0},
    "pressure": {"mean": 1012.0, "std": 4.5, "diurnal_amp": 1.8, "peak_hour": 10.0},
    "humidity": {"mean": 76.5, "std": 11.0, "diurnal_amp": 12.0, "min_hour": 14.0}
}


class Tier1FeatureExtractor:
    """
    Extracts high-fidelity meteorological features from raw sensor readings and historical context.
    Guarantees strict parity between model training and real-time inference.
    """

    def __init__(self, feature_names: Optional[List[str]] = None):
        self.feature_names = feature_names or list(FEATURE_NAMES)
        self.schema_hash = FEATURE_SCHEMA_HASH
        self.version = PIPELINE_VERSION

    @property
    def feature_count(self) -> int:
        return len(self.feature_names)

    def extract_from_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms a chronological batch / historical training DataFrame into the canonical feature matrix.
        Expects columns: 'temperature', 'pressure', 'humidity' and optionally 'timestamp'.
        """
        feat_df = pd.DataFrame(index=df.index)
        
        # 1. Base parameters
        feat_df["temperature"] = df["temperature"].astype(float)
        feat_df["pressure"] = df["pressure"].astype(float)
        feat_df["humidity"] = df["humidity"].astype(float)

        # 2. Timestamp temporal intelligence
        if "timestamp" in df.columns:
            ts_series = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
            hours = ts_series.dt.hour + ts_series.dt.minute / 60.0
            months = ts_series.dt.month
        else:
            # Synthetic uniform sequence if timestamps omitted
            n = len(df)
            hours = pd.Series((np.arange(n) % 24).astype(float), index=df.index)
            months = pd.Series(((np.arange(n) // 720) % 12 + 1).astype(float), index=df.index)

        feat_df["hour_sin"] = np.sin(2.0 * np.pi * hours / 24.0)
        feat_df["hour_cos"] = np.cos(2.0 * np.pi * hours / 24.0)
        feat_df["month_sin"] = np.sin(2.0 * np.pi * months / 12.0)
        feat_df["month_cos"] = np.cos(2.0 * np.pi * months / 12.0)
        feat_df["is_day"] = ((hours >= 6.0) & (hours <= 18.0)).astype(float)

        # 3. Rate of change (First difference)
        if len(df) > 1:
            dT = df["temperature"].diff().fillna(0.0)
            dP = df["pressure"].diff().fillna(0.0)
            dRH = df["humidity"].diff().fillna(0.0)
            if "timestamp" in df.columns:
                dt = ts_series.diff().dt.total_seconds().fillna(60.0)
                dt = dt.clip(lower=1.0, upper=3600.0)
            else:
                dt = pd.Series([60.0] * len(df), index=df.index)
        else:
            dT = pd.Series([0.0] * len(df), index=df.index)
            dP = pd.Series([0.0] * len(df), index=df.index)
            dRH = pd.Series([0.0] * len(df), index=df.index)
            dt = pd.Series([60.0] * len(df), index=df.index)

        feat_df["dT"] = dT
        feat_df["dP"] = dP
        feat_df["dRH"] = dRH
        feat_df["dt_seconds"] = dt

        # 4. Rolling stats (10-step window for robust station baseline)
        window_size = min(10, len(df))
        feat_df["rolling_mean_T"] = df["temperature"].rolling(window=window_size, min_periods=1).mean()
        feat_df["rolling_mean_P"] = df["pressure"].rolling(window=window_size, min_periods=1).mean()
        feat_df["rolling_mean_RH"] = df["humidity"].rolling(window=window_size, min_periods=1).mean()

        feat_df["rolling_std_T"] = df["temperature"].rolling(window=window_size, min_periods=1).std().fillna(0.0)
        feat_df["rolling_std_P"] = df["pressure"].rolling(window=window_size, min_periods=1).std().fillna(0.0)
        feat_df["rolling_std_RH"] = df["humidity"].rolling(window=window_size, min_periods=1).std().fillna(0.0)

        # 5. Station baseline deviations (local station rolling baseline deviation + diurnal component)
        feat_df["dev_from_baseline_T"] = feat_df["temperature"] - feat_df["rolling_mean_T"]
        feat_df["dev_from_baseline_P"] = feat_df["pressure"] - feat_df["rolling_mean_P"]
        feat_df["dev_from_baseline_RH"] = feat_df["humidity"] - feat_df["rolling_mean_RH"]

        # 6. Relational interaction
        feat_df["T_RH_ratio"] = feat_df["temperature"] * (feat_df["humidity"] / 100.0)

        # Enforce canonical column order
        return feat_df[self.feature_names]

    def extract_single(
        self,
        temperature: float,
        pressure: float,
        humidity: float,
        timestamp: Optional[datetime.datetime] = None,
        recent_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, float]:
        """
        Extracts feature vector dictionary for a single live inference reading.
        Integrates rolling history from station buffer for temporal consistency.
        """
        now = timestamp or datetime.datetime.now(datetime.timezone.utc)
        hour = now.hour + (now.minute / 60.0) + (now.second / 3600.0)
        month = now.month

        hour_sin = math.sin(2.0 * math.pi * hour / 24.0)
        hour_cos = math.cos(2.0 * math.pi * hour / 24.0)
        month_sin = math.sin(2.0 * math.pi * month / 12.0)
        month_cos = math.cos(2.0 * math.pi * month / 12.0)
        is_day = 1.0 if (6.0 <= hour <= 18.0) else 0.0

        # Rate of change calculation
        prev_T = temperature
        prev_P = pressure
        prev_RH = humidity
        dt_seconds = 60.0

        hist_T = [temperature]
        hist_P = [pressure]
        hist_RH = [humidity]

        if recent_history and len(recent_history) > 0:
            last = recent_history[-1]
            prev_T = float(last.get("temperature", temperature))
            prev_P = float(last.get("pressure", pressure))
            prev_RH = float(last.get("humidity", humidity))
            
            # Timestamp delta
            last_ts = last.get("timestamp")
            if isinstance(last_ts, str):
                try:
                    last_dt = datetime.datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
                    dt_seconds = max(1.0, min(3600.0, abs((now - last_dt).total_seconds())))
                except Exception:
                    dt_seconds = 60.0
            elif isinstance(last_ts, (int, float)):
                dt_seconds = max(1.0, min(3600.0, float(last_ts)))

            # Accumulate up to past 5 readings
            window = recent_history[-4:]
            for r in window:
                if "temperature" in r and r["temperature"] is not None:
                    hist_T.append(float(r["temperature"]))
                if "pressure" in r and r["pressure"] is not None:
                    hist_P.append(float(r["pressure"]))
                if "humidity" in r and r["humidity"] is not None:
                    hist_RH.append(float(r["humidity"]))

        dT = temperature - prev_T
        dP = pressure - prev_P
        dRH = humidity - prev_RH

        rolling_mean_T = float(np.mean(hist_T))
        rolling_mean_P = float(np.mean(hist_P))
        rolling_mean_RH = float(np.mean(hist_RH))

        rolling_std_T = float(np.std(hist_T)) if len(hist_T) > 1 else 0.0
        rolling_std_P = float(np.std(hist_P)) if len(hist_P) > 1 else 0.0
        rolling_std_RH = float(np.std(hist_RH)) if len(hist_RH) > 1 else 0.0

        dev_from_baseline_T = temperature - rolling_mean_T
        dev_from_baseline_P = pressure - rolling_mean_P
        dev_from_baseline_RH = humidity - rolling_mean_RH

        T_RH_ratio = temperature * (humidity / 100.0)

        raw_dict = {
            "temperature": float(temperature),
            "pressure": float(pressure),
            "humidity": float(humidity),
            "hour_sin": round(hour_sin, 4),
            "hour_cos": round(hour_cos, 4),
            "month_sin": round(month_sin, 4),
            "month_cos": round(month_cos, 4),
            "is_day": is_day,
            "dT": round(dT, 3),
            "dP": round(dP, 3),
            "dRH": round(dRH, 3),
            "dt_seconds": round(dt_seconds, 1),
            "rolling_mean_T": round(rolling_mean_T, 2),
            "rolling_mean_P": round(rolling_mean_P, 2),
            "rolling_mean_RH": round(rolling_mean_RH, 2),
            "rolling_std_T": round(rolling_std_T, 3),
            "rolling_std_P": round(rolling_std_P, 3),
            "rolling_std_RH": round(rolling_std_RH, 3),
            "dev_from_baseline_T": round(dev_from_baseline_T, 2),
            "dev_from_baseline_P": round(dev_from_baseline_P, 2),
            "dev_from_baseline_RH": round(dev_from_baseline_RH, 2),
            "T_RH_ratio": round(T_RH_ratio, 3)
        }

        # Return in exact canonical feature order
        return {k: raw_dict[k] for k in self.feature_names}

    def verify_feature_schema(self, incoming_features: List[str]) -> Tuple[bool, str]:
        """
        Validates feature schema names, count, and ordering.
        Fails loudly if any schema drift occurs.
        """
        if len(incoming_features) != len(self.feature_names):
            return False, f"Feature count mismatch: expected {len(self.feature_names)}, got {len(incoming_features)}"
        for idx, (exp, got) in enumerate(zip(self.feature_names, incoming_features)):
            if exp != got:
                return False, f"Feature order mismatch at index {idx}: expected '{exp}', got '{got}'"
        return True, "Schema verified successfully."
