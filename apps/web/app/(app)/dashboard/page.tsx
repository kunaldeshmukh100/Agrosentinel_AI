'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DEMO_DASHBOARD = {
  total_farms: 500,
  active_observations: 73,
  active_clusters: 3,
  high_risk_farms: 21,
  clusters: [
    { id: 1, center_latitude: 20.05, center_longitude: 74.05, radius_km: 5.4, num_cases: 21, primary_disease: 'Late Blight', current_risk: 0.78, alert_level: 'RED', growth_rate: 3.2 },
    { id: 2, center_latitude: 19.95, center_longitude: 73.95, radius_km: 2.1, num_cases: 6, primary_disease: 'Early Blight', current_risk: 0.45, alert_level: 'YELLOW', growth_rate: 1.1 },
  ]
};

const DEMO_RISK = { current_risk: 0.78, future_risk_3d: 0.82, future_risk_7d: 0.89, alert_level: 'RED', predicted_disease: 'Late Blight (Phytophthora infestans)', spread_probability: 0.71 };

const DEMO_TIMELINE = [
  { day: 1, cases: 3, risk: 0.22, alert: 'GREEN' },
  { day: 2, cases: 9, risk: 0.38, alert: 'YELLOW' },
  { day: 3, cases: 21, risk: 0.61, alert: 'ORANGE' },
  { day: 4, cases: 42, risk: 0.78, alert: 'RED' },
  { day: 5, cases: 73, risk: 0.89, alert: 'RED' },
];

const FACTORS = [
  { label: 'High Humidity', value: 23 },
  { label: 'Nearby Cases', value: 19 },
  { label: 'Crop Stage', value: 12 },
  { label: 'Recent Rainfall', value: 9 },
  { label: 'Satellite Anomaly', value: 7 },
];

const COLORS = {
  bg: '#07110F',
  surface: '#0D1917',
  card: '#10211E',
  primary: '#5CFF8A',
  secondary: '#38D9FF',
  warning: '#FFB547',
  highRisk: '#FF6B5B',
  critical: '#FF3B4E',
  text: '#E8F5F0',
  textMuted: '#8BA89E',
  border: 'rgba(92, 255, 138, 0.1)'
};

