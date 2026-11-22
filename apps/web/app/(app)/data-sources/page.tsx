'use client'

import React from 'react';

export default function DataSourcesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-[#E8F5F0] mb-2 tracking-tight">DATA SOURCES</h1>
        <p className="text-[#8BA89E]">Pipeline status and data ingestion monitoring</p>
      </header>

      {/* Pipeline Visualization */}
      <div className="glass-card p-8 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 relative max-w-3xl mx-auto">
        <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-8 text-center">Ingestion Pipeline</h2>
        
        <div className="flex flex-col items-center space-y-2 relative">
          
          {/* Node 1 */}
          <div className="w-full glass-card p-5 rounded-lg border border-[#5CFF8A]/20 bg-[#0D1917] relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-mono text-[#E8F5F0] font-semibold">FARMER IMAGES</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5CFF8A] bg-[#5CFF8A]/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5CFF8A] animate-pulse" /> ACTIVE
              </div>
            </div>
            <div className="flex justify-between text-sm text-[#8BA89E]">
              <div>Crop photo submissions</div>
              <div className="font-mono">Last: 2m ago</div>
            </div>
            <div className="mt-3 text-xs text-[#8BA89E] flex justify-between border-t border-[#5CFF8A]/10 pt-2">
              <span>Format: JPG/PNG/WEBP · Max 10MB</span>
              <span className="text-[#E8F5F0]">Total today: 23 images</span>
            </div>
          </div>

          <div className="text-[#5CFF8A]/50 text-xl">↓</div>

          {/* Node 2 */}
          <div className="w-full glass-card p-5 rounded-lg border border-[#FFB547]/20 bg-[#0D1917] relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-mono text-[#E8F5F0] font-semibold">WEATHER DATA</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFB547] bg-[#FFB547]/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB547]" /> SYNTHETIC
              </div>
            </div>
            <div className="flex justify-between text-sm text-[#8BA89E]">
              <div>OpenWeatherMap (not connected)</div>
            </div>
            <div className="mt-3 text-xs text-[#8BA89E] flex justify-between border-t border-[#FFB547]/10 pt-2">
              <span>Currently: Synthetic generation</span>
              <span className="text-[#E8F5F0]">Features: 14 engineered</span>
            </div>
          </div>

          <div className="text-[#5CFF8A]/50 text-xl">↓</div>

          {/* Node 3 */}
          <div className="w-full glass-card p-5 rounded-lg border border-[#38D9FF]/20 bg-[#0D1917] relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-mono text-[#E8F5F0] font-semibold">SATELLITE IMAGERY</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#38D9FF] bg-[#38D9FF]/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" /> SIMULATED
              </div>
            </div>
            <div className="flex justify-between text-sm text-[#8BA89E]">
              <div>Sentinel-2 / NASA EarthData (not connected)</div>
            </div>
            <div className="mt-3 text-xs text-[#8BA89E] flex justify-between border-t border-[#38D9FF]/10 pt-2">
              <span>Currently: Computed mock features</span>
              <span className="text-[#E8F5F0]">NDVI / NDWI / EVI</span>
            </div>
          </div>

          <div className="text-[#5CFF8A]/50 text-xl">↓</div>

          {/* Node 4 */}
          <div className="w-full glass-card p-5 rounded-lg border border-[#5CFF8A]/20 bg-[#0D1917] relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-mono text-[#E8F5F0] font-semibold">FIELD OBSERVATIONS</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5CFF8A] bg-[#5CFF8A]/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5CFF8A] animate-pulse" /> ACTIVE
              </div>
            </div>
            <div className="flex justify-between text-sm text-[#8BA89E]">
              <div>GPS-tagged farmer reports</div>
            </div>
            <div className="mt-3 text-xs text-[#8BA89E] flex justify-between border-t border-[#5CFF8A]/10 pt-2">
              <span>Via Web App</span>
              <span className="text-[#E8F5F0]">Total: 73 observations</span>
            </div>
          </div>

          <div className="text-[#5CFF8A]/50 text-xl">↓</div>

          {/* Node 5 */}
          <div className="w-full glass-card p-5 rounded-lg border border-[#FFB547]/20 bg-[#0D1917] relative z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-mono text-[#E8F5F0] font-semibold">HISTORICAL DISEASE DATA</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFB547] bg-[#FFB547]/10 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB547]" /> SYNTHETIC
              </div>
            </div>
            <div className="flex justify-between text-sm text-[#8BA89E]">
              <div>Nashik region · 60-day window</div>
            </div>
            <div className="mt-3 text-xs text-[#8BA89E] flex justify-between border-t border-[#FFB547]/10 pt-2">
              <span>Historical Baseline</span>
              <span className="text-[#E8F5F0]">500 synthetic farm records</span>
            </div>
          </div>

          <div className="text-[#38D9FF]/50 text-xl font-bold">↓</div>

          {/* Engine Node */}
          <div className="w-full glass-card p-6 rounded-xl border-2 border-[#38D9FF]/40 bg-[#10211E] relative z-10 shadow-[0_0_30px_rgba(56,217,255,0.1)]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-mono text-xl text-[#38D9FF] font-bold">AGROSENTINEL AI ENGINE</h3>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#38D9FF]">
                <div className="w-2 h-2 rounded-full bg-[#38D9FF] animate-pulse" /> ONLINE
              </div>
            </div>
            <div className="text-sm text-[#8BA89E] flex justify-between border-t border-[#38D9FF]/20 pt-3">
              <span>Multimodal fusion · SQLite DB</span>
              <span className="font-mono text-[#E8F5F0]">API: http://localhost:8000</span>
            </div>
          </div>

        </div>
      </div>

      {/* Metrics Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <div className="text-[#8BA89E] mb-2 text-sm uppercase tracking-wider">Data Quality Metrics</div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#8BA89E]">Synthetic Data</span>
              <span className="text-[#5CFF8A] font-mono">100%</span>
            </div>
            <div className="h-1.5 w-full bg-[#0D1917] rounded-full overflow-hidden">
              <div className="h-full bg-[#5CFF8A] rounded-full w-full" />
            </div>
            <div className="flex justify-between text-sm mt-3">
              <span className="text-[#8BA89E]">Real Data</span>
              <span className="text-[#FF3B4E] font-mono">0%</span>
            </div>
            <div className="h-1.5 w-full bg-[#0D1917] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF3B4E] rounded-full w-0" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-[#38D9FF]/10 bg-[#10211E]/80 flex flex-col justify-center">
          <div className="text-[#8BA89E] mb-2 text-sm uppercase tracking-wider text-center">API Connection Status</div>
          <div className="text-center mt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#38D9FF]/10 text-[#38D9FF] mb-3">
              <span className="text-3xl">✓</span>
            </div>
            <div className="text-[#E8F5F0] font-semibold">Healthy</div>
            <div className="text-[#8BA89E] text-xs font-mono mt-1">24ms latency</div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-[#FFB547]/10 bg-[#10211E]/80">
          <div className="text-[#8BA89E] mb-2 text-sm uppercase tracking-wider">Storage</div>
          <div className="mt-4 space-y-4">
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-[#8BA89E]">SQLite DB Size</span>
                 <span className="text-[#E8F5F0] font-mono">12.4 MB</span>
               </div>
               <div className="text-xs text-[#8BA89E]">Using local file storage</div>
             </div>
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-[#8BA89E]">Image Cache</span>
                 <span className="text-[#E8F5F0] font-mono">45.8 MB</span>
               </div>
               <div className="text-xs text-[#8BA89E]">/public/uploads</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
