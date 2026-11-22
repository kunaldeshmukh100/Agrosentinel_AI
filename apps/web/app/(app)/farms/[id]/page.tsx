'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const DEMO_FARMS = [
  { id: 1, name: 'Patil Tomato Farm', latitude: 20.02, longitude: 74.02, crop_type: 'Tomato', growth_stage: 'flowering', area_hectares: 2.5, disease_probability: 0.78, alert_level: 'RED' },
  { id: 2, name: 'Sharma Wheat Farm', latitude: 20.08, longitude: 74.08, crop_type: 'Wheat', growth_stage: 'vegetative', area_hectares: 5.0, disease_probability: 0.22, alert_level: 'GREEN' },
  { id: 3, name: 'Kulkarni Onion Field', latitude: 19.98, longitude: 73.98, crop_type: 'Onion', growth_stage: 'bulbing', area_hectares: 1.8, disease_probability: 0.45, alert_level: 'YELLOW' },
  { id: 4, name: 'Desai Grapes Vineyard', latitude: 20.12, longitude: 74.12, crop_type: 'Grapes', growth_stage: 'fruiting', area_hectares: 8.2, disease_probability: 0.31, alert_level: 'GREEN' },
  { id: 5, name: 'Jadhav Rice Paddy', latitude: 19.92, longitude: 73.92, crop_type: 'Rice', growth_stage: 'tillering', area_hectares: 3.4, disease_probability: 0.67, alert_level: 'ORANGE' },
];

const cropIcons: Record<string, string> = {
  'Tomato': '🍅',
  'Wheat': '🌾',
  'Onion': '🧅',
  'Grapes': '🍇',
  'Rice': '🌾',
};

const alertColors: Record<string, string> = {
  'RED': '#FF3B4E',
  'ORANGE': '#FF6B5B',
  'YELLOW': '#FFB547',
  'GREEN': '#5CFF8A',
};