// Map Component Placeholder (Usually imported dynamically)
const RiskMapPlaceholder = () => (
  <div className="w-full h-full min-h-[400px] flex items-center justify-center rounded-xl border relative overflow-hidden" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
    <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(92, 255, 138, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(92, 255, 138, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
    <div className="absolute w-full h-[2px] bg-[#5CFF8A] shadow-[0_0_10px_#5CFF8A] opacity-50 scanner" style={{ top: 0 }}></div>
    <div className="text-center z-10" style={{ color: COLORS.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 animate-pulse">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>INITIALIZING GEO-SPATIAL RENDERER...</p>
      <p className="text-xs mt-2 opacity-50">Loading cluster data</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate API fetch
    setTimeout(() => {
      setData({ dashboard: DEMO_DASHBOARD, risk: DEMO_RISK, timeline: DEMO_TIMELINE });
      setIsDemo(true);
    }, 800);
  }, []);

  if (!mounted) return null;

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return COLORS.primary;
    if (risk < 0.55) return COLORS.warning;
    if (risk < 0.75) return '#FF9500'; // Orange
    return COLORS.critical;
  };

  const riskPercent = data ? Math.round(data.risk.current_risk * 100) : 0;
  const riskColor = getRiskColor(data ? data.risk.current_risk : 0);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (riskPercent / 100) * circumference;

  return (
    <div className="min-h-screen p-6 font-sans text-sm" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <div>
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-3">
            AGROSENTINEL COMMAND CENTER
            {isDemo && <span className="px-2 py-1 text-[10px] rounded border" style={{ backgroundColor: 'rgba(255,181,71,0.1)', borderColor: COLORS.warning, color: COLORS.warning }}>DEMO DATA</span>}
          </h1>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Nashik Agricultural Intelligence Zone • Last updated: just now</p>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Farms Monitored', value: data?.dashboard.total_farms || 0, color: COLORS.primary },
          { label: 'Active Cases', value: data?.dashboard.active_observations || 0, color: COLORS.warning },
          { label: 'Active Clusters', value: data?.dashboard.active_clusters || 0, color: '#FF9500' },
          { label: 'High Risk', value: data?.dashboard.high_risk_farms || 0, color: COLORS.critical },
          { label: 'Forecast Horizon', value: '7 days', color: COLORS.secondary },
        ].map((metric, i) => (
          <div key={i} className="p-4 rounded-xl border flex flex-col justify-between backdrop-blur-md animate-fade-in-up" 
               style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{metric.label}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl" style={{ fontFamily: 'JetBrains Mono, monospace', color: metric.color }}>{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="h-[400px]">
            <RiskMapPlaceholder />
          </div>

          <div className="p-6 rounded-xl border backdrop-blur-md" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: COLORS.textMuted }}>Outbreak Progression Timeline</h3>
            <div className="flex justify-between items-end h-[100px] relative">
              {/* Line connector */}
              <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 z-0" style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.warning}, ${COLORS.critical})`, opacity: 0.3 }}></div>
              
              {data?.timeline.map((pt: any, i: number) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2 group animate-fade-in-up" style={{ animationDelay: `${0.4 + i * 0.1}s`, animationFillMode: 'both' }}>
                  <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.textMuted }}>DAY {pt.day}</span>
                  <div className="w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-150" 
                       style={{ backgroundColor: COLORS.bg, borderColor: getRiskColor(pt.risk), boxShadow: `0 0 10px ${getRiskColor(pt.risk)}` }}></div>
                  <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.text }}>{pt.cases} cases</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Risk Gauge */}
          <div className="p-6 rounded-xl border flex flex-col items-center justify-center backdrop-blur-md animate-fade-in-up" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, animationDelay: '0.2s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 self-start" style={{ color: COLORS.textMuted }}>Outbreak Risk</h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke={COLORS.surface} strokeWidth="12" />
                <circle 
                  cx="100" cy="100" r="90" 
                  fill="none" 
                  stroke={riskColor} 
                  strokeWidth="12" 
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: circumference, 
                    strokeDashoffset: mounted ? strokeDashoffset : circumference,
                    transition: 'stroke-dashoffset 1.2s ease-out'
                  }} 
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-4xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.text }}>{riskPercent}%</span>
                <span className="text-xs font-bold tracking-widest mt-1" style={{ color: riskColor }}>HIGH RISK</span>
              </div>
            </div>
            <div className="mt-4 text-xs" style={{ color: COLORS.textMuted }}>
              Trend: <span style={{ color: COLORS.critical }}>▲ +14% in 24h</span>
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="p-6 rounded-xl border backdrop-blur-md animate-fade-in-up" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>AI Outbreak Analysis</h3>
              <span className="text-[10px] flex items-center gap-2 uppercase tracking-widest" style={{ color: COLORS.primary }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span> Analysis Complete
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Disease Confidence', val: 82, color: COLORS.primary },
                { label: 'Environmental Risk', val: 74, color: COLORS.warning },
                { label: 'Spatial Risk', val: 88, color: COLORS.critical },
                { label: 'Forecast Risk 7d', val: 89, color: COLORS.critical },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-32 text-xs" style={{ color: COLORS.textMuted }}>{item.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surface }}>
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: mounted ? `${item.val}%` : '0%', backgroundColor: item.color }}></div>
                  </div>
                  <span className="w-8 text-right text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Bars */}
          <div className="p-6 rounded-xl border backdrop-blur-md animate-fade-in-up" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, animationDelay: '0.4s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: COLORS.textMuted }}>Why the AI is Warning</h3>
            <div className="flex flex-col gap-3">
              {FACTORS.map((f, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: COLORS.textMuted }}>{f.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surface }}>
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                         style={{ 
                           width: mounted ? `${f.value / 25 * 100}%` : '0%', 
                           background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.highRisk})` 
                         }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Clusters */}
          <div className="p-6 rounded-xl border backdrop-blur-md animate-fade-in-up" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, animationDelay: '0.5s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: COLORS.textMuted }}>Active Clusters</h3>
            <div className="flex flex-col gap-3">
              {data?.dashboard.clusters.map((c: any) => (
                <div key={c.id} className="p-3 rounded border flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" style={{ backgroundColor: COLORS.surface, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-[10px] rounded bg-white/10" style={{ fontFamily: 'JetBrains Mono, monospace', color: COLORS.textMuted }}>ID-{c.id}</span>
                    <div>
                      <p className="text-sm font-semibold">{c.primary_disease}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>Risk: {Math.round(c.current_risk * 100)}%</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded border" 
                        style={{ color: c.alert_level === 'RED' ? COLORS.critical : COLORS.warning, borderColor: 'currentColor', backgroundColor: c.alert_level === 'RED' ? 'rgba(255,59,78,0.1)' : 'rgba(255,181,71,0.1)' }}>
                    {c.alert_level}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .scanner {
          animation: scan 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
