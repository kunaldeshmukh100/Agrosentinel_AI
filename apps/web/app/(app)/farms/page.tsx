'use client'

import React, { useState, useEffect } from 'react';
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

export default function FarmsPage() {
  const [farms, setFarms] = useState(DEMO_FARMS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Fetch farms
    const fetchFarms = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/v1/farms/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setFarms(data);
        }
      } catch (err) {
        console.error('Failed to fetch farms, using demo data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, []);

  const filteredFarms = farms.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.crop_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || 
      (filter === 'HIGH RISK' && (f.alert_level === 'RED' || f.alert_level === 'ORANGE')) ||
      (filter === f.crop_type.toUpperCase());
    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.disease_probability - a.disease_probability);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#E8F5F0] mb-2 tracking-tight">FARM INTELLIGENCE</h1>
        <p className="text-[#8BA89E]">Crop monitoring and disease risk by farm</p>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 backdrop-blur-md relative overflow-hidden group hover:border-[#5CFF8A]/30 transition-all">
           <div className="text-[#8BA89E] mb-1">Total Farms Monitored</div>
           <div className="text-4xl font-mono text-[#5CFF8A]">500</div>
        </div>
        <div className="glass-card p-6 rounded-xl border border-[#FF3B4E]/20 bg-[#10211E]/80 backdrop-blur-md relative overflow-hidden group hover:border-[#FF3B4E]/40 transition-all">
           <div className="text-[#8BA89E] mb-1">High Risk Farms</div>
           <div className="text-4xl font-mono text-[#FF3B4E]">21</div>
        </div>
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 backdrop-blur-md relative overflow-hidden group hover:border-[#5CFF8A]/30 transition-all">
           <div className="text-[#8BA89E] mb-1">Healthy Farms</div>
           <div className="text-4xl font-mono text-[#5CFF8A]">432</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <input 
          type="text" 
          placeholder="Search farm or crop..." 
          className="bg-[#0D1917] border border-[#5CFF8A]/20 text-[#E8F5F0] px-4 py-2 rounded-lg focus:outline-none focus:border-[#5CFF8A] w-full md:w-64"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['ALL', 'HIGH RISK', 'TOMATO', 'WHEAT', 'OTHER'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filter === f ? 'bg-[#5CFF8A]/20 text-[#5CFF8A] border border-[#5CFF8A]/50' : 'bg-[#10211E] text-[#8BA89E] border border-transparent hover:text-[#E8F5F0]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-[#8BA89E]">Loading farms...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map(farm => (
            <div key={farm.id} className="glass-card rounded-xl border border-[#5CFF8A]/10 bg-[#10211E] overflow-hidden flex flex-col relative group hover:border-[#5CFF8A]/30 transition-all hover:transform hover:-translate-y-1">
              <div 
                className="absolute left-0 top-0 bottom-0 w-1" 
                style={{ backgroundColor: alertColors[farm.alert_level] }}
              />
              <div className="p-5 pl-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-[#E8F5F0] flex items-center gap-2">
                    <span className="text-xl">{cropIcons[farm.crop_type] || '🌱'}</span>
                    {farm.name}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold tracking-wider" style={{ backgroundColor: `${alertColors[farm.alert_level]}15`, color: alertColors[farm.alert_level] }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: alertColors[farm.alert_level] }} />
                    {farm.alert_level}
                  </div>
                </div>
                
                <p className="text-sm text-[#8BA89E] mb-4">
                  {farm.crop_type} · <span className="capitalize">{farm.growth_stage}</span> Stage
                </p>

                <div className="space-y-3 mb-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8BA89E]">Disease Probability</span>
                      <span className="font-mono text-[#E8F5F0]">{Math.round(farm.disease_probability * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#07110F] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${farm.disease_probability * 100}%`,
                          backgroundColor: alertColors[farm.alert_level]
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#8BA89E] pt-2 border-t border-[#5CFF8A]/5">
                    <div>Area: <span className="text-[#E8F5F0]">{farm.area_hectares} ha</span></div>
                    <div>GPS: <span className="font-mono text-[#E8F5F0]">{farm.latitude.toFixed(2)}°N, {farm.longitude.toFixed(2)}°E</span></div>
                    <div className="col-span-2">Last observation: <span className="text-[#E8F5F0]">Today</span></div>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <Link href={`/farms/${farm.id}`} className="flex-1 bg-[#5CFF8A]/10 text-[#5CFF8A] hover:bg-[#5CFF8A]/20 transition-colors py-2 rounded text-center text-sm font-medium border border-[#5CFF8A]/20">
                    View Details
                  </Link>
                  <button className="flex-1 bg-[#0D1917] text-[#8BA89E] hover:text-[#E8F5F0] transition-colors py-2 rounded text-center text-sm font-medium border border-[#5CFF8A]/10">
                    Observation
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
