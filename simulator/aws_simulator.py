"""
simulator/aws_simulator.py
Virtual Automatic Weather Station (AWS) Hardware Simulator for SkyGuard AI.
Programmatically generates realistic multi-station T, P, RH streams with controllable fault injections.
"""

import time
import math
import random
import datetime
from typing import Dict, Any, List, Optional


class VirtualAWSSimulator:
    """
    Simulates a network of AWS stations streaming Temperature (°C),
    Atmospheric Pressure (hPa), and Relative Humidity (%) in real-time.
    Supports on-demand injection of sensor fault modes for live testing.
    """

    def __init__(self):
        # Station network topology (Goa region coordinates)
        self.stations = {
            "AWS_GOA_01": {
                "name": "Panaji Coastal Station",
                "lat": 15.4989,
                "lon": 73.8278,
                "elevation_m": 7.0,
                "base_temp": 28.5,
                "base_press": 1012.0,
                "base_humid": 80.0
            },
            "AWS_GOA_02": {
                "name": "Margao Inland Station",
                "lat": 15.2736,
                "lon": 73.9581,
                "elevation_m": 12.0,
                "base_temp": 29.2,
                "base_press": 1011.2,
                "base_humid": 74.0
            },
            "AWS_GOA_03": {
                "name": "Vasco Harbor Station",
                "lat": 15.3959,
                "lon": 73.8157,
                "elevation_m": 5.0,
                "base_temp": 28.0,
                "base_press": 1012.5,
                "base_humid": 82.0
            },
            "AWS_GOA_04": {
                "name": "Mapusa North Station",
                "lat": 15.5926,
                "lon": 73.8117,
                "elevation_m": 18.0,
                "base_temp": 27.8,
                "base_press": 1010.8,
                "base_humid": 76.0
            }
        }

        # Active injected fault states per station
        # e.g., {"AWS_GOA_01": {"type": "spike", "parameter": "temperature", "magnitude": 15.0, "duration_steps": 3}}
        self.active_injections: Dict[str, Dict[str, Any]] = {}
        self.frozen_values: Dict[str, Dict[str, float]] = {}
        self.drift_accumulators: Dict[str, Dict[str, float]] = {}

    def inject_fault(self, station_id: str, fault_type: str, parameter: str = "temperature", magnitude: float = 15.0, duration_steps: int = 5):
        """
        Triggers a live fault injection on a specified station.
        fault_type options: 'spike', 'frozen', 'drift', 'dropout'
        """
        if station_id not in self.stations:
            return {"status": "error", "message": f"Station {station_id} not found."}

        self.active_injections[station_id] = {
            "type": fault_type.lower(),
            "parameter": parameter.lower(),
            "magnitude": magnitude,
            "duration_steps": duration_steps,
            "remaining_steps": duration_steps,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        if fault_type.lower() == "drift":
            self.drift_accumulators[station_id] = {parameter.lower(): 0.0}

        return {
            "status": "success",
            "message": f"Injected '{fault_type}' fault on {station_id} ({parameter}) for {duration_steps} steps.",
            "injection": self.active_injections[station_id]
        }

    def clear_injections(self, station_id: Optional[str] = None):
        """
        Clears active injections for a station or all stations.
        """
        if station_id:
            self.active_injections.pop(station_id, None)
            self.frozen_values.pop(station_id, None)
            self.drift_accumulators.pop(station_id, None)
        else:
            self.active_injections.clear()
            self.frozen_values.clear()
            self.drift_accumulators.clear()
        return {"status": "success", "message": "Cleared all active fault injections."}

    def generate_reading(self, station_id: str, current_time: Optional[datetime.datetime] = None) -> Optional[Dict[str, Any]]:
        """
        Generates a single synthetic AWS reading (T, P, RH) adhering to
        diurnal physics curves and active fault injections.
        """
        if station_id not in self.stations:
            return None

        st = self.stations[station_id]
        now = current_time or datetime.datetime.now(datetime.timezone.utc)
        hour = now.hour + (now.minute / 60.0)

        # Diurnal curves (Peak temp around 14:00, lowest humidity around 14:00, pressure diurnal cycle)
        temp_diurnal = 3.8 * math.sin(2.0 * math.pi * (hour - 9.0) / 24.0)
        press_diurnal = -1.8 * math.sin(2.0 * math.pi * (hour - 6.0) / 24.0)
        humid_diurnal = -12.0 * math.sin(2.0 * math.pi * (hour - 9.0) / 24.0)

        # Ambient sensor noise
        noise_T = random.gauss(0, 0.25)
        noise_P = random.gauss(0, 0.35)
        noise_RH = random.gauss(0, 0.8)

        temp = round(st["base_temp"] + temp_diurnal + noise_T, 2)
        press = round(st["base_press"] + press_diurnal + noise_P, 2)
        humid = round(min(100.0, max(20.0, st["base_humid"] + humid_diurnal + noise_RH)), 2)

        # Apply active fault injection if present
        injection = self.active_injections.get(station_id)
        is_simulated_fault = False
        injected_fault_tag = "NONE"

        if injection and injection["remaining_steps"] > 0:
            f_type = injection["type"]
            f_param = injection["parameter"]
            mag = injection["magnitude"]
            is_simulated_fault = True
            injected_fault_tag = f_type.upper()

            if f_type == "dropout":
                # Sensor communication failure -> skip packet return
                injection["remaining_steps"] -= 1
                return None

            elif f_type == "spike":
                if f_param == "temperature":
                    temp = round(temp + mag, 2)
                elif f_param == "pressure":
                    press = round(press + mag, 2)
                elif f_param == "humidity":
                    humid = round(min(100.0, max(0.0, humid + mag)), 2)

            elif f_type == "frozen":
                if station_id not in self.frozen_values:
                    self.frozen_values[station_id] = {
                        "temperature": temp,
                        "pressure": press,
                        "humidity": humid
                    }
                frozen_st = self.frozen_values[station_id]
                temp = frozen_st["temperature"]
                press = frozen_st["pressure"]
                humid = frozen_st["humidity"]

            elif f_type == "drift":
                if station_id not in self.drift_accumulators:
                    self.drift_accumulators[station_id] = {f_param: 0.0}
                self.drift_accumulators[station_id][f_param] += mag
                drift_val = self.drift_accumulators[station_id][f_param]

                if f_param == "temperature":
                    temp = round(temp + drift_val, 2)
                elif f_param == "pressure":
                    press = round(press + drift_val, 2)
                elif f_param == "humidity":
                    humid = round(min(100.0, max(0.0, humid + drift_val)), 2)

            injection["remaining_steps"] -= 1
            if injection["remaining_steps"] <= 0:
                self.active_injections.pop(station_id, None)

        return {
            "station_id": station_id,
            "station_name": st["name"],
            "coordinates": {"lat": st["lat"], "lon": st["lon"]},
            "timestamp": now.isoformat(),
            "temperature": temp,
            "pressure": press,
            "humidity": humid,
            "origin": "SIMULATED",
            "is_simulated_fault": is_simulated_fault,
            "injected_fault_type": injected_fault_tag
        }

    def generate_all_stations() -> List[Dict[str, Any]]:
        """
        Generates readings for all stations in the virtual network.
        """
        results = []
        for s_id in self.stations:
            reading = self.generate_reading(s_id)
            if reading:
                results.append(reading)
        return results


# Global singleton instance
simulator_instance = VirtualAWSSimulator()


if __name__ == "__main__":
    sim = VirtualAWSSimulator()
    print("Base Reading:", sim.generate_reading("AWS_GOA_01"))
    sim.inject_fault("AWS_GOA_01", "spike", "temperature", 18.0, 2)
    print("Fault Reading 1:", sim.generate_reading("AWS_GOA_01"))
    print("Fault Reading 2:", sim.generate_reading("AWS_GOA_01"))
    print("Post-Fault Reading:", sim.generate_reading("AWS_GOA_01"))
