'use client';

import React, { useState } from 'react';
import { PlayCircle, Pause, RotateCcw, FastForward, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SimulationPage() {
  const [humidity, setHumidity] = useState(75);
  const [rainfall, setRainfall] = useState(12);
  const [nearbyCases, setNearbyCases] = useState(3);
  const [susceptibility, setSusceptibility] = useState('high');
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [resultsShown, setResultsShown] = useState(false);
  
  const [playbackDay, setPlaybackDay] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Playback simulation data
  const daysData = [
    { day: 1, cases: 3, risk: 22, alert: 'GREEN', color: '#5CFF8A', dots: 2 },
    { day: 2, cases: 9, risk: 38, alert: 'YELLOW', color: '#FFB547', dots: 4 },
    { day: 3, cases: 21, risk: 61, alert: 'ORANGE', color: '#FF6B5B', dots: 7 },
    { day: 4, cases: 42, risk: 78, alert: 'RED', color: '#FF3B4E', dots: 11 },
    { day: 5, cases: 73, risk: 89, alert: 'RED', color: '#FF3B4E', dots: 15 },
  ];

  const chartData = daysData.slice(0, playbackDay).map(d => ({ name: 'Day ' + d.day, risk: d.risk }));

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setResultsShown(true);
    }, 1500);
  };

  const togglePlayback = () => {
    if (playbackDay >= 5) setPlaybackDay(1);
    setIsPlaying(!isPlaying);
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playbackDay < 5) {
      interval = setInterval(() => {
        setPlaybackDay(prev => {
          if (prev >= 4) setIsPlaying(false);
          return prev + 1;
        });
      }, 1000 / speedMultiplier);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackDay, speedMultiplier]);

  const currentDayData = daysData[playbackDay - 1];

  return (
    <div className="page-enter space-y-8 pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      <div className="border-b border-[rgba(92,255,138,0.12)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#E8F5F0]">
          OUTBREAK SIMULATOR
        </h1>
        <p className="text-lg mt-2 text-[#8BA89E]">Watch an outbreak emerge and spread across time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-8">
        
        {/* LEFT COLUMN: SIMULATION CONTROLS */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#5CFF8A] mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Scenario Parameters
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8BA89E]">HUMIDITY</span>
                  <span className="mono">{humidity}%</span>
                </div>
                <input type="range" min="0" max="100" value={humidity} onChange={(e) => setHumidity(Number(e.target.value))} className="w-full accent-[#5CFF8A]" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8BA89E]">RAINFALL</span>
                  <span className="mono">{rainfall}mm</span>
                </div>
                <input type="range" min="0" max="50" value={rainfall} onChange={(e) => setRainfall(Number(e.target.value))} className="w-full accent-[#38D9FF]" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8BA89E]">NEARBY CASES</span>
                  <span className="mono">{nearbyCases}</span>
                </div>
                <input type="range" min="0" max="20" value={nearbyCases} onChange={(e) => setNearbyCases(Number(e.target.value))} className="w-full accent-[#FFB547]" />
              </div>

              <div className="space-y-2">
                <span className="text-sm text-[#8BA89E] block mb-2">CROP SUSCEPTIBILITY</span>
                <div className="flex rounded-md overflow-hidden border border-[#8BA89E]/30">
                  {['low', 'medium', 'high', 'critical'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setSusceptibility(level)}
                      className={'flex-1 py-1.5 text-xs font-medium uppercase transition-colors ' + (susceptibility === level ? 'bg-[#5CFF8A]/20 text-[#5CFF8A]' : 'bg-[var(--surface)] text-[#8BA89E] hover:bg-[#8BA89E]/10')}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#8BA89E] uppercase">Disease Type</label>
                  <select className="w-full bg-[var(--surface)] border border-[#8BA89E]/30 rounded px-2 py-1.5 text-sm outline-none">
                    <option>Late Blight</option>
                    <option>Early Blight</option>
                    <option>Downy Mildew</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#8BA89E] uppercase">Crop</label>
                  <select className="w-full bg-[var(--surface)] border border-[#8BA89E]/30 rounded px-2 py-1.5 text-sm outline-none">
                    <option>Tomato</option>
                    <option>Wheat</option>
                    <option>Onion</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-[#38D9FF]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#38D9FF] mb-4">What-If Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="bg-[#0D1917] p-3 rounded border border-[#8BA89E]/10">
                <div className="text-xs text-[#8BA89E] mb-2 uppercase">Current Conditions</div>
                <div className="flex justify-between mb-1"><span>Humidity:</span> <span className="mono">65%</span></div>
                <div className="flex justify-between mb-1"><span>Risk:</span> <span className="mono text-[#FFB547]">0.22</span></div>
                <div className="flex justify-between"><span>Alert:</span> <span className="text-[#5CFF8A] font-bold">GREEN</span></div>
              </div>
              <div className="bg-[#0D1917] p-3 rounded border border-[#8BA89E]/10">
                <div className="text-xs text-[#8BA89E] mb-2 uppercase">Simulated Conditions</div>
                <div className="flex justify-between mb-1"><span>Humidity:</span> <span className="mono">{humidity}%</span></div>
                <div className="flex justify-between mb-1">
                  <span>Risk:</span> 
                  <span className={'mono ' + (resultsShown ? 'text-[#FF3B4E]' : 'text-[#8BA89E]')}>
                    {resultsShown ? '0.78' : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Alert:</span> 
                  <span className={'font-bold ' + (resultsShown ? 'text-[#FF3B4E]' : 'text-[#8BA89E]')}>
                    {resultsShown ? 'RED' : '--'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full py-4 bg-[#5CFF8A] text-[#07110F] font-bold rounded hover:bg-[#4AE079] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-[0_0_15px_rgba(92,255,138,0.3)] disabled:opacity-50"
            >
              {isSimulating ? (
                <span className="animate-pulse">Calculating Matrix...</span>
              ) : (
                <><PlayCircle className="w-5 h-5" /> Run AI Simulation</>
              )}
            </button>
            
            {resultsShown && (
              <div className="mt-4 p-4 bg-[#FF3B4E]/10 border border-[#FF3B4E]/30 rounded text-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-[#FF3B4E] font-bold mb-2">
                  <span>Risk Increase: +0.56</span>
                  <span>↗</span>
                </div>
                <p className="text-[#E8F5F0]">
                  Increasing humidity to {humidity}% with {nearbyCases} nearby cases shifts the environment into a critical transmission phase. Immediate prophylactic spraying recommended.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VISUALIZATION */}
        <div className="space-y-6">
          <div className="glass-card p-6 h-full flex flex-col">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#8BA89E]/20">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#E8F5F0]">Simulation Playback</h2>
              <div className="flex items-center gap-4">
                <div className="flex bg-[#0D1917] rounded overflow-hidden border border-[#8BA89E]/20">
                  {[1, 2, 4].map(speed => (
                    <button 
                      key={speed}
                      onClick={() => setSpeedMultiplier(speed)}
                      className={'px-2 py-1 text-xs mono ' + (speedMultiplier === speed ? 'bg-[#38D9FF]/20 text-[#38D9FF]' : 'text-[#8BA89E] hover:bg-[#8BA89E]/10')}
                    >
                      ×{speed}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPlaybackDay(1); setIsPlaying(false); }} className="p-1.5 text-[#8BA89E] hover:text-[#E8F5F0] bg-[#0D1917] rounded"><RotateCcw className="w-4 h-4" /></button>
                  <button onClick={togglePlayback} className="p-1.5 text-[#07110F] bg-[#5CFF8A] hover:bg-[#4AE079] rounded">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {daysData.map((d) => (
                <div 
                  key={d.day} 
                  className={'flex items-center gap-4 p-3 rounded border transition-all duration-500 ' + (playbackDay >= d.day ? 'bg-[#0D1917] border-[#8BA89E]/20' : 'opacity-30 grayscale border-transparent')}
                >
                  <div className="w-16 mono text-sm font-bold text-[#8BA89E]">DAY 0{d.day}</div>
                  
                  <div className="flex-1 flex flex-wrap gap-1">
                    {Array.from({ length: d.dots }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-3 h-3 rounded-full animate-in zoom-in duration-300"
                        style={{ backgroundColor: d.color, boxShadow: '0 0 5px ' + d.color + '80' }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm mono w-48 shrink-0">
                    <div><span className="text-[#8BA89E]">Risk:</span> {d.risk}%</div>
                    <div><span className="text-[#8BA89E]">Cases:</span> {d.cases}</div>
                  </div>
                  
                  <div className="w-20 text-right font-bold text-xs tracking-wider" style={{ color: d.color }}>
                    {d.alert}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 bg-[#0D1917] rounded border border-[#8BA89E]/10 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#10211E', border: '1px solid rgba(92,255,138,0.2)' }}
                      itemStyle={{ color: '#5CFF8A', fontFamily: 'monospace' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="risk" 
                      stroke="#FF3B4E" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0D1917', stroke: '#FF3B4E', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#FF3B4E' }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-[#0D1917] rounded border border-[#8BA89E]/10 p-4 flex flex-col justify-center">
                <div className="text-xs text-[#8BA89E] uppercase tracking-wider mb-2">Simulation Narrative</div>
                <p className="text-sm text-[#E8F5F0] min-h-[60px] animate-in fade-in duration-300 transition-opacity" key={playbackDay}>
                  {playbackDay === 1 && "Three isolated suspicious cases reported. Environmental conditions conducive to Late Blight."}
                  {playbackDay === 2 && "New cases emerging. Six observations within 8km radius. Humidity rising."}
                  {playbackDay === 3 && "DBSCAN detected an active disease cluster. 21 total cases. Growth rate accelerating."}
                  {playbackDay === 4 && "OUTBREAK RISK CRITICAL. Cluster has expanded to 5.4km radius."}
                  {playbackDay === 5 && "Established outbreak. 73 cases across 3 sub-clusters. Immediate intervention required."}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
