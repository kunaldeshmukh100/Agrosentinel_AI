'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const RiskMap = dynamic(() => import('@/components/map/RiskMap'), { ssr: false })

const DEMO_CLUSTERS = [
  { id: 1, center_latitude: 20.05, center_longitude: 74.05, radius_km: 5.4, num_cases: 21, primary_disease: 'Late Blight', current_risk: 0.78, alert_level: 'RED', growth_rate: 3.2, first_observed: '2026-08-10', disease_info: 'Fungal disease affecting potato and tomato plants, causing rapid decay.' },
  { id: 2, center_latitude: 19.95, center_longitude: 73.95, radius_km: 2.1, num_cases: 6, primary_disease: 'Early Blight', current_risk: 0.45, alert_level: 'YELLOW', growth_rate: 1.1, first_observed: '2026-08-12', disease_info: 'Fungal disease characterized by dark rings on older leaves.' },
  { id: 3, center_latitude: 20.15, center_longitude: 74.15, radius_km: 1.2, num_cases: 3, primary_disease: 'Downy Mildew', current_risk: 0.28, alert_level: 'GREEN', growth_rate: 0.5, first_observed: '2026-08-13', disease_info: 'Oomycete disease thriving in cool, wet conditions.' },
]

const DEMO_RISK_TIMELINE = [
  { day: '-4d', risk: 20 },
  { day: '-3d', risk: 28 },
  { day: '-2d', risk: 45 },
  { day: '-1d', risk: 62 },
  { day: 'Today', risk: 78 },
]

export default function OutbreaksPage() {
  const [selectedCluster, setSelectedCluster] = useState(DEMO_CLUSTERS[0])

  return (
    <div className="min-h-screen bg-[#07110F] text-[#E8F5F0] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5CFF8A] to-[#38D9FF] bg-clip-text text-transparent">OUTBREAK INTELLIGENCE</h1>
        <p className="text-[#8BA89E] mt-1">Active disease cluster monitoring and analysis</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Clusters', value: 3, color: '#38D9FF' },
          { label: 'Critical', value: 1, color: '#FF3B4E' },
          { label: 'Expanding', value: 2, color: '#FFB547' },
          { label: 'Contained', value: 0, color: '#5CFF8A' },
        ].map((metric) => (
          <div key={metric.label} className="bg-[#10211E] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-[#8BA89E] text-sm font-medium">{metric.label}</span>
            <span className="text-2xl font-bold" style={{ color: metric.color }}>{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Cluster Cards */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold mb-4 text-[#8BA89E]">Active Clusters</h2>
          
          {DEMO_CLUSTERS.map((cluster) => {
            const isSelected = selectedCluster.id === cluster.id
            const color = cluster.alert_level === 'RED' ? '#FF3B4E' : cluster.alert_level === 'YELLOW' ? '#FFB547' : '#5CFF8A'
            
            return (
              <div 
                key={cluster.id} 
                onClick={() => setSelectedCluster(cluster)}
                className={'bg-[#0D1917] p-5 rounded-2xl border transition-all duration-300 cursor-pointer ' + (isSelected ? 'border-[#5CFF8A]/50 shadow-[0_0_20px_rgba(92,255,138,0.1)]' : 'border-white/5 hover:border-white/20')}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10211E" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={(cluster.current_risk * 100) + ', 100'} />
                      </svg>
                      <span className="absolute text-[10px] font-mono">{Math.round(cluster.current_risk * 100)}%</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">CLUSTER #{String(cluster.id).padStart(3, '0')}</h3>
                      <p className="text-[#8BA89E] text-sm">{cluster.primary_disease}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border" style={{ borderColor: color + '40', color }}>
                    {cluster.alert_level}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm font-mono text-[#8BA89E] mb-4 bg-[#10211E] p-3 rounded-lg">
                  <div><span className="text-[#E8F5F0] block">{cluster.num_cases}</span> cases</div>
                  <div><span className="text-[#E8F5F0] block">{cluster.radius_km} km</span> radius</div>
                  <div><span className="text-[#FF3B4E] block">+{cluster.growth_rate}</span> cases/day</div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8BA89E]">Observed: {cluster.first_observed} · Growing ↑</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-lg bg-[#5CFF8A]/10 text-[#5CFF8A] hover:bg-[#5CFF8A]/20 transition-colors text-xs font-semibold">View Details</button>
                    <button className="px-4 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-xs">Alert Farmers</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* RIGHT COLUMN: Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#10211E] rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full sticky top-4">
            {/* Mini Map */}
            <div className="h-64 relative border-b border-white/5">
              <RiskMap clusters={[selectedCluster]} showControls={false} />
              <div className="absolute top-2 left-2 z-[1000] bg-black/50 backdrop-blur text-xs px-2 py-1 rounded border border-white/10 font-mono">
                Centered on Cluster #{selectedCluster.id}
              </div>
            </div>
            
            {/* Detail Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-xl font-bold mb-1">{selectedCluster.primary_disease}</h3>
              <p className="text-[#8BA89E] text-sm mb-6">{selectedCluster.disease_info}</p>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#8BA89E] mb-4 uppercase tracking-wider">Risk Timeline</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={DEMO_RISK_TIMELINE}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedCluster.alert_level === 'RED' ? '#FF3B4E' : '#FFB547'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={selectedCluster.alert_level === 'RED' ? '#FF3B4E' : '#FFB547'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ backgroundColor: '#0D1917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="risk" stroke={selectedCluster.alert_level === 'RED' ? '#FF3B4E' : '#FFB547'} fillOpacity={1} fill="url(#colorRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-[#0D1917] p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-semibold text-[#5CFF8A] mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  AI Recommendation
                </h4>
                <p className="text-sm text-[#8BA89E] leading-relaxed">
                  Cluster exhibits aggressive expansion (+3.2 cases/day). Recommend immediate targeted fungicidal application within a 6km radius. Notify 18 vulnerable farms in the vector path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
