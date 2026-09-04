"""
backend/routers/stations.py
AWS Station Management and Health Monitoring router for SkyGuard AI.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from simulator.aws_simulator import simulator_instance
from ml.degradation import SensorDegradationTracker

router = APIRouter(prefix="/stations", tags=["Station Management"])
degradation_tracker = SensorDegradationTracker()


@router.get("")
async def list_stations():
    """
    Returns list of active AWS stations, coordinates, parameters, and current health status.
    """
    stations_list = []
    for s_id, info in simulator_instance.stations.items():
        # Fetch mock recent reading for current values
        reading = simulator_instance.generate_reading(s_id)
        temp = reading.get("temperature", info["base_temp"]) if reading else info["base_temp"]
        press = reading.get("pressure", info["base_press"]) if reading else info["base_press"]
        humid = reading.get("humidity", info["base_humid"]) if reading else info["base_humid"]

        # Health evaluation
        health_info = degradation_tracker.calculate_station_health(
            s_id,
            readings_history=[{"temperature": temp, "pressure": press, "humidity": humid}] * 10,
            anomalies_history=[]
        )

        stations_list.append({
            "station_id": s_id,
            "name": info["name"],
            "coordinates": {"lat": info["lat"], "lon": info["lon"]},
            "elevation_m": info["elevation_m"],
            "status": "ONLINE",
            "last_reading": {
                "temperature": temp,
                "pressure": press,
                "humidity": humid,
                "timestamp": reading.get("timestamp") if reading else None
            },
            "health": health_info
        })

    return {"count": len(stations_list), "stations": stations_list}


@router.get("/{station_id}")
async def get_station_details(station_id: str):
    if station_id not in simulator_instance.stations:
        raise HTTPException(status_code=404, detail="Station not found")

    info = simulator_instance.stations[station_id]
    reading = simulator_instance.generate_reading(station_id)

    health_info = degradation_tracker.calculate_station_health(
        station_id,
        readings_history=[{"temperature": reading.get("temperature", info["base_temp"])}] * 15,
        anomalies_history=[]
    )

    return {
        "station_id": station_id,
        "info": info,
        "current_reading": reading,
        "health": health_info
    }
