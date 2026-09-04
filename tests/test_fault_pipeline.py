"""
tests/test_fault_pipeline.py
Unit test specifically testing fault injection end-to-end flow:
POST /api/simulator/inject -> immediately generates anomaly record -> clear faults -> resets feed.
"""

import sys
import os
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.routers.anomalies import LIVE_ANOMALIES_FEED


class TestFaultPipeline(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_end_to_end_injection_and_clear(self):
        # 1. Trigger fault injection
        resp = self.client.post("/api/simulator/inject", json={
            "station_id": "AWS-01",
            "fault_type": "temperature_spike",
            "parameter": "temperature",
            "magnitude": 15.0,
            "duration_steps": 10
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("anomaly", data)
        self.assertIsNotNone(data["anomaly"])
        self.assertEqual(data["anomaly"]["station_id"], "AWS-01")
        self.assertTrue(data["anomaly"]["is_anomaly"])
        self.assertGreater(len(data["anomaly"]["contributing_factors"]), 0)

        # 2. Check anomalies feed endpoint has the newly generated anomaly
        resp_feed = self.client.get("/api/anomalies")
        self.assertEqual(resp_feed.status_code, 200)
        feed_data = resp_feed.json()
        self.assertGreater(feed_data["count"], 0)
        self.assertEqual(feed_data["anomalies"][0]["station_id"], "AWS-01")

        # 3. Clear fault injections
        resp_clear = self.client.post("/api/simulator/clear")
        self.assertEqual(resp_clear.status_code, 200)

        # 4. Check anomalies feed endpoint is cleared
        resp_feed_after = self.client.get("/api/anomalies")
        self.assertEqual(resp_feed_after.status_code, 200)
        feed_after_data = resp_feed_after.json()
        self.assertEqual(feed_after_data["count"], 0)


if __name__ == "__main__":
    unittest.main()
