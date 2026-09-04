"""
tests/test_backend_api.py
Integration Test Suite for FastAPI Backend API endpoints.
"""

import sys
import os
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app


class TestBackendAPI(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "HEALTHY")

    def test_stations_list(self):
        resp = self.client.get("/api/stations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreater(data["count"], 0)

    def test_anomalies_feed(self):
        resp = self.client.get("/api/anomalies")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("anomalies", data)

    def test_simulator_status_and_inject(self):
        resp_st = self.client.get("/api/simulator/status")
        self.assertEqual(resp_st.status_code, 200)
        data_st = resp_st.json()
        self.assertIn("is_running", data_st)

        resp_inj = self.client.post("/api/simulator/inject", json={
            "station_id": "AWS-01",
            "fault_type": "temperature_spike",
            "parameter": "temperature",
            "magnitude": 18.0,
            "duration_steps": 3
        })
        self.assertEqual(resp_inj.status_code, 200)

        resp_clr = self.client.post("/api/simulator/clear")
        self.assertEqual(resp_clr.status_code, 200)

    def test_tier2_disaster_risks(self):
        resp = self.client.get("/api/risks")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("risk_intelligence", data)
        self.assertIn("hazards", data["risk_intelligence"])


if __name__ == "__main__":
    unittest.main()
