'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const RiskMap = dynamic(() => import('@/components/map/RiskMap'), { ssr: false })

const DEMO_CLUSTERS = [
  { id: 1, center_latitude: 20.05, center_longitude: 74.05, radius_km: 5.4, num_cases: 21, primary_disease: 'Late Blight', current_risk: 0.78, alert_level: 'RED', growth_rate: 3.2, first_observed: '2026-08-10' },
  { id: 2, center_latitude: 19.95, center_longitude: 73.95, radius_km: 2.1, num_cases: 6, primary_disease: 'Early Blight', current_risk: 0.45, alert_level: 'YELLOW', growth_rate: 1.1, first_observed: '2026-08-12' },
  { id: 3, center_latitude: 20.15, center_longitude: 74.15, radius_km: 1.2, num_cases: 3, primary_disease: 'Downy Mildew', current_risk: 0.28, alert_level: 'GREEN', growth_rate: 0.5, first_observed: '2026-08-13' },
]

const DEMO_FARMS = [
  { id: 1, name: 'Patil Tomato Farm', latitude: 20.02, longitude: 74.02, crop_type: 'Tomato', growth_stage: 'flowering', area_hectares: 2.5 },
  { id: 2, name: 'Sharma Wheat Farm', latitude: 20.08, longitude: 74.08, crop_type: 'Wheat', growth_stage: 'vegetative', area_hectares: 5.0 },
  { id: 3, name: 'Kulkarni Onion Field', latitude: 19.98, longitude: 73.98, crop_type: 'Onion', growth_stage: 'bulbing', area_hectares: 1.8 },
]

export default function MapPage() {
  const [clusters, setClusters] = useState(DEMO_CLUSTERS)
  const [farms, setFarms] = useState(DEMO_FARMS)
  const [activeLayers, setActiveLayers] = useState({ clusters: true, farms: true, heat: false, satellite: false })
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  useEffect(() => {
    // In a real app, this would be a fetch to /api/v1/clusters and /api/v1/farms
    setLastUpdated(new Date().toLocaleTimeString())
  }, [])

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#07110F] overflow-hidden">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-[#0D1917]/80 backdrop-blur-md px-6 py-3 rounded-full border border-[#5CFF8A]/20 shadow-lg">
        <div className="flex flex-col">
          <h1 className="text-[#5CFF8A] font-bold tracking-widest text-sm uppercase">LIVE RISK MAP</h1>
          <p className="text-[#8BA89E] text-xs">Nashik Agricultural Zone</p>
        </div>
        
        <div className="flex gap-2">
          {Object.keys(activeLayers).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer as keyof typeof activeLayers] }))}
              className={'px-4 py-1.5 rounded-full text-sm transition-all duration-300 capitalize ' + (
                activeLayers[layer as keyof typeof activeLayers] 
                ? 'bg-[#5CFF8A]/20 text-[#5CFF8A] border border-[#5CFF8A]/50' 
                : 'bg-[#10211E] text-[#8BA89E] border border-transparent hover:bg-white/5'
              )}
            >
              {layer}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[#8BA89E] text-xs font-mono">Updated: {lastUpdated}</span>
          <button className="bg-[#10211E] p-2 rounded-full border border-[#5CFF8A]/20 text-[#5CFF8A] hover:bg-[#5CFF8A]/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          </button>
        </div>
      </div>

      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <RiskMap 
          clusters={activeLayers.clusters ? clusters : []} 
          farms={activeLayers.farms ? farms : []} 
        />
      </div>

      {/* Right Sidebar */}
      <div className="absolute top-24 right-4 bottom-16 w-72 bg-[#10211E]/80 backdrop-blur-xl border border-white/5 rounded-2xl z-10 p-4 flex flex-col shadow-2xl">
        <h3 className="text-[#E8F5F0] font-semibold mb-4 border-b border-white/10 pb-2">Active Clusters ({clusters.length})</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {clusters.map(cluster => (
            <div key={cluster.id} className="bg-[#0D1917] p-3 rounded-xl border border-white/5 hover:border-[#5CFF8A]/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#E8F5F0] font-medium text-sm group-hover:text-[#5CFF8A] transition-colors">{cluster.primary_disease}</span>
                <span className={'text-xs px-2 py-0.5 rounded font-bold ' + (
                  cluster.alert_level === 'RED' ? 'bg-[#FF3B4E]/20 text-[#FF3B4E]' :
                  cluster.alert_level === 'ORANGE' ? 'bg-[#FF6B5B]/20 text-[#FF6B5B]' :
                  cluster.alert_level === 'YELLOW' ? 'bg-[#FFB547]/20 text-[#FFB547]' :
                  'bg-[#5CFF8A]/20 text-[#5CFF8A]'
                )}>{cluster.alert_level}</span>
              </div>
              <div className="flex gap-4 text-xs font-mono text-[#8BA89E]">
                <span>Risk: {(cluster.current_risk * 100).toFixed(0)}%</span>
                <span>Cases: {cluster.num_cases}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#0D1917] border-t border-white/5 z-20 flex justify-between items-center px-6 text-xs text-[#8BA89E] font-mono">
        <div className="flex gap-6">
          <span>Total Clusters: {clusters.length}</span>
          <span>Monitored Farms: {farms.length}</span>
          <span>Coverage: 120km²</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5CFF8A] animate-pulse"></span>
          LIVE DATA STREAM
        </div>
      </div>
    </div>
  )
}
