'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet marker icon issue on Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

export interface Cluster {
  id: number
  center_latitude: number
  center_longitude: number
  radius_km: number
  num_cases: number
  primary_disease: string
  current_risk: number
  alert_level: string
  growth_rate: number
  first_observed: string
}

export interface Farm {
  id: number
  name: string
  latitude: number
  longitude: number
  crop_type: string
  growth_stage: string
  area_hectares: number
}

interface RiskMapProps {
  clusters?: Cluster[]
  farms?: Farm[]
  height?: string
  showControls?: boolean
  onClusterClick?: (cluster: Cluster) => void
}

const COLOR_MAP: Record<string, string> = {
  GREEN: 'rgba(92,255,138,1)',
  YELLOW: 'rgba(255,181,71,1)',
  ORANGE: 'rgba(255,107,91,1)',
  RED: 'rgba(255,59,78,1)',
}

const PULSE_ICON = new L.DivIcon({
  className: 'pulse-marker-wrapper',
  html: `
    <div class="pulse-marker" style="position: relative; width: 24px; height: 24px;">
      <div class="pulse-ring" style="position: absolute; top: -12px; left: -12px; width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(255,59,78,0.8); animation: pulse-ring 2s ease-out infinite;"></div>
      <div class="pulse-dot" style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: rgba(255,59,78,1);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

export default function RiskMap({
  clusters = [],
  farms = [],
  height = '100%',
  showControls = true,
  onClusterClick,
}: RiskMapProps) {
  useEffect(() => {
    // Inject custom animation styles if they don't exist
    if (!document.getElementById('leaflet-pulse-styles')) {
      const style = document.createElement('style')
      style.id = 'leaflet-pulse-styles'
      style.innerHTML = `
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .dark-popup .leaflet-popup-content-wrapper {
          background: #10211E;
          color: #E8F5F0;
          border: 1px solid rgba(92,255,138,0.2);
          border-radius: 8px;
        }
        .dark-popup .leaflet-popup-tip {
          background: #10211E;
          border-top: 1px solid rgba(92,255,138,0.2);
          border-left: 1px solid rgba(92,255,138,0.2);
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer center={[20.0, 74.0]} zoom={10} style={{ height: '100%', width: '100%', backgroundColor: '#07110F' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {farms.map((farm) => (
          <CircleMarker
            key={'farm-' + farm.id}
            center={[farm.latitude, farm.longitude]}
            radius={4}
            color="#38D9FF"
            fillColor="#38D9FF"
            fillOpacity={0.6}
            weight={1}
          >
            <Popup className="dark-popup">
              <div className="p-2 min-w-[150px]">
                <h4 className="font-bold text-[#38D9FF] text-lg mb-1">{farm.name}</h4>
                <p className="text-sm">Crop: <span className="text-[#E8F5F0]">{farm.crop_type}</span></p>
                <p className="text-sm">Stage: <span className="text-[#E8F5F0]">{farm.growth_stage}</span></p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {clusters.map((cluster) => {
          const color = COLOR_MAP[cluster.alert_level] || COLOR_MAP.GREEN
          return (
            <>
              <Circle
                key={'cluster-circle-' + cluster.id}
                center={[cluster.center_latitude, cluster.center_longitude]}
                radius={cluster.radius_km * 1000}
                color={color}
                fillColor={color}
                fillOpacity={0.08}
                weight={2}
                opacity={0.3}
              />
              
              {cluster.alert_level === 'RED' ? (
                <Marker
                  key={'cluster-marker-' + cluster.id}
                  position={[cluster.center_latitude, cluster.center_longitude]}
                  icon={PULSE_ICON}
                  eventHandlers={{ click: () => onClusterClick?.(cluster) }}
                >
                  <Popup className="dark-popup">
                    <ClusterPopupContent cluster={cluster} color={color} />
                  </Popup>
                </Marker>
              ) : (
                <CircleMarker
                  key={'cluster-cm-' + cluster.id}
                  center={[cluster.center_latitude, cluster.center_longitude]}
                  radius={Math.max(8, Math.min(cluster.num_cases * 1.5, 30))}
                  color={color}
                  fillColor={color}
                  fillOpacity={0.8}
                  weight={2}
                  eventHandlers={{ click: () => onClusterClick?.(cluster) }}
                >
                  <Popup className="dark-popup">
                    <ClusterPopupContent cluster={cluster} color={color} />
                  </Popup>
                </CircleMarker>
              )}
            </>
          )
        })}
      </MapContainer>

      {showControls && (
        <div className="absolute bottom-6 right-6 z-[1000] bg-[#10211E]/90 backdrop-blur-md p-4 rounded-lg border border-[#5CFF8A]/20 shadow-xl">
          <h4 className="text-[#E8F5F0] text-sm font-bold mb-3 uppercase tracking-wider">Risk Levels</h4>
          <div className="space-y-2">
            {[
              { label: 'Critical (Red)', color: COLOR_MAP.RED },
              { label: 'High (Orange)', color: COLOR_MAP.ORANGE },
              { label: 'Moderate (Yellow)', color: COLOR_MAP.YELLOW },
              { label: 'Low (Green)', color: COLOR_MAP.GREEN },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: '0 0 8px ' + item.color }}></div>
                <span className="text-sm text-[#8BA89E] font-mono">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ClusterPopupContent({ cluster, color }: { cluster: Cluster; color: string }) {
  return (
    <div className="p-2 min-w-[200px]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-lg" style={{ color }}>Cluster #{cluster.id}</h4>
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10" style={{ color }}>{cluster.alert_level}</span>
      </div>
      <p className="text-sm text-[#E8F5F0] mb-2 font-semibold">{cluster.primary_disease}</p>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>
          <span className="text-[#8BA89E] block">Cases</span>
          <span className="text-[#E8F5F0] text-sm font-mono">{cluster.num_cases}</span>
        </div>
        <div>
          <span className="text-[#8BA89E] block">Risk</span>
          <span className="text-[#E8F5F0] text-sm font-mono">{(cluster.current_risk * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-[#8BA89E] block">Growth Rate</span>
          <span className="text-[#E8F5F0] text-sm font-mono">+{cluster.growth_rate}/day</span>
        </div>
        <div>
          <span className="text-[#8BA89E] block">Radius</span>
          <span className="text-[#E8F5F0] text-sm font-mono">{cluster.radius_km} km</span>
        </div>
      </div>
      <p className="text-[#8BA89E] text-xs">First observed: {cluster.first_observed}</p>
    </div>
  )
}
