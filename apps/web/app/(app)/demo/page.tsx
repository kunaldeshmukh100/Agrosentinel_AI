'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, AlertTriangle } from 'lucide-react';

const DEMO_DAYS = [
  { day: 1, cases: 3, risk: 0.22, alert: 'GREEN', color: '#5CFF8A', narrative: 'Three isolated suspicious cases reported in the northeast quadrant. Environmental conditions conducive to Late Blight.', clusters: [{ id: 1, lat: 30, lon: 70, size: 20, intensity: 0.3 }] },
  { day: 2, cases: 9, risk: 0.38, alert: 'YELLOW', color: '#FFB547', narrative: 'New cases emerging. Six observations within 8km radius. Weather pattern: humidity rising.', clusters: [{ id: 1, lat: 32, lon: 68, size: 40, intensity: 0.5 }, { id: 2, lat: 60, lon: 30, size: 25, intensity: 0.4 }] },
  { day: 3, cases: 21, risk: 0.61, alert: 'ORANGE', color: '#FF6B5B', narrative: 'DBSCAN detected an active disease cluster. 12 cases within 6km radius. Growth rate: 3 cases/day.', clusters: [{ id: 1, lat: 35, lon: 65, size: 80, intensity: 0.7 }, { id: 2, lat: 58, lon: 32, size: 40, intensity: 0.6 }, { id: 3, lat: 20, lon: 40, size: 30, intensity: 0.5 }] },
  { day: 4, cases: 42, risk: 0.78, alert: 'RED', color: '#FF3B4E', narrative: 'OUTBREAK RISK CRITICAL. 21 cases confirmed. Cluster has expanded to 5.4km radius.', clusters: [{ id: 1, lat: 35, lon: 65, size: 120, intensity: 0.9 }, { id: 2, lat: 55, lon: 35, size: 70, intensity: 0.8 }, { id: 3, lat: 22, lon: 42, size: 50, intensity: 0.7 }, { id: 4, lat: 70, lon: 70, size: 40, intensity: 0.6 }] },
  { day: 5, cases: 73, risk: 0.89, alert: 'RED', color: '#FF3B4E', narrative: 'Established outbreak. 31 cases across 3 sub-clusters. 7-day forecast: 91% risk.', clusters: [{ id: 1, lat: 35, lon: 65, size: 180, intensity: 1.0 }, { id: 2, lat: 55, lon: 35, size: 100, intensity: 0.9 }, { id: 3, lat: 22, lon: 42, size: 80, intensity: 0.8 }, { id: 4, lat: 70, lon: 70, size: 60, intensity: 0.7 }, { id: 5, lat: 45, lon: 20, size: 40, intensity: 0.6 }] },
];

