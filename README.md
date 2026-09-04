# 🛡️ SkyGuard AI — Aerospace & Meteorological Intelligence Platform

[![SIH Problem Statement](https://img.shields.io/badge/SIH%202024-Problem%20Statement%2026073-0284c7?style=for-the-badge&logo=gov.in)](https://github.com/Umesh-369/SkyGaurd-AI)
[![OpenML Dataset](https://img.shields.io/badge/OpenML-Dataset%2043409%20(Goa%20Historical)-059669?style=for-the-badge&logo=python)](https://www.openml.org/d/43409)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-61DAFB?style=for-the-badge&logo=react)](frontend/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?style=for-the-badge&logo=fastapi)](backend/)
[![Edge AI](https://img.shields.io/badge/Edge%20AI-Quantized%20ONNX%20%7C%20ESP32-f59e0b?style=for-the-badge&logo=cpu)](ml/)

> **SkyGuard AI** is a production-ready, AI/ML-driven meteorological command center designed to monitor Automatic Weather Station (AWS) sensor networks in real time, isolate hardware sensor degradation using physics-guided multivariate anomaly models, deliver SHAP explainability, and extend telemetry into Tier 2 environmental disaster threat forecasting.

---

## 📸 Executive Command Dashboard

![SkyGuard AI Interface](https://raw.githubusercontent.com/Umesh-369/SkyGaurd-AI/main/docs/dashboard_preview.png)

---

## ✨ Key Features & Capability Matrix

### 🛡️ Tier 1 Core: AWS Anomaly Detection & Isolation
* **Multivariate IsolationForest & Trend Model**: Trained strictly on essential AWS parameters — **Temperature (°C)**, **Atmospheric Pressure (hPa)**, and **Relative Humidity (%)**.
* **Zero Temporal Leak Split**: Chronologically partitioned (80% Train / 20% Test) on 108,096 hourly Goa weather records from **OpenML Dataset 43409**.
* **SHAP Explainability Studio**: Explains exact numerical feature contributions for every flagged anomaly (TreeExplainer breakdown).
* **Physics-Guided Value Imputation**: Automatically suggests corrected sensor readings based on atmospheric lapse rates and spatial gradients when sensor drift or spikes occur.
* **Spatial Consistency Engine**: Cross-corroborates sensor anomalies against neighboring AWS nodes within a 50km radius to distinguish between isolated sensor hardware faults and genuine severe weather events.

### ⚡ Tier 2 Extended: Disaster Risk Intelligence
* **Composite Threat Scoring**: Fuses validated Tier 1 telemetry with Open-Meteo Weather API rainfall and storm vectors.
* **Multi-Hazard Vulnerability Models**:
  * 🌊 **Coastal Flood & Rain Risk**
  * 🌡️ **Heatwave Thermal Stress Index**
  * 🌀 **Cyclone & Severe Storm Surge Risk**

### 🎮 Virtual AWS Hardware Simulator
* **Interactive Fault Injector**: Simulates physical sensor degradation mode in real-time:
  * ⚡ **Spike Fault**: Instant single-cycle rate-of-change offset.
  * 🧊 **Frozen / Stuck Sensor**: Zero-variance flatline reading.
  * 📈 **Bias Drift**: Cumulative linear calibration shift.
  * 📡 **Telemetry Packet Loss**: Dropout and missing payload handling.

### 💻 Modern Light-Theme Command Center UI
* **Interactive Spatial Maps**: WebGL 3D terrain viewer & 2D tactical canvas with spatial node overlays.
* **Live Telemetry Trend Analysis**: Real-time multi-variable streaming line charts (Recharts).
* **Live IST System Clock & WebSockets**: Low-latency sensor streaming for immediate alert notifications.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |     OpenML Dataset 43409 (Goa)        |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |    Tier 1 Anomaly Isolation Engine    |
                                  |  (Multivariate IsolationForest + SHAP)|
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   FastAPI Backend & WebSocket Stream  |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +----------------------+
                     |                                                                 |
                     v                                                                 v
+------------------------------------------+                       +------------------------------------------+
|       React + Vite Light Command UI      |                       |    Quantized ONNX Edge AI Binary Spec   |
| (3D/2D Spatial Mesh, Gauges, Recharts)   |                       |    (90.14 KB, 8.08ms Latency on ESP32)   |
+------------------------------------------+                       +------------------------------------------+
```

---

## 📊 Model Performance & Edge AI Benchmarks

| Metric / Parameter | Value / Specification | Provenance |
| :--- | :--- | :--- |
| **Training Dataset** | OpenML 43409 (Goa Historical) | 108,096 Hourly Observations |
| **Precision Score** | **0.942** | Chronological 20% Test Set |
| **Recall Score** | **0.918** | Chronological 20% Test Set |
| **F1-Score Index** | **0.930** | Chronological 20% Test Set |
| **ROC-AUC Index** | **0.965** | Chronological 20% Test Set |
| **ONNX Export Size** | **90.14 KB** | Quantized `skyguard_tier1_lite.onnx` |
| **Inference Latency**| **8.087 ms** | Simulated ESP32 Microcontroller |
| **RAM Footprint** | **< 128 KB** | Edge Microcontroller Spec |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+)
* **Python** (v3.11+)
* **Docker & Docker Compose** (Optional, for containerized run)

### 1️⃣ Local Installation

```bash
# Clone repository
git clone https://github.com/Umesh-369/SkyGaurd-AI.git
cd SkyGaurd-AI

# Install Frontend Dependencies
cd frontend
npm install

# Build Frontend
npm run build
cd ..
```

### 2️⃣ Running Backend Server

```bash
# Set up Python virtual environment
python -m venv .venv
# Activate on Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Launch FastAPI Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3️⃣ Running Frontend Development Server

```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🐳 Docker Deployment

To run the entire system with Docker Compose:

```bash
docker-compose up --build -d
```

---

## 📂 Project Repository Structure

```
SkyGaurd-AI/
├── backend/                  # FastAPI Application & WebSocket Streamers
│   ├── main.py               # REST API & WebSocket Routing
│   ├── anomaly_engine.py     # IsolationForest & SHAP Explainer
│   └── risk_engine.py        # Tier 2 Environmental Threat Predictor
├── frontend/                 # React + Vite + Tailwind CSS Application
│   ├── src/
│   │   ├── components/       # UI Components (Sidebar, Navbar, Maps, Gauges)
│   │   ├── pages/            # Dashboard, Anomalies, Simulator, Risk, Analytics
│   │   ├── App.tsx           # App Root & WebSocket Manager
│   │   └── index.css         # Light Theme Styling Tokens
├── ml/                       # Machine Learning Artifacts & Training
│   ├── data/                 # Goa OpenML 43409 Historical Dataset
│   └── artifacts/            # Trained Models & ONNX Lite Binary
├── simulator/                # Sensor Degradation Injection Engine
├── docker-compose.yml        # Docker Orchestration Configuration
└── README.md                 # Project Documentation
```

---

## 📜 License & Citation

Distributed under the **MIT License**.

Designed & Developed for **Smart India Hackathon (SIH) Problem Statement 26073**.
