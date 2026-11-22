import { 
  AlertLevel, User, Farm, Cluster, PredictionResponse, 
  DemoStepResponse, DashboardData, WhatIfResponse, DemoScenario, HealthStatus 
} from './types';

export const API_BASE = 'http://localhost:8000/api/v1';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      console.error(`API Error ${res.status} on ${endpoint}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Fetch exception on ${endpoint}`, err);
    return null;
  }
}

export async function login(email: string, password: string):Promise<{access_token: string} | null> {
  return fetchAPI<{access_token: string}>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function getFarms(): Promise<Farm[]> {
  return (await fetchAPI<Farm[]>('/farms/')) || [];
}

export async function createFarm(farm: Omit<Farm, 'id'>): Promise<Farm | null> {
  return fetchAPI<Farm>('/farms/', {
    method: 'POST',
    body: JSON.stringify(farm)
  });
}

export async function getPrediction(params: Record<string, any> = {}): Promise<PredictionResponse | null> {
  const query = new URLSearchParams(params).toString();
  return fetchAPI<PredictionResponse>(`/predict/?${query}`);
}

export async function getDashboard(): Promise<DashboardData | null> {
  return fetchAPI<DashboardData>('/dashboard/');
}

export async function getClusters(): Promise<Cluster[]> {
  return (await fetchAPI<Cluster[]>('/clusters/')) || [];
}

export async function demoStep(session_id: string, day: number): Promise<DemoStepResponse | null> {
  return fetchAPI<DemoStepResponse>('/demo/step', {
    method: 'POST',
    body: JSON.stringify({ session_id, day })
  });
}

export async function whatIfAnalysis(data: any): Promise<WhatIfResponse | null> {
  return fetchAPI<WhatIfResponse>('/demo/what-if', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getDemoScenario(): Promise<DemoScenario | null> {
  return fetchAPI<DemoScenario>('/demo/scenario');
}

export async function getHealth(): Promise<HealthStatus | null> {
  return fetchAPI<HealthStatus>('/health');
}
