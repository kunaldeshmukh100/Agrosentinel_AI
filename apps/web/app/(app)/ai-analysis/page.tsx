'use client';

import React, { useState, useEffect } from 'react';
import { Upload, ChevronDown, CheckCircle2, Circle, Settings2 } from 'lucide-react';

export default function AIAnalysisPage() {
  const [image, setImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'attention'>('original');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([
    { id: 'img', label: 'Image received', status: 'pending' },
    { id: 'vis', label: 'Vision features extracted (EfficientNet-B0)', status: 'pending' },
    { id: 'wea', label: 'Weather synchronized...', status: 'pending' },
    { id: 'crp', label: 'Crop stage verified...', status: 'pending' },
    { id: 'spa', label: 'Spatial context loaded...', status: 'pending' },
    { id: 'sat', label: 'Satellite features loaded...', status: 'pending' },
    { id: 'fus', label: 'Multimodal fusion running...', status: 'pending' },
    { id: 'fc', label: 'Forecast generated', status: 'pending' },
  ]);
  const [resultsAvailable, setResultsAvailable] = useState(false);

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setResultsAvailable(false);
    
    // Reset steps
    setAnalysisSteps(steps => steps.map(s => ({ ...s, status: 'pending' })));

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < analysisSteps.length) {
        setAnalysisSteps(steps => 
          steps.map((s, i) => i === currentStep ? { ...s, status: 'done' } : s)
        );
        currentStep++;
      } else {
        clearInterval(interval);
        setIsAnalyzing(false);
        setResultsAvailable(true);
      }
    }, 400);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImage(url);
    }
  };

  return (
    <div className="page-enter space-y-8 pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* SECTION 1: HEADER */}
      <div className="border-b border-[rgba(92,255,138,0.12)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>
          MULTIMODAL INTELLIGENCE ENGINE
        </h1>
        <p className="text-lg mt-2 text-[#8BA89E]">Six-modality gated cross-attention transformer fusion</p>
        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full border border-[rgba(92,255,138,0.3)] bg-[#5CFF8A]/10 text-xs text-[#5CFF8A] mono">
          Fusion Model v0.1.0 · EfficientNet-B0 Backbone
        </div>
      </div>

      {/* SECTION 2: FUSION PIPELINE VISUALIZER */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-[#38D9FF]" />
          FUSION PIPELINE VISUALIZER
        </h2>
        
        <div className="relative flex justify-between items-center py-8 overflow-hidden rounded-lg bg-[rgba(13,25,23,0.9)] border border-[rgba(92,255,138,0.3)] p-8">
          
          <style>{`
            @keyframes flow {
              0% { left: 0%; opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { left: 100%; opacity: 0; }
            }
            .flow-dot {
              position: absolute;
              width: 6px;
              height: 6px;
              background-color: var(--primary);
              border-radius: 50%;
              box-shadow: 0 0 10px var(--primary);
              top: 50%;
              transform: translateY(-50%);
              animation: flow 2s linear infinite;
            }
            .pulse-hex {
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              animation: glow-pulse 2s infinite;
            }
          `}</style>

          {/* Left Nodes */}
          <div className="flex flex-col gap-4 z-10 w-48">
            {[
              { name: 'IMAGE', weight: 31, color: '#5CFF8A' },
              { name: 'WEATHER', weight: 28, color: '#38D9FF' },
              { name: 'GEOSPATIAL', weight: 19, color: '#FFB547' },
              { name: 'SATELLITE', weight: 12, color: '#9F7AEA' },
              { name: 'CROP STAGE', weight: 6, color: '#FF6B5B' },
              { name: 'HISTORICAL', weight: 4, color: '#8BA89E' },
            ].map((mod, i) => (
              <div key={mod.name} className="relative">
                <div className="flex items-center justify-between bg-[var(--surface)] border border-[rgba(92,255,138,0.3)] rounded px-3 py-2 text-sm font-medium z-10 relative">
                  <span>{mod.name}</span>
                  <span className="text-xs text-[#8BA89E]">{mod.weight}%</span>
                </div>
                {/* Connecting paths and dots */}
                <div className="absolute top-1/2 left-full w-[calc(100vw/3)] h-px bg-gradient-to-r from-[rgba(92,255,138,0.2)] to-transparent -translate-y-1/2 -z-10">
                  <div className="flow-dot" style={{ animationDelay: (i * 0.3) + 's' }}></div>
                  <div className="flow-dot" style={{ animationDelay: (i * 0.3 + 1) + 's' }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Center Fusion Core */}
          <div className="z-10 flex flex-col items-center">
            <div className="pulse-hex bg-[#0D1917] border-2 border-[#5CFF8A] w-32 h-32 flex items-center justify-center relative z-10 text-center text-[#5CFF8A] shadow-[0_0_20px_rgba(92,255,138,0.4)]">
              <div className="font-bold tracking-wider leading-tight">
                AI FUSION<br/>CORE
              </div>
            </div>
            {/* Outgoing path to output */}
            <div className="absolute top-1/2 left-[calc(50%+4rem)] w-40 h-px bg-gradient-to-r from-[rgba(92,255,138,0.4)] to-[rgba(255,59,78,0.4)] -translate-y-1/2 -z-10">
               <div className="flow-dot !bg-[#FF3B4E] !shadow-[0_0_10px_#FF3B4E]"></div>
            </div>
          </div>

          {/* Right Output */}
          <div className="z-10 w-48 text-center bg-[var(--surface)] border-2 border-[#FF3B4E] rounded-lg p-6 shadow-[0_0_15px_rgba(255,59,78,0.2)]">
            <div className="text-xs text-[#8BA89E] mb-2 uppercase tracking-wider">Outbreak Risk</div>
            <div className="text-4xl font-bold text-[#FF3B4E] mono">
              {resultsAvailable ? '78%' : '--%'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: IMAGE ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-4">
          <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Vision Input</h3>
            
            {!image ? (
              <label className="border-2 border-dashed border-[#8BA89E]/40 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:border-[#5CFF8A]/60 transition-colors bg-[var(--surface)] relative overflow-hidden group">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Upload className="w-10 h-10 text-[#8BA89E] group-hover:text-[#5CFF8A] mb-3 transition-colors" />
                <div className="text-[#E8F5F0] font-medium tracking-wide">↑ UPLOAD CROP IMAGE</div>
                <div className="text-sm text-[#8BA89E] mt-2">JPG, PNG, WEBP up to 10MB</div>
              </label>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={() => setViewMode('original')}
                    className={viewMode === 'original' ? 'px-3 py-1.5 rounded text-sm font-medium transition-colors bg-[#5CFF8A]/20 text-[#5CFF8A] border border-[#5CFF8A]/50' : 'px-3 py-1.5 rounded text-sm font-medium transition-colors bg-[var(--surface)] text-[#8BA89E] border border-transparent'}
                  >
                    ORIGINAL
                  </button>
                  <button 
                    onClick={() => setViewMode('attention')}
                    className={viewMode === 'attention' ? 'px-3 py-1.5 rounded text-sm font-medium transition-colors bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/50' : 'px-3 py-1.5 rounded text-sm font-medium transition-colors bg-[var(--surface)] text-[#8BA89E] border border-transparent'}
                  >
                    AI ATTENTION
                  </button>
                </div>
                
                <div className="relative rounded-lg overflow-hidden flex-1 min-h-[250px] border border-[#8BA89E]/20 bg-black">
                  <img src={image} alt="Crop" className="w-full h-full object-cover absolute inset-0" />
                  
                  {viewMode === 'attention' && (
                    <div 
                      className="absolute inset-0 mix-blend-overlay opacity-80"
                      style={{
                        background: 'radial-gradient(circle at 40% 60%, rgba(255, 59, 78, 0.9) 0%, rgba(255, 181, 71, 0.6) 30%, transparent 70%)'
                      }}
                    />
                  )}
                </div>
                {viewMode === 'attention' && (
                  <p className="text-xs text-[#FFB547] mt-2 font-medium tracking-wide">
                    AI ATTENTION MAP — Areas that most influenced the prediction
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#8BA89E] uppercase tracking-wider">Crop Type</label>
                  <div className="relative">
                    <select className="w-full bg-[var(--surface)] border border-[#8BA89E]/30 rounded px-3 py-2 appearance-none text-[#E8F5F0] focus:border-[#5CFF8A] outline-none transition-colors">
                      <option>Tomato</option>
                      <option>Potato</option>
                      <option>Wheat</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-[#8BA89E] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#8BA89E] uppercase tracking-wider">Growth Stage</label>
                  <div className="relative">
                    <select className="w-full bg-[var(--surface)] border border-[#8BA89E]/30 rounded px-3 py-2 appearance-none text-[#E8F5F0] focus:border-[#5CFF8A] outline-none transition-colors">
                      <option>Flowering</option>
                      <option>Vegetative</option>
                      <option>Fruiting</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-[#8BA89E] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#8BA89E] uppercase tracking-wider">Field Notes (Optional)</label>
                <textarea 
                  className="w-full bg-[var(--surface)] border border-[#8BA89E]/30 rounded px-3 py-2 text-[#E8F5F0] focus:border-[#5CFF8A] outline-none transition-colors resize-none h-20"
                  placeholder="e.g., Noticeable yellowing on lower leaves..."
                />
              </div>
              
              <button 
                onClick={simulateAnalysis}
                disabled={!image || isAnalyzing}
                className="w-full py-3 bg-[#5CFF8A] text-[#07110F] font-bold rounded-lg hover:bg-[#4AE079] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest mt-2"
              >
                {isAnalyzing ? 'Processing...' : 'Analyze with AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="glass-card p-6 h-full flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          
          {!image && !isAnalyzing && !resultsAvailable && (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8BA89E] min-h-[400px]">
              <Settings2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Upload a crop image to begin analysis</p>
            </div>
          )}

          {isAnalyzing && !resultsAvailable && (
            <div className="flex-1 mono text-sm flex flex-col justify-center min-h-[400px] bg-[#0D1917] p-6 rounded border border-[#8BA89E]/20">
              <div className="text-[#5CFF8A] mb-4 font-bold tracking-widest">ANALYZING FIELD DATA</div>
              <div className="space-y-3">
                {analysisSteps.map(step => (
                  <div key={step.id} className={step.status === 'done' ? 'flex items-center gap-3 text-[#E8F5F0]' : 'flex items-center gap-3 text-[#8BA89E]/50'}>
                    {step.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#5CFF8A]" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultsAvailable && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-[#5CFF8A] font-bold mb-6">
                <div className="w-2 h-2 rounded-full bg-[#5CFF8A] animate-pulse" />
                ANALYSIS COMPLETE
              </div>

              <div className="mb-6">
                <div className="text-xs text-[#8BA89E] uppercase tracking-wider mb-1">Detected Disease</div>
                <div className="text-2xl font-bold text-[#FF3B4E]">Late Blight</div>
                <div className="text-sm text-[#FF3B4E]/80 italic">(Phytophthora infestans)</div>
              </div>

              <div className="space-y-4 mb-8 mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="w-32 text-[#8BA89E]">CONFIDENCE</span>
                  <span className="w-12 text-right">82%</span>
                  <div className="flex-1 ml-4 h-2 bg-[#10211E] rounded overflow-hidden">
                    <div className="h-full bg-[#5CFF8A]" style={{ width: '82%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="w-32 text-[#8BA89E]">SEVERITY</span>
                  <span className="w-12 text-right">Mod</span>
                  <div className="flex-1 ml-4 h-2 bg-[#10211E] rounded overflow-hidden">
                    <div className="h-full bg-[#FFB547]" style={{ width: '60%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="w-32 text-[#8BA89E]">CURRENT RISK</span>
                  <span className="w-12 text-right text-[#FF3B4E]">0.78</span>
                  <div className="flex-1 ml-4 h-2 bg-[#10211E] rounded overflow-hidden">
                    <div className="h-full bg-[#FF3B4E]" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-xs text-[#8BA89E] uppercase tracking-wider mb-2">Forecast</div>
                  <div className="space-y-1 mono text-sm">
                    <div className="flex justify-between text-[#FFB547]"><span>+3 days:</span> <span>82%</span></div>
                    <div className="flex justify-between text-[#FF6B5B]"><span>+5 days:</span> <span>87%</span></div>
                    <div className="flex justify-between text-[#FF3B4E]"><span>+7 days:</span> <span>89%</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8BA89E] uppercase tracking-wider mb-2">Alert Level</div>
                  <div className="bg-[#FF3B4E]/10 border border-[#FF3B4E]/30 text-[#FF3B4E] font-bold py-2 px-4 rounded text-center h-[72px] flex items-center justify-center">
                    [RED]
                  </div>
                </div>
              </div>

              <div className="bg-[#0D1917] p-4 rounded border border-[#8BA89E]/20">
                <div className="text-xs text-[#8BA89E] uppercase tracking-wider mb-2">Explanation</div>
                <p className="text-sm text-[#E8F5F0] leading-relaxed">
                  The AI has flagged this sample due to high environmental humidity (82%), nearby disease cluster, and susceptible crop stage (flowering).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: MODALITY GATE PANEL */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-6 uppercase tracking-wider">Modality Contribution Analysis</h2>
        
        <div className="space-y-4 mono text-sm">
          {[
            { name: 'Image Vision', value: 31, level: 'HIGH', color: '#5CFF8A' },
            { name: 'Weather Data', value: 28, level: 'HIGH', color: '#38D9FF' },
            { name: 'Geospatial', value: 19, level: 'MEDIUM', color: '#FFB547' },
            { name: 'Satellite NDVI', value: 12, level: 'MEDIUM', color: '#9F7AEA' },
            { name: 'Crop Stage', value: 6, level: 'LOW', color: '#FF6B5B' },
            { name: 'Historical', value: 4, level: 'LOW', color: '#8BA89E' },
          ].map((mod, i) => (
            <div key={mod.name} className="flex items-center">
              <span className="w-36 text-[#E8F5F0]">{mod.name}</span>
              <div className="flex-1 h-2 bg-[#0D1917] rounded-full overflow-hidden mx-4">
                <div 
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: mod.value + '%', 
                    backgroundColor: mod.color,
                    boxShadow: '0 0 10px ' + mod.color + '80'
                  }}
                />
              </div>
              <span className="w-12 text-right mr-4">{mod.value}%</span>
              <span className="w-24 text-right flex items-center justify-end gap-2" style={{ color: mod.color }}>
                <Circle className="w-2 h-2 fill-current" /> {mod.level}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
