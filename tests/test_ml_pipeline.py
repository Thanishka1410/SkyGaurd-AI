"""
tests/test_ml_pipeline.py
Unit & Integration Test Suite for SkyGuard AI ML Pipeline.
"""

import sys
import os
import unittest
import pandas as pd
import numpy as np

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.data_loader import OpenMLDataLoader
from ml.anomaly_detector import Tier1AnomalyDetector
from ml.feature_extractor import Tier1FeatureExtractor, FEATURE_NAMES
from ml.explainability import AnomalyExplainer
from ml.imputer import ValueImputer
from ml.degradation import SensorDegradationTracker
from ml.export_lite_model import export_lightweight_edge_model


class TestMLPipeline(unittest.TestCase):

    def test_openml_data_loader(self):
        loader = OpenMLDataLoader()
        df, stats, meta = loader.prepare_combined_tier1_dataset()
        self.assertGreater(len(df), 100)
        self.assertIn("temperature", df.columns)
        self.assertIn("pressure", df.columns)
        self.assertIn("humidity", df.columns)
        self.assertIn("temperature", stats)
        self.assertGreater(meta["total_combined_rows"], 0)

    def test_feature_extractor_and_schema(self):
        extractor = Tier1FeatureExtractor()
        self.assertEqual(extractor.feature_count, len(FEATURE_NAMES))
        valid, msg = extractor.verify_feature_schema(FEATURE_NAMES)
        self.assertTrue(valid)

        feat_dict = extractor.extract_single(28.5, 1012.0, 78.0)
        self.assertEqual(len(feat_dict), len(FEATURE_NAMES))
        self.assertIn("dT", feat_dict)
        self.assertIn("rolling_mean_T", feat_dict)

    def test_anomaly_detector_normal(self):
        detector = Tier1AnomalyDetector()
        res = detector.predict_single(28.5, 1012.0, 78.0)
        self.assertIn("is_anomaly", res)
        self.assertIn("confidence", res)
        self.assertIn("root_cause", res)
        self.assertIn("why_detected", res)
        self.assertIn("category", res)

    def test_anomaly_detector_spike(self):
        detector = Tier1AnomalyDetector()
        history = [{"temperature": 28.0, "pressure": 1012.0, "humidity": 80.0}]
        res = detector.predict_single(48.5, 1012.0, 80.0, recent_history=history)
        self.assertTrue(res["is_anomaly"])
        self.assertEqual(res["root_cause"], "temperature_spike")
        self.assertEqual(res["category"], "SENSOR_FAULT")

    def test_explainability_shap(self):
        detector = Tier1AnomalyDetector()
        explainer = AnomalyExplainer(detector)
        extractor = Tier1FeatureExtractor()
        feat = extractor.extract_single(45.0, 1012.0, 80.0)
        factors = explainer.explain_instance(feat, detector)
        self.assertGreater(len(factors), 0)
        self.assertIn("feature", factors[0])
        self.assertIn("shap_weight", factors[0])

    def test_imputer(self):
        imputer = ValueImputer()
        res = imputer.suggest_correction("temperature", 48.0, spatial_neighbors=[{"temperature": 28.2}])
        self.assertAlmostEqual(res["corrected_value"], 28.2, delta=3.0)
        self.assertGreater(res["confidence"], 0.60)

    def test_degradation_tracker(self):
        tracker = SensorDegradationTracker()
        res = tracker.calculate_station_health("AWS_GOA_01", [{"temperature": 28.0}] * 20, [{"root_cause": "spike_fault"}] * 6)
        self.assertLess(res["overall_health_score"], 100.0)

    def test_export_lite_model(self):
        metadata = export_lightweight_edge_model()
        self.assertGreater(metadata["file_size_bytes"], 0)
        self.assertIn("inference_latency_ms", metadata)


if __name__ == "__main__":
    unittest.main()