export default function FarmDetailsPage() {
  const { id } = useParams();
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => {
      const found = DEMO_FARMS.find(f => f.id === Number(id));
      setFarm(found);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return <div className="p-6 text-[#8BA89E] flex items-center justify-center min-h-[50vh]">Loading farm details...</div>;
  }

  if (!farm) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <div className="text-6xl mb-4">🌾</div>
        <h2 className="text-2xl font-bold text-[#E8F5F0] mb-2">Farm Not Found</h2>
        <p className="text-[#8BA89E] mb-6">The farm you are looking for does not exist or you don't have access.</p>
        <Link href="/farms" className="px-6 py-2 bg-[#5CFF8A]/10 text-[#5CFF8A] rounded-lg border border-[#5CFF8A]/20 hover:bg-[#5CFF8A]/20">
          Return to Farms
        </Link>
      </div>
    );
  }

  const riskHistory = [20, 25, 31, 45, 58, 72, 78]; // Demo percentages

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/farms" className="text-[#8BA89E] hover:text-[#E8F5F0] text-sm flex items-center gap-2 mb-2">
            ← Back to Farms
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#E8F5F0] tracking-tight">{farm.name}</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold tracking-wider" style={{ backgroundColor: `${alertColors[farm.alert_level]}15`, color: alertColors[farm.alert_level] }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alertColors[farm.alert_level] }} />
              {farm.alert_level}
            </div>
          </div>
          <p className="text-[#8BA89E] mt-1">Nashik, Maharashtra</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN - 60% (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Farm Profile */}
          <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 relative overflow-hidden">
             <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-4 border-b border-[#5CFF8A]/10 pb-2">Farm Profile</h2>
             <div className="grid grid-cols-2 gap-y-4 gap-x-8">
               <div>
                 <div className="text-xs text-[#8BA89E] mb-1">ID</div>
                 <div className="font-mono text-[#E8F5F0]">FRM-{farm.id.toString().padStart(4, '0')}</div>
               </div>
               <div>
                 <div className="text-xs text-[#8BA89E] mb-1">Crop Type</div>
                 <div className="text-[#E8F5F0] flex items-center gap-2">{cropIcons[farm.crop_type]} {farm.crop_type}</div>
               </div>
               <div>
                 <div className="text-xs text-[#8BA89E] mb-1">Growth Stage</div>
                 <div className="text-[#E8F5F0] capitalize bg-[#38D9FF]/10 text-[#38D9FF] px-2 py-0.5 rounded inline-block text-sm border border-[#38D9FF]/20">
                   {farm.growth_stage}
                 </div>
               </div>
               <div>
                 <div className="text-xs text-[#8BA89E] mb-1">Area</div>
                 <div className="text-[#E8F5F0] font-mono">{farm.area_hectares} hectares</div>
               </div>
               <div>
                 <div className="text-xs text-[#8BA89E] mb-1">Coordinates</div>
                 <div className="text-[#E8F5F0] font-mono">{farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E</div>
               </div>
               <div>
                 <div className="text-xs text-[#8BA89E] mb-1">Owner</div>
                 <div className="text-[#E8F5F0]">Registered Farmer</div>
               </div>
             </div>
          </div>

          {/* Risk History */}
          <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
            <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-4 border-b border-[#5CFF8A]/10 pb-2">Risk History (7 Days)</h2>
            <div className="h-48 flex items-end justify-between gap-2 pt-4">
              {riskHistory.map((val, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full bg-[#0D1917] rounded-t-sm relative h-full flex items-end">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-500 group-hover:opacity-80"
                      style={{ 
                        height: `${val}%`, 
                        backgroundColor: val > 70 ? alertColors['RED'] : val > 50 ? alertColors['ORANGE'] : val > 30 ? alertColors['YELLOW'] : alertColors['GREEN']
                      }}
                    />
                  </div>
                  <div className="text-xs text-[#8BA89E] font-mono group-hover:text-[#E8F5F0] transition-colors">{val}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Observations */}
          <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
            <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-4 border-b border-[#5CFF8A]/10 pb-2">Recent Observations</h2>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-[#0D1917] border border-[#5CFF8A]/5">
                   <div className="w-2 h-2 mt-1.5 rounded-full" style={{ backgroundColor: i === 1 ? alertColors['RED'] : alertColors['YELLOW'] }}></div>
                   <div className="flex-1">
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-sm font-medium text-[#E8F5F0]">Field Inspection</span>
                       <span className="text-xs text-[#8BA89E] font-mono">2026-08-{15-i}</span>
                     </div>
                     <p className="text-sm text-[#8BA89E]">Visible leaf curling on outer edges. Image submitted to model.</p>
                     <div className="text-xs text-[#FF3B4E] mt-2 font-mono">Prob: {78 - (i*5)}%</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - 40% (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Hero Risk Gauge */}
          <div className="glass-card p-8 rounded-xl border border-[#FF3B4E]/30 bg-gradient-to-b from-[#10211E] to-[#1a0f12] text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: alertColors[farm.alert_level] }} />
             <div className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-6">Current Risk Level</div>
             
             <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
                 <circle cx="96" cy="96" r="80" fill="none" stroke="#0D1917" strokeWidth="16" />
                 <circle cx="96" cy="96" r="80" fill="none" stroke={alertColors[farm.alert_level]} strokeWidth="16" strokeDasharray={`${Math.round((farm.disease_probability * 100) / 100 * 502)} 502`} className="transition-all duration-1000 ease-out" />
               </svg>
               <div className="flex flex-col items-center">
                 <span className="text-5xl font-mono font-bold text-[#E8F5F0]">{Math.round(farm.disease_probability * 100)}%</span>
               </div>
             </div>
             
             <div className="text-xl font-bold mb-2" style={{ color: alertColors[farm.alert_level] }}>{farm.alert_level} RISK</div>
             <div className="text-[#8BA89E] text-sm flex items-center justify-center gap-2">
               <span className="text-[#FF3B4E]">↑ +6%</span> vs last week
             </div>
          </div>

          {/* Forecast */}
          <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
            <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-4 border-b border-[#5CFF8A]/10 pb-2">AI Forecast</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-[#0D1917]">
                <span className="text-sm text-[#E8F5F0]">+3 Days</span>
                <span className="font-mono text-[#FF3B4E] font-medium">82%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#0D1917]">
                <span className="text-sm text-[#E8F5F0]">+5 Days</span>
                <span className="font-mono text-[#FF3B4E] font-medium">87%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#0D1917]">
                <span className="text-sm text-[#E8F5F0]">+7 Days</span>
                <span className="font-mono text-[#FF3B4E] font-medium">89%</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="glass-card p-6 rounded-xl border border-[#38D9FF]/20 bg-[#10211E]/80 relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#38D9FF] animate-pulse" />
              <h2 className="text-[#38D9FF] text-sm font-bold uppercase tracking-wider">AI RECOMMENDATION</h2>
            </div>
            
            <h3 className="text-lg font-semibold text-[#E8F5F0] mb-2">Immediate Action Required</h3>
            <p className="text-sm text-[#8BA89E] mb-4">This farm shows {Math.round(farm.disease_probability * 100)}% outbreak risk. Based on current conditions:</p>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-[#E8F5F0]">
                <span className="text-[#38D9FF] mt-0.5">•</span> Inspect neighboring farms within 5km
              </li>
              <li className="flex items-start gap-2 text-sm text-[#E8F5F0]">
                <span className="text-[#38D9FF] mt-0.5">•</span> Apply preventive fungicide treatment
              </li>
              <li className="flex items-start gap-2 text-sm text-[#E8F5F0]">
                <span className="text-[#38D9FF] mt-0.5">•</span> Report to District Agricultural Officer
              </li>
              <li className="flex items-start gap-2 text-sm text-[#E8F5F0]">
                <span className="text-[#38D9FF] mt-0.5">•</span> Monitor daily for 7 days
              </li>
            </ul>

            <button className="w-full py-3 bg-[#38D9FF]/10 text-[#38D9FF] font-medium rounded-lg border border-[#38D9FF]/20 hover:bg-[#38D9FF]/20 transition-colors flex items-center justify-center gap-2">
              <span>🔔</span> Send Alert to Officer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