export default function DemoPage() {
  const [currentDay, setCurrentDay] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2000); // ms per day
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentData = DEMO_DAYS[currentDay - 1];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentDay(prev => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          return prev + 1;
        });
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const togglePlay = () => {
    if (currentDay >= 5) setCurrentDay(1);
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 bg-[#07110F] text-[#E8F5F0] overflow-hidden flex flex-col font-sans z-50">
      
      {/* Top Banner */}
      <div className="bg-[#FFB547] text-[#07110F] px-4 py-2 flex items-center justify-center gap-3 font-bold tracking-widest text-sm uppercase">
        <AlertTriangle className="w-4 h-4" />
        DEMO MODE · SYNTHETIC DATA · NASHIK TOMATO LATE BLIGHT OUTBREAK SCENARIO
        <AlertTriangle className="w-4 h-4" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left 60%: Animated Map */}
        <div className="w-[60%] relative bg-[#0D1917] border-r border-[#8BA89E]/20 overflow-hidden">
          
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(#5CFF8A 1px, transparent 1px), linear-gradient(90deg, #5CFF8A 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Radar Sweep Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 origin-center"
              style={{
                background: 'conic-gradient(from 0deg, transparent 70%, rgba(92,255,138,0.1) 95%, rgba(92,255,138,0.4) 100%)',
                animation: 'spin 4s linear infinite'
              }}
            />
          </div>

          <style>{`
            @keyframes spin { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
            @keyframes pulse-ring {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(2); opacity: 0; }
            }
          `}</style>

          {/* Map Title/Overlay */}
          <div className="absolute top-6 left-6 z-10 glass-card p-4 border border-[#5CFF8A]/30 bg-[#07110F]/80 backdrop-blur-md rounded-lg">
            <div className="text-[#5CFF8A] font-bold tracking-widest text-lg mb-1">REGION: NASHIK</div>
            <div className="text-[#8BA89E] mono text-xs uppercase">Lat: 19.9975° N, Lon: 73.7898° E</div>
            <div className="mt-2 text-xs text-[#E8F5F0]">SATELLITE / NDVI / WEATHER FUSION ACTIVE</div>
          </div>

          {/* Clusters */}
          {currentData.clusters.map((cluster) => (
            <div 
              key={currentDay + '-' + cluster.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
              style={{
                top: cluster.lat + '%',
                left: cluster.lon + '%',
              }}
            >
              {/* Inner Core */}
              <div 
                className="absolute inset-0 m-auto rounded-full z-20"
                style={{
                  width: (cluster.size * 0.3) + 'px',
                  height: (cluster.size * 0.3) + 'px',
                  backgroundColor: currentData.color,
                  boxShadow: '0 0 20px ' + currentData.color,
                  transform: 'translate(-50%, -50%)'
                }}
              />
              {/* Expanding Ring */}
              <div 
                className="absolute inset-0 m-auto rounded-full border-2 z-10"
                style={{
                  width: cluster.size + 'px',
                  height: cluster.size + 'px',
                  borderColor: currentData.color,
                  transform: 'translate(-50%, -50%)',
                  animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
              {/* Outer Heatmap area */}
              <div 
                className="absolute inset-0 m-auto rounded-full opacity-30 z-0 transition-all duration-1000"
                style={{
                  width: (cluster.size * 1.5) + 'px',
                  height: (cluster.size * 1.5) + 'px',
                  background: 'radial-gradient(circle, ' + currentData.color + ' 0%, transparent 70%)',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
          ))}

        </div>

        {/* Right 40%: Stats Panel */}
        <div className="w-[40%] bg-[#07110F] flex flex-col p-8 relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          
          <div className="flex-1 space-y-10">
            {/* Day Counter */}
            <div className="flex justify-between items-end border-b border-[#8BA89E]/20 pb-4">
              <div>
                <div className="text-[#8BA89E] font-bold tracking-widest text-sm mb-2">SIMULATION TIMELINE</div>
                <div className="text-6xl font-black mono text-[#E8F5F0]">
                  DAY 0{currentDay} <span className="text-[#8BA89E]/30 text-4xl">/ 05</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0D1917] p-6 rounded-lg border border-[#8BA89E]/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF3B4E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[#8BA89E] text-xs font-bold tracking-widest mb-2">CONFIRMED CASES</div>
                <div className="text-5xl font-bold mono text-[#E8F5F0]">{currentData.cases}</div>
                <div className="text-xs text-[#FF3B4E] mt-2 font-bold flex items-center gap-1">
                  ↗ GROWING RAPIDLY
                </div>
              </div>

              <div className="bg-[#0D1917] p-6 rounded-lg border border-[#8BA89E]/10 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#FF3B4E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[#8BA89E] text-xs font-bold tracking-widest mb-2">SYSTEM RISK LEVEL</div>
                <div className="text-5xl font-bold mono" style={{ color: currentData.color }}>
                  {Math.round(currentData.risk * 100)}%
                </div>
                <div className="w-full h-1.5 bg-[#07110F] mt-3 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: (currentData.risk * 100) + '%', backgroundColor: currentData.color }} />
                </div>
              </div>
            </div>

            {/* Alert Level Badge */}
            <div className="p-4 border rounded-lg flex items-center justify-between" style={{ borderColor: currentData.color + '40', backgroundColor: currentData.color + '10' }}>
              <span className="font-bold tracking-widest text-sm text-[#8BA89E]">THREAT ASSESSMENT</span>
              <span className="px-4 py-1.5 rounded text-sm font-black tracking-widest" style={{ backgroundColor: currentData.color, color: '#07110F' }}>
                LEVEL {currentData.alert}
              </span>
            </div>

            {/* Narrative Box */}
            <div className="bg-[#0D1917] border border-[#8BA89E]/20 rounded-lg p-6 min-h-[160px]">
              <div className="text-[#5CFF8A] text-xs font-bold tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#5CFF8A] animate-pulse" />
                INTELLIGENCE REPORT
              </div>
              <p className="text-lg leading-relaxed text-[#E8F5F0]" key={'narrative-' + currentDay} style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}>
                {currentData.narrative}
              </p>
            </div>
            
            {/* Active Clusters list */}
            <div>
               <div className="text-[#8BA89E] text-xs font-bold tracking-widest mb-3">ACTIVE CLUSTERS ({currentData.clusters.length})</div>
               <div className="flex gap-2 flex-wrap">
                 {currentData.clusters.map((c, i) => (
                   <div key={i} className="px-3 py-1 rounded bg-[#0D1917] border border-[#8BA89E]/20 text-xs mono text-[#E8F5F0]">
                     CL-{c.id} / INT:{c.intensity.toFixed(1)}
                   </div>
                 ))}
               </div>
            </div>

          </div>

          {/* Bottom Controls */}
          <div className="mt-8 pt-6 border-t border-[#8BA89E]/20">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs text-[#8BA89E] font-bold">PROGRESS</span>
              <div className="flex-1 h-1 bg-[#0D1917] rounded-full overflow-hidden">
                <div className="h-full bg-[#5CFF8A] transition-all duration-500" style={{ width: ((currentDay / 5) * 100) + '%' }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentDay(prev => Math.max(1, prev - 1))}
                  className="p-3 bg-[#0D1917] hover:bg-[#10211E] border border-[#8BA89E]/20 rounded transition-colors text-[#8BA89E] hover:text-[#E8F5F0]"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="px-8 py-3 bg-[#5CFF8A] text-[#07110F] font-bold rounded flex items-center gap-2 hover:bg-[#4AE079] transition-colors"
                >
                  {isPlaying ? <><Pause className="w-5 h-5" /> PAUSE</> : <><Play className="w-5 h-5" /> AUTO PLAY</>}
                </button>
                <button 
                  onClick={() => setCurrentDay(prev => Math.min(5, prev + 1))}
                  className="p-3 bg-[#0D1917] hover:bg-[#10211E] border border-[#8BA89E]/20 rounded transition-colors text-[#8BA89E] hover:text-[#E8F5F0]"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { setCurrentDay(1); setIsPlaying(false); }}
                  className="p-3 bg-[#0D1917] hover:bg-[#10211E] border border-[#8BA89E]/20 rounded transition-colors ml-4 text-[#8BA89E] hover:text-[#E8F5F0]"
                  title="Reset"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {[1000, 2000, 3000].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={speed === s ? 'px-3 py-1.5 rounded border text-xs font-bold mono transition-colors bg-[#5CFF8A]/20 border-[#5CFF8A] text-[#5CFF8A]' : 'px-3 py-1.5 rounded border text-xs font-bold mono transition-colors bg-transparent border-[#8BA89E]/30 text-[#8BA89E] hover:border-[#8BA89E]'}
                  >
                    {s / 1000}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
