"""
tests/test_ml_pipeline.py
Unit & Integration Test Suite for SkyGuard AI ML Pipeline.
"""

import unittest
import os
import pandas as pd
import numpy as np
from ml.data_loader import OpenMLDataLoader
from ml.anomaly_detector import Tier1AnomalyDetector
from ml.explainability import AnomalyExplainer
from ml.imputer import ValueImputer
from ml.degradation import SensorDegradationTracker
from ml.export_lite_model import export_lightweight_edge_model


class TestMLPipeline(unittest.TestCase):

    def test_openml_data_loader(self):
        loader = OpenMLDataLoader()
        df, stats = loader.prepare_tier1_dataset()
        self.assertGreater(len(df), 100)
        self.assertIn("temperature", df.columns)
        self.assertIn("pressure", df.columns)
        self.assertIn("humidity", df.columns)
        self.assertIn("temperature", stats)

    def test_anomaly_detector_normal(self):
        detector = Tier1AnomalyDetector()
        res = detector.predict_single(28.5, 1012.0, 78.0)
        self.assertIn("is_anomaly", res)
        self.assertIn("confidence", res)
        self.assertIn("root_cause", res)

    def test_anomaly_detector_spike(self):
        detector = Tier1AnomalyDetector()
        history = [{"temperature": 28.0, "pressure": 1012.0, "humidity": 80.0}]
        res = detector.predict_single(48.5, 1012.0, 80.0, recent_history=history)
        self.assertTrue(res["is_anomaly"])
        self.assertEqual(res["root_cause"], "spike_fault")

    def test_explainability_shap(self):
        explainer = AnomalyExplainer()
        factors = explainer.explain_instance(45.0, 1012.0, 80.0, None)
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
