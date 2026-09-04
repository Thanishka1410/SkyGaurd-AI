export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Reading {
  station_id: string;
  station_name: string;
  coordinates: Coordinates;
  timestamp: string;
  temperature: number;
  pressure: number;
  humidity: number;
  origin: 'SIMULATED' | 'WEATHER_API' | 'SENSOR' | 'OPENML';
  is_simulated_fault?: boolean;
  injected_fault_type?: string;
  anomaly_evaluation?: AnomalyEvaluation;
  contributing_factors?: SHAPFactor[];
  imputed_suggestion?: ImputedSuggestion;
}

export interface AnomalyEvaluation {
  is_anomaly: boolean;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  root_cause: string;
  spatial_verdict: string;
  isolation_forest_score: number;
  model_name: string;
  model_version: string;
}

export interface SHAPFactor {
  feature: string;
  value: number;
  shap_weight: number;
  abs_importance: number;
  impact: string;
  description: string;
}

export interface ImputedSuggestion {
  target_feature: string;
  original_value: number;
  corrected_value: number;
  difference: number;
  confidence: number;
  method: string;
}

export interface SpatialConsensus {
  verdict: string;
  is_corroborated: boolean;
  neighbor_count: number;
  distance_weighted_neighbor_avg: {
    temperature: number;
    pressure: number;
    humidity: number;
  };
  deltas: {
    temp_delta: number;
    press_delta: number;
  };
  explanation: string;
}

export interface StationHealth {
  station_id: string;
  overall_health_score: number;
  maintenance_recommended: boolean;
  urgency: 'NONE' | 'WARNING' | 'CRITICAL';
  sensor_scores: {
    temperature: number;
    pressure: number;
    humidity: number;
  };
  degradation_reasons: string[];
}

export interface Station {
  station_id: string;
  name: string;
  coordinates: Coordinates;
  elevation_m: number;
  status: string;
  last_reading?: {
    temperature: number;
    pressure: number;
    humidity: number;
    timestamp?: string;
  };
  health: StationHealth;
}

export interface AnomalyRecord {
  id: string;
  station_id: string;
  station_name: string;
  timestamp: string;
  origin: string;
  readings: {
    temperature: number;
    pressure: number;
    humidity: number;
  };
  is_anomaly: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  root_cause: string;
  confidence: number;
  isolation_forest_score: number;
  spatial_verdict: string;
  contributing_factors: SHAPFactor[];
  imputed_value_suggestion?: ImputedSuggestion;
}

export interface DisasterHazard {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  contributing_factors: string[];
}

export interface DisasterRiskSummary {
  tier_label: string;
  composite_risk_score: number;
  composite_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hazards: {
    flood: DisasterHazard;
    heatwave: DisasterHazard;
    cyclone: DisasterHazard;
  };
  data_sources_used: string[];
}

export interface AlertItem {
  alert_id: string;
  station_id: string;
  station_name: string;
  category: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  cooldown_active: boolean;
}
