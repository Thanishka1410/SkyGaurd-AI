"""
tests/test_fault_pipeline.py
Unit & Integration test suite testing fault injection across all categories:
Sensor Faults, Multi-Sensor Coupled Faults, and Communication Failures.
"""

import sys
import os
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.routers import anomalies
from backend.services.comm_monitor import comm_monitor


class TestFaultPipeline(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        anomalies.clear_live_anomalies()
        comm_monitor.active_comm_failures.clear()

    def test_temperature_spike_fault(self):
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
        self.assertTrue(data["anomaly"]["is_anomaly"])
        self.assertEqual(data["anomaly"]["category"], "SENSOR_FAULT")
        self.assertIn("why_detected", data["anomaly"])

    def test_communication_failure_offline(self):
        resp = self.client.post("/api/simulator/inject", json={
            "station_id": "AWS-02",
            "fault_type": "station_offline",
            "duration_steps": 10
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("anomaly", data)
        self.assertEqual(data["anomaly"]["category"], "COMMUNICATION_FAILURE")
        self.assertEqual(data["anomaly"]["status"], "Communication Failure")

    def test_multivariate_fault(self):
        resp = self.client.post("/api/simulator/inject", json={
            "station_id": "AWS-03",
            "fault_type": "multivariate_fault",
            "duration_steps": 10
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("anomaly", data)
        self.assertTrue(data["anomaly"]["is_anomaly"])

    def test_clear_faults_and_feed_reset(self):
        # Inject fault
        self.client.post("/api/simulator/inject", json={
            "station_id": "AWS-01",
            "fault_type": "temperature_spike",
            "magnitude": 18.0
        })
        # Clear faults
        resp_clear = self.client.post("/api/simulator/clear")
        self.assertEqual(resp_clear.status_code, 200)

        # Check anomalies feed
        resp_feed = self.client.get("/api/anomalies")
        self.assertEqual(resp_feed.status_code, 200)
        self.assertEqual(resp_feed.json()["count"], 0)


if __name__ == "__main__":
    unittest.main()
