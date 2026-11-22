export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type UserRole = 'FARMER' | 'OFFICER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  access_token?: string;
}

export interface Farm {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  crop_type: string;
  variety?: string;
  growth_stage?: string;
  area_hectares?: number;
  owner_id?: number;
  created_at?: string;
}

export interface Cluster {
  id: number;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  num_cases: number;
  primary_disease: string;
  current_risk: number;
  growth_rate?: number;
  alert_level: AlertLevel;
  first_observed?: string;
  last_updated?: string;
}

export interface PredictionResponse {
  predicted_disease: string;
  disease_probability: number;
  severity_score: number;
  current_risk: number;
  future_risk_3d: number;
  future_risk_5d: number;
  future_risk_7d: number;
  spread_probability: number;
  alert_level: AlertLevel;
  modality_gates?: Record<string, number>;
  explanation_text: string;
  shap_summary?: Array<{feature: string; contribution: number}>;
  model_version: string;
  inference_time_ms: number;
}

export interface DemoStepResponse {
  day: number;
  new_observations: Array<{latitude: number; longitude: number; disease_probability: number; severity: number}>;
  clusters: Cluster[];
  risk_summary: { current_risk: number; spread_probability: number };
  alert_level: AlertLevel;
  narrative: string;
  total_cases_cumulative: number;
  disclaimer?: string;
}

export interface DashboardData {
  total_farms: number;
  active_observations: number;
  active_clusters: number;
  high_risk_farms: number;
  outbreak_trend?: number;
  recent_alerts?: string[];
  clusters: Cluster[];
}

export interface WhatIfResponse {
  before: { alert: AlertLevel; risk: number; humidity: number };
  after: { alert: AlertLevel; risk: number; humidity: number };
  delta: number;
  delta_pct: string;
  explanation: string;
}

export interface DemoScenario {
  region: string;
  crop: string;
  disease: string;
  days: number[];
  description?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
}
