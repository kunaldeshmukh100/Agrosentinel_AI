'use client'

import React from 'react';

export default function ModelInsightsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Warning Banner */}
      <div className="bg-[#FFB547]/10 border border-[#FFB547]/30 rounded-lg p-4 flex gap-3 items-start backdrop-blur-sm">
        <span className="text-xl">⚠</span>
        <div>
          <h4 className="text-[#FFB547] font-semibold mb-1 text-sm uppercase tracking-wider">Pipeline Test Mode</h4>
          <p className="text-[#FFB547]/80 text-sm">Metrics below are from synthetic data pipeline testing, not from real PlantVillage data. See documentation for details.</p>
        </div>
      </div>

      <header>
        <h1 className="text-3xl font-bold text-[#E8F5F0] mb-2 tracking-tight">MODEL INSIGHTS</h1>
        <p className="text-[#8BA89E]">AI system performance and architecture</p>
      </header>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 flex flex-col hover:border-[#5CFF8A]/30 transition-colors">
          <div className="mb-4 pb-4 border-b border-[#5CFF8A]/10">
            <h3 className="text-[#8BA89E] text-xs font-bold uppercase tracking-wider mb-1">VISION ENCODER</h3>
            <div className="text-xl font-semibold text-[#E8F5F0]">EfficientNet-B0</div>
            <div className="text-sm text-[#8BA89E] mb-2">Version: v1.0</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5CFF8A]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5CFF8A]" /> READY
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#8BA89E]">Val Accuracy (synthetic)</span>
              <span className="font-mono text-[#5CFF8A]">87.75%</span>
            </div>
            <div className="h-1.5 w-full bg-[#0D1917] rounded-full overflow-hidden">
              <div className="h-full bg-[#5CFF8A] rounded-full" style={{ width: '87.75%' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm text-[#8BA89E] mt-auto">
            <div>Classes: <span className="text-[#E8F5F0]">15</span></div>
            <div>Input: <span className="font-mono text-[#E8F5F0]">224×224</span></div>
            <div className="col-span-2">Output: <span className="font-mono text-[#E8F5F0]">128-dim + class</span></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 flex flex-col hover:border-[#5CFF8A]/30 transition-colors">
          <div className="mb-4 pb-4 border-b border-[#5CFF8A]/10">
            <h3 className="text-[#8BA89E] text-xs font-bold uppercase tracking-wider mb-1">FUSION TRANSFORMER</h3>
            <div className="text-xl font-semibold text-[#E8F5F0]">Gated Cross-Attention</div>
            <div className="text-sm text-[#8BA89E] mb-2">Version: v0.1</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5CFF8A]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5CFF8A]" /> READY
            </div>
          </div>
          
          <div className="mb-4 bg-[#0D1917] p-3 rounded text-sm text-[#8BA89E] border border-[#5CFF8A]/5">
            <span className="text-[#FFB547]">F1 Score: Not evaluated</span><br/>
            (Real data required)
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm text-[#8BA89E] mt-auto">
            <div>Heads: <span className="text-[#E8F5F0]">4</span></div>
            <div>Layers: <span className="text-[#E8F5F0]">2</span></div>
            <div className="col-span-2">Dim: <span className="font-mono text-[#E8F5F0]">128</span></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 flex flex-col hover:border-[#5CFF8A]/30 transition-colors">
          <div className="mb-4 pb-4 border-b border-[#5CFF8A]/10">
            <h3 className="text-[#8BA89E] text-xs font-bold uppercase tracking-wider mb-1">GEOSPATIAL ENGINE</h3>
            <div className="text-xl font-semibold text-[#E8F5F0]">DBSCAN Clustering</div>
            <div className="text-sm text-[#8BA89E] mb-2">Version: v1.0</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#38D9FF]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" /> ONLINE
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-[#8BA89E] mb-4">
            <div>Algorithm: <span className="text-[#E8F5F0]">DBSCAN</span></div>
            <div>eps: <span className="font-mono text-[#E8F5F0]">5.0 km</span></div>
            <div>min_samples: <span className="font-mono text-[#E8F5F0]">3</span></div>
          </div>

          <div className="mt-auto pt-4 border-t border-[#5CFF8A]/10 text-sm text-[#8BA89E]">
            Metric: <span className="text-[#E8F5F0]">Haversine</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 flex flex-col">
           <h3 className="text-[#8BA89E] text-xs font-bold uppercase tracking-wider mb-1">WEATHER FEATURE ENGINEER</h3>
           <div className="text-lg font-semibold text-[#E8F5F0]">14-Feature Extractor</div>
           <div className="flex items-center gap-1.5 text-xs font-bold text-[#38D9FF] mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" /> ONLINE
           </div>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 flex flex-col">
           <h3 className="text-[#8BA89E] text-xs font-bold uppercase tracking-wider mb-1">CROP FEATURE ENGINEER</h3>
           <div className="text-lg font-semibold text-[#E8F5F0]">Growth Stage Embedder</div>
           <div className="flex items-center gap-1.5 text-xs font-bold text-[#38D9FF] mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" /> ONLINE
           </div>
        </div>

        {/* Card 6 */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 flex flex-col">
           <h3 className="text-[#8BA89E] text-xs font-bold uppercase tracking-wider mb-1">HISTORICAL FEATURE ENGINEER</h3>
           <div className="text-lg font-semibold text-[#E8F5F0]">Time-Series Windowing</div>
           <div className="flex items-center gap-1.5 text-xs font-bold text-[#38D9FF] mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]" /> ONLINE
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Architecture Diagram */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-6 border-b border-[#5CFF8A]/10 pb-2">Architecture Topology</h2>
          <div className="font-mono text-sm text-[#8BA89E] bg-[#0D1917] p-6 rounded-lg border border-[#5CFF8A]/5 overflow-x-auto whitespace-pre">
<span className="text-[#38D9FF]">6 Modality Inputs</span>
      ↓
<span className="text-[#5CFF8A]">Gated Cross-Attention Transformer</span>
(2 layers, 4 heads, 128-dim)
      ↓
<span className="text-[#FFB547]">7 Prediction Heads:</span>
├── Disease Classification (15 classes)
├── Severity Regression (0-1)
├── Current Risk (0-1)
├── Risk +3d, +5d, +7d
└── Spread Probability (0-1)
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <h2 className="text-[#8BA89E] text-sm font-semibold uppercase tracking-wider mb-6 border-b border-[#5CFF8A]/10 pb-2">System Status</h2>
          <div className="space-y-4">
            {[
              { name: 'AI CORE', status: 'ONLINE', color: '#38D9FF' },
              { name: 'VISION MODEL', status: 'READY (checkpoint loaded)', color: '#5CFF8A' },
              { name: 'FUSION MODEL', status: 'READY (checkpoint loaded)', color: '#5CFF8A' },
              { name: 'WEATHER ENGINE', status: 'ONLINE', color: '#38D9FF' },
              { name: 'GEOSPATIAL ENGINE', status: 'ONLINE', color: '#38D9FF' },
              { name: 'FORECAST ENGINE', status: 'READY (heuristic mode)', color: '#5CFF8A' },
              { name: 'DATABASE', status: 'ONLINE (SQLite)', color: '#38D9FF' },
            ].map(sys => (
              <div key={sys.name} className="flex justify-between items-center p-3 rounded bg-[#0D1917] border border-[#5CFF8A]/5">
                <span className="text-[#E8F5F0] font-mono text-sm">{sys.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sys.color }} />
                  <span className="text-xs font-mono" style={{ color: sys.color }}>{sys.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
