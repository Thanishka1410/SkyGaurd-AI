# Dataset Characteristics & Telemetry Documentation — SkyGuard AI

## 1. Primary Dataset — OpenML Goa Historical Weather Data (`ID 43409`)
- **Source**: OpenML Repository (ID `43409`)
- **Resolution**: 15-minute to hourly observations.
- **Region**: Goa Coastal & Hinterland Monitoring Network.
- **Parameters Provided**:
  - `temperature` (°C) — Ambient air temperature
  - `humidity` (%) — Relative humidity
  - `pressure` (hPa) — Barometric sea-level pressure
  - `wind_speed` (km/h) — Surface wind velocity
  - `wind_direction` (degrees) — Wind vector heading
  - `rainfall` (mm) — Accumulated precipitation
- **Tier 1 Contribution**: Supplies full multivariate temporal baseline (Temperature, Humidity, Pressure) for coastal tropical microclimates.

---

## 2. Secondary Dataset — Local Indian Climate Dataset (2024–2025)
- **File Path**: `Dataset/Indian_Climate_Dataset_2024_2025.csv`
- **Shape**: 7,310 rows × 13 columns (Date range: 2024-01-01 to 2025-12-31 across 10 major Indian urban centers).
- **Columns Validated at Load Time**:
  - `Date` (datetime string)
  - `City` (urban station location: Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, Ahmedabad, Jaipur, Lucknow, Bhopal)
  - `State` (administrative region)
  - `Temperature_Max (°C)`, `Temperature_Min (°C)`, `Temperature_Avg (°C)`
  - `Humidity (%)`
  - `Rainfall (mm)`
  - `Wind_Speed (km/h)`
  - `AQI`, `AQI_Category`
  - `Pressure (hPa)`
  - `Cloud_Cover (%)`
- **Tier 1 Contribution**: Supplies `temperature` (mapped from `Temperature_Avg`), `humidity`, and `pressure`.
- **Data Integrity & Synthetic Generation Note**:
  - Inspection of variance and diurnal distribution bounds suggests this dataset was generated via synthetic climate simulation modeling calibrated on Indian Meteorological Department (IMD) historical seasonal ranges.
  - Per Section 1.2 of the project specification, this telemetry source is explicitly documented as **synthetically modeled climate data** rather than raw uncalibrated hardware sensor logs.

---

## 3. Merging & Preprocessing Strategy
- **Intersection Merging**: Combined training merges both sources strictly on the overlapping parameters (`temperature`, `pressure`, `humidity`).
- **Feature Scope**: Tier 1 Anomaly Detection operates strictly on `temperature`, `pressure`, and `humidity`. `wind_speed` and `rainfall` are excluded from Tier 1 and reserved exclusively for Tier 2 Environmental Risk assessment.
