"""
backend/routers/simulator_router.py
Simulator Control Panel router for SkyGuard AI.
Allows triggering on-demand fault injections (spike, frozen, drift, dropout)
to demonstrate live real-time anomaly detection end-to-end.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from simulator.aws_simulator import simulator_instance

router = APIRouter(prefix="/simulator", tags=["Virtual AWS Hardware Simulator"])


class FaultInjectRequest(BaseModel):
    station_id: str = "AWS_GOA_01"
    fault_type: str = "spike"  # spike | frozen | drift | dropout
    parameter: str = "temperature"  # temperature | pressure | humidity
    magnitude: float = 15.0
    duration_steps: int = 5


@router.get("/status")
async def get_simulator_status():
    """
    Returns active stations and ongoing fault injections.
    """
    return {
        "status": "ONLINE",
        "station_count": len(simulator_instance.stations),
        "active_injections": simulator_instance.active_injections,
        "stations": list(simulator_instance.stations.keys())
    }


@router.post("/inject")
async def inject_fault_endpoint(req: FaultInjectRequest):
    """
    Triggers an on-demand fault injection on a specified virtual station.
    """
    res = simulator_instance.inject_fault(
        station_id=req.station_id,
        fault_type=req.fault_type,
        parameter=req.parameter,
        magnitude=req.magnitude,
        duration_steps=req.duration_steps
    )
    return res


@router.post("/clear")
async def clear_faults_endpoint(station_id: Optional[str] = None):
    """
    Clears active fault injections across all or single virtual station.
    """
    res = simulator_instance.clear_injections(station_id)
    return res
