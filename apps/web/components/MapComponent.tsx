// @ts-nocheck
'use client'
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Observation, Cluster } from '@/lib/types';
import L from 'leaflet';

// Fix leaflet icon issues in nextjs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  observations: Observation[];
  clusters: Cluster[];
  center: [number, number];
}

export default function MapComponent({ observations, clusters, center }: Props) {
  return (
    <MapContainer center={center} zoom={11} className="w-full h-full" zoomControl={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
      />
      
      {clusters.map((cluster, i) => (
        <Circle
          key={`cluster-${i}`}
          center={[cluster.latitude, cluster.longitude]}
          radius={cluster.radius * 1000} // Assuming radius in km
          pathOptions={{
            color: cluster.alert_level === 'RED' ? '#ef4444' : cluster.alert_level === 'ORANGE' ? '#f97316' : '#eab308',
            fillColor: cluster.alert_level === 'RED' ? '#ef4444' : cluster.alert_level === 'ORANGE' ? '#f97316' : '#eab308',
            fillOpacity: 0.2,
            weight: 2
          }}
        >
          <Popup>
            <div className="text-slate-900 font-sans">
              <strong>Cluster {cluster.id.substring(0,6)}</strong><br/>
              Disease: {cluster.disease}<br/>
              Cases: {cluster.case_count}<br/>
              Risk: {(cluster.avg_risk*100).toFixed(1)}%
            </div>
          </Popup>
        </Circle>
      ))}

      {observations.map((obs, i) => {
        // Need farm lat/lon from observation in real app, mock it for demo
        const lat = 20.0 + (Math.random() - 0.5) * 0.2;
        const lon = 74.0 + (Math.random() - 0.5) * 0.2;
        const isHealthy = obs.alert_level === 'GREEN';
        
        return (
          <CircleMarker
            key={`obs-${i}`}
            center={[lat, lon]}
            radius={isHealthy ? 4 : 6 + (obs.risk_score * 4)}
            pathOptions={{
              color: isHealthy ? '#22c55e' : '#ef4444',
              fillColor: isHealthy ? '#22c55e' : '#ef4444',
              fillOpacity: 0.7,
              weight: 1
            }}
          >
            <Popup>
              <div className="text-slate-900">
                <strong>Farm {obs.farm_id}</strong><br/>
                Status: {obs.disease_detected || 'Healthy'}<br/>
                Risk: {(obs.risk_score*100).toFixed(1)}%
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
