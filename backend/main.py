"""
backend/main.py
Main entry point for SkyGuard AI FastAPI application.
Configures CORS, Database initialization, Router mounting, and WebSocket streaming endpoint.
"""

import asyncio
import json
import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import db_manager
from backend.routers import auth, stations, anomalies, simulator_router, risks, alerts, analytics
from simulator.aws_simulator import simulator_instance
from ml.anomaly_detector import Tier1AnomalyDetector
from ml.explainability import AnomalyExplainer
from ml.imputer import ValueImputer
from backend.services.spatial_check import spatial_engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations (SIH Problem Statement 26073)",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(stations.router, prefix=settings.API_V1_STR)
app.include_router(anomalies.router, prefix=settings.API_V1_STR)
app.include_router(simulator_router.router, prefix=settings.API_V1_STR)
app.include_router(risks.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

detector = Tier1AnomalyDetector()
explainer = AnomalyExplainer()
imputer = ValueImputer()


# Active WebSocket connections list
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():
    print("[Main] Starting SkyGuard AI Backend Service...")
    await db_manager.connect()
    # Pre-fit model if needed
    detector.load()
    # Start background sensor simulation stream task
    asyncio.create_task(background_sensor_simulation_loop())


async def background_sensor_simulation_loop():
    """
    Continuous background task generating synthetic AWS sensor readings,
    evaluating them against the Tier 1 anomaly model + SHAP explainer, and broadcasting via WebSocket.
    """
    while True:
        try:
            # Generate readings for all virtual stations
            readings = []
            for s_id in simulator_instance.stations:
                r = simulator_instance.generate_reading(s_id)
                if r:
                    # Evaluate single reading
                    t, p, rh = r["temperature"], r["pressure"], r["humidity"]
                    neighbors = [simulator_instance.generate_reading(ns) for ns in simulator_instance.stations if ns != s_id]
                    neighbors = [n for n in neighbors if n is not None]

                    pred = detector.predict_single(t, p, rh, spatial_neighbors=neighbors)
                    r["anomaly_evaluation"] = pred

                    if pred["is_anomaly"]:
                        factors = explainer.explain_instance(t, p, rh, detector)
                        r["contributing_factors"] = factors
                        prim_feat = factors[0]["feature"]
                        bad_v = t if prim_feat == "temperature" else (p if prim_feat == "pressure" else rh)
                        r["imputed_suggestion"] = imputer.suggest_correction(prim_feat, bad_v, spatial_neighbors=neighbors)

                    readings.append(r)

            if len(readings) > 0 and len(manager.active_connections) > 0:
                await manager.broadcast({
                    "event": "SENSOR_STREAM_UPDATE",
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "readings": readings
                })
        except Exception as e:
            print(f"[SimulationLoop] Notice: {e}")

        await asyncio.sleep(3.0)


@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "SkyGuard AI Backend",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "database_connected": db_manager.is_connected,
        "active_websocket_subscribers": len(manager.active_connections)
    }


@app.websocket("/ws/readings")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print(f"[WebSocket] Client connected. Total active: {len(manager.active_connections)}")
    try:
        while True:
            # Keep-alive receive ping
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("[WebSocket] Client disconnected")
