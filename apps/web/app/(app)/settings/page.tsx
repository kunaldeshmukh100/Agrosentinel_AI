'use client'

import React, { useState } from 'react';

export default function SettingsPage() {
  const [demoMode, setDemoMode] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(70);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-[#E8F5F0] mb-2 tracking-tight">SETTINGS</h1>
        <p className="text-[#8BA89E]">System configuration and preferences</p>
      </header>

      <div className="space-y-6">
        
        {/* ACCOUNT */}
        <section className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <h2 className="text-[#38D9FF] text-sm font-bold uppercase tracking-wider mb-6">1. Account</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#5CFF8A]/20 flex items-center justify-center text-[#5CFF8A] font-bold text-xl border border-[#5CFF8A]/30">
                A
              </div>
              <div>
                <div className="text-[#E8F5F0] font-semibold">Admin User</div>
                <div className="text-[#8BA89E] text-sm">admin@agrosentinel.ai</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-[#5CFF8A]/10 text-[#5CFF8A] border border-[#5CFF8A]/20 px-3 py-1 rounded text-xs font-bold tracking-wider">
                SUPERADMIN
              </span>
              <button className="text-[#FF3B4E] hover:bg-[#FF3B4E]/10 px-4 py-2 rounded transition-colors text-sm font-medium border border-transparent hover:border-[#FF3B4E]/20">
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* DISPLAY */}
        <section className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <h2 className="text-[#38D9FF] text-sm font-bold uppercase tracking-wider mb-6">2. Display</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-[#E8F5F0] font-medium">Show Demo Data Banner</div>
                <div className="text-[#8BA89E] text-sm">Display warning when viewing synthetic data</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={demoMode} onChange={() => setDemoMode(!demoMode)} />
                <div className="w-11 h-6 bg-[#0D1917] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#E8F5F0] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5CFF8A]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-[#5CFF8A]/5">
              <div>
                <div className="text-[#E8F5F0] font-medium">Reduced Motion</div>
                <div className="text-[#8BA89E] text-sm">Disable UI animations and transitions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={reducedMotion} onChange={() => setReducedMotion(!reducedMotion)} />
                <div className="w-11 h-6 bg-[#0D1917] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#E8F5F0] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5CFF8A]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[#5CFF8A]/5">
              <div>
                <div className="text-[#E8F5F0] font-medium">Theme</div>
                <div className="text-[#8BA89E] text-sm">Interface color scheme</div>
              </div>
              <select disabled className="bg-[#0D1917] border border-[#5CFF8A]/10 text-[#8BA89E] text-sm rounded-lg px-4 py-2 opacity-70 cursor-not-allowed outline-none">
                <option>Dark Mode (Default)</option>
              </select>
            </div>
          </div>
        </section>

        {/* ALERTS */}
        <section className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <h2 className="text-[#38D9FF] text-sm font-bold uppercase tracking-wider mb-6">3. Alerts</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#E8F5F0] font-medium">Browser Notifications</div>
                <div className="text-[#8BA89E] text-sm">Receive desktop alerts for critical risks</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                <div className="w-11 h-6 bg-[#0D1917] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#E8F5F0] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5CFF8A]"></div>
              </label>
            </div>

            <div className="border-t border-[#5CFF8A]/5 pt-4">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="text-[#E8F5F0] font-medium">Risk Alert Threshold</div>
                  <div className="text-[#8BA89E] text-sm">Notify when disease probability exceeds this value</div>
                </div>
                <div className="text-[#FF3B4E] font-mono text-xl">{riskThreshold}%</div>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={riskThreshold} 
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-[#0D1917] rounded-lg appearance-none cursor-pointer accent-[#FF3B4E]"
              />
            </div>

            <div className="border-t border-[#5CFF8A]/5 pt-4">
              <div className="text-[#E8F5F0] font-medium mb-3">Alert Frequency</div>
              <div className="flex gap-4">
                {['Real-time', 'Hourly', 'Daily'].map(freq => (
                  <button key={freq} className={`flex-1 py-2 rounded border text-sm transition-colors ${freq === 'Real-time' ? 'bg-[#38D9FF]/10 border-[#38D9FF]/50 text-[#38D9FF]' : 'bg-[#0D1917] border-[#5CFF8A]/10 text-[#8BA89E] hover:text-[#E8F5F0]'}`}>
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DATA */}
        <section className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80">
          <h2 className="text-[#38D9FF] text-sm font-bold uppercase tracking-wider mb-6">4. Data Connection</h2>
          <div className="space-y-4">
            <div>
              <div className="text-[#E8F5F0] font-medium mb-1">API Endpoint</div>
              <input type="text" readOnly value="http://localhost:8000/api/v1" className="w-full bg-[#0D1917] border border-[#5CFF8A]/20 text-[#8BA89E] font-mono px-4 py-2 rounded-lg cursor-not-allowed outline-none focus:border-[#5CFF8A]/20" />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-[#5CFF8A]/5">
              <div>
                <div className="text-[#E8F5F0] font-medium">Local Cache</div>
                <div className="text-[#8BA89E] text-sm">Clear downloaded images and API responses</div>
              </div>
              <button className="px-4 py-2 bg-[#0D1917] text-[#8BA89E] hover:text-[#E8F5F0] rounded-lg border border-[#5CFF8A]/20 transition-colors text-sm">
                Clear Cache
              </button>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="glass-card p-6 rounded-xl border border-[#5CFF8A]/10 bg-[#10211E]/80 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5CFF8A] via-[#38D9FF] to-[#FF3B4E]" />
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5CFF8A]/20 to-[#38D9FF]/20 border border-[#5CFF8A]/30 mb-4 mt-2 shadow-[0_0_20px_rgba(92,255,138,0.2)]">
            <span className="text-3xl">🌱</span>
          </div>
          <h2 className="text-xl font-bold text-[#E8F5F0] tracking-tight">AgroSentinel AI</h2>
          <p className="text-[#5CFF8A] font-mono text-sm mb-4">Version 0.1.0</p>
          <p className="text-[#8BA89E] text-sm max-w-lg mx-auto mb-6">
            An advanced AI-powered crop monitoring and disease prediction pipeline built for SIH 2026. 
            Currently running in synthetic data mode for evaluation.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="#" className="text-[#38D9FF] hover:underline">Documentation</a>
            <span className="text-[#8BA89E]">·</span>
            <a href="#" className="text-[#38D9FF] hover:underline">Architecture</a>
            <span className="text-[#8BA89E]">·</span>
            <a href="#" className="text-[#38D9FF] hover:underline">License</a>
          </div>
        </section>

      </div>
    </div>
  );
}
