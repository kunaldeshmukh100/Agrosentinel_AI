'use client'

import { useState } from 'react'

const DEMO_ALERTS = [
  {
    id: 1, level: 'CRITICAL', title: 'Outbreak Cluster Expanding Rapidly',
    location: 'Nashik — Northeast Quadrant', cases: 21, radius_km: 5.4,
    forecast_risk: 0.87, disease: 'Late Blight', farms_affected: 18,
    timestamp: '12 min ago', description: 'DBSCAN clustering detected high-density disease spread. Growth rate: 3.2 cases/day.'
  },
  {
    id: 2, level: 'HIGH', title: 'New Disease Cases in Cluster Zone',
    location: 'Nashik — Central Region', cases: 6, radius_km: 2.1,
    forecast_risk: 0.45, disease: 'Early Blight', farms_affected: 5,
    timestamp: '1 hr ago', description: 'Secondary cluster forming. Monitor closely.'
  },
  {
    id: 3, level: 'MODERATE', title: 'Weather Conditions Favorable for Spread',
    location: 'Nashik Region', cases: 0, radius_km: 0,
    forecast_risk: 0.38, disease: 'Multiple', farms_affected: 0,
    timestamp: '3 hr ago', description: 'Humidity at 82%. Temperature optimal for Late Blight.'
  },
  {
    id: 4, level: 'INFO', title: 'Satellite Data Synchronized',
    location: 'All zones', cases: 0, radius_km: 0,
    forecast_risk: 0, disease: 'N/A', farms_affected: 0,
    timestamp: '6 hr ago', description: 'NDVI data updated. Vegetation anomaly detected in Zone 3.'
  },
]

const TABS = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'INFO']

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState('ALL')

  const filteredAlerts = DEMO_ALERTS.filter(alert => activeTab === 'ALL' || alert.level === activeTab)

  return (
    <div className="min-h-screen bg-[#07110F] text-[#E8F5F0] p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FFB547] to-[#FF3B4E] bg-clip-text text-transparent mb-2">ALERT CENTER</h1>
        <p className="text-[#8BA89E]">Active warnings and real-time notifications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? 'px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-[#5CFF8A]/10 text-[#5CFF8A] border border-[#5CFF8A]/50 shadow-[0_0_15px_rgba(92,255,138,0.15)]'
                : 'px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-[#10211E] text-[#8BA89E] border border-white/5 hover:bg-white/5 hover:border-white/20'
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[#10211E] rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#5CFF8A]/10 rounded-full flex items-center justify-center mb-4 text-[#5CFF8A]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 className="text-xl font-medium text-[#E8F5F0] mb-2">All Clear</h3>
            <p className="text-[#8BA89E]">No alerts matching the selected criteria.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const COLOR_LOOKUP: Record<string, { border: string; bg: string; text: string }> = {
              CRITICAL: { border: '#FF3B4E', bg: 'bg-[#FF3B4E]/10', text: 'text-[#FF3B4E]' },
              HIGH:     { border: '#FF6B5B', bg: 'bg-[#FF6B5B]/10', text: 'text-[#FF6B5B]' },
              MODERATE: { border: '#FFB547', bg: 'bg-[#FFB547]/10', text: 'text-[#FFB547]' },
              INFO:     { border: '#38D9FF', bg: 'bg-[#38D9FF]/10', text: 'text-[#38D9FF]' },
            }
            const colors = COLOR_LOOKUP[alert.level] || COLOR_LOOKUP['INFO']

            return (
              <div 
                key={alert.id}
                className="bg-[#10211E] rounded-xl p-6 flex flex-col md:flex-row gap-6 border border-white/5 relative overflow-hidden group hover:bg-[#152825] transition-colors"
              >
                {/* Accent Border */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: colors.border }}></div>
                
                <div className="flex-1 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-[#E8F5F0]">{alert.title}</h3>
                    <span className={'px-3 py-1 rounded-full text-xs font-bold ' + colors.bg + ' ' + colors.text + ' border border-current/20'}>
                      {alert.level}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-[#8BA89E] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {alert.location}
                  </div>
                  
                  <p className="text-[#E8F5F0]/80 text-sm mb-6 leading-relaxed max-w-3xl">
                    {alert.description}
                  </p>
                  
                  {alert.cases > 0 && (
                    <div className="flex flex-wrap gap-4 text-xs font-mono bg-[#0D1917] p-3 rounded-lg border border-white/5 inline-flex mb-6">
                      <div className="flex flex-col"><span className="text-[#8BA89E] mb-1">Cases</span><span className="text-white">{alert.cases}</span></div>
                      <div className="flex flex-col"><span className="text-[#8BA89E] mb-1">Radius</span><span className="text-white">{alert.radius_km} km</span></div>
                      <div className="flex flex-col"><span className="text-[#8BA89E] mb-1">Farms Affected</span><span className="text-[#FFB547]">{alert.farms_affected}</span></div>
                      <div className="flex flex-col"><span className="text-[#8BA89E] mb-1">Forecast Risk</span><span className="text-[#FF3B4E]">{Math.round(alert.forecast_risk * 100)}%</span></div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs text-[#8BA89E]">{alert.timestamp}</span>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 transition-colors text-white">Acknowledge</button>
                      <button className="px-4 py-2 rounded-lg text-xs font-medium border border-white/10 hover:border-white/30 transition-colors text-white">Notify Farmers</button>
                      <button className="px-4 py-2 rounded-lg text-xs font-medium bg-[#38D9FF]/10 text-[#38D9FF] hover:bg-[#38D9FF]/20 transition-colors">View on Map</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
