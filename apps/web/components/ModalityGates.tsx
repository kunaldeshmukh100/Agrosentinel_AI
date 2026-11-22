import React from 'react';
import { Image, CloudRain, Map, Satellite, History, Sprout } from 'lucide-react';

interface ModalityGatesType {
  image: number; weather: number; crop: number;
  geo: number; satellite: number; historical: number;
}

interface Props {
  gates: ModalityGatesType;
}

export default function ModalityGates({ gates }: Props) {
  const data = [
    { key: 'image', label: 'Image', value: gates.image, icon: <Image size={14}/> },
    { key: 'weather', label: 'Weather', value: gates.weather, icon: <CloudRain size={14}/> },
    { key: 'crop', label: 'Crop Info', value: gates.crop, icon: <Sprout size={14}/> },
    { key: 'geo', label: 'Geo/Topo', value: gates.geo, icon: <Map size={14}/> },
    { key: 'satellite', label: 'Satellite', value: gates.satellite, icon: <Satellite size={14}/> },
    { key: 'historical', label: 'Historical', value: gates.historical, icon: <History size={14}/> },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-300 mb-2">Multi-Modal Contributions</h4>
      {data.map(item => (
        <div key={item.key} className="flex items-center gap-2">
          <div className="text-slate-400 w-24 flex items-center gap-1.5 text-xs">
            {item.icon} {item.label}
          </div>
          <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.round(item.value * 100)}%` }}
            ></div>
          </div>
          <div className="w-8 text-right text-xs text-slate-400">
            {Math.round(item.value * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
}
