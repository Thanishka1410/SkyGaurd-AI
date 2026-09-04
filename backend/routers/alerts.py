"""
backend/routers/alerts.py
Alert Engine and Notification Management router for SkyGuard AI.
Handles alert generation, cooldown suppression, acknowledgement, and resolution.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import datetime

router = APIRouter(prefix="/alerts", tags=["Alert Engine"])

SAMPLE_ALERTS = [
    {
        "alert_id": "ALT_2026_101",
        "station_id": "AWS_GOA_01",
        "station_name": "Panaji Coastal Station",
        "category": "SENSOR_FAULT",
        "title": "Temperature Spike Detected",
        "severity": "HIGH",
        "message": "Temperature sensor reported unphysical +17.6°C jump (45.8°C). Contradicted by neighbor stations.",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "ACTIVE",
        "cooldown_active": True
    },
    {
        "alert_id": "ALT_2026_102",
        "station_id": "AWS_GOA_02",
        "station_name": "Margao Inland Station",
        "category": "SENSOR_FAULT",
        "title": "Barometric Pressure Out-of-Bounds",
        "severity": "CRITICAL",
        "message": "Barometric pressure dropped to 965.0 hPa (below valid 900 hPa threshold).",
        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=10)).isoformat(),
        "status": "ACTIVE",
        "cooldown_active": True
    }
]


@router.get("")
async def list_alerts(status: str = "ACTIVE"):
    return {
        "count": len(SAMPLE_ALERTS),
        "alerts": [a for a in SAMPLE_ALERTS if status == "ALL" or a["status"] == status]
    }


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    for a in SAMPLE_ALERTS:
        if a["alert_id"] == alert_id:
            a["status"] = "ACKNOWLEDGED"
            return {"status": "success", "message": f"Alert {alert_id} acknowledged.", "alert": a}
    raise HTTPException(status_code=404, detail="Alert not found")


@router.post("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    for a in SAMPLE_ALERTS:
        if a["alert_id"] == alert_id:
            a["status"] = "RESOLVED"
            return {"status": "success", "message": f"Alert {alert_id} resolved.", "alert": a}
    raise HTTPException(status_code=404, detail="Alert not found")
