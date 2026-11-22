'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useSidebar } from './Sidebar';

export function TopBar() {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    
    if (typeof window !== 'undefined') {
      setIsDemo(localStorage.getItem('demo_mode') === 'true');
    }
    
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Command Center';
    return path.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div 
      className="fixed top-0 right-0 h-12 flex items-center justify-between px-6 z-40 transition-all duration-300 border-b border-[#5CFF8A]/[0.06]"
      style={{
        left: collapsed ? '60px' : '220px',
        backgroundColor: 'rgba(7, 17, 15, 0.9)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex items-center">
        <span className="text-[#E8F5F0] font-medium tracking-wide">{getPageTitle()}</span>
        <span className="ml-3 text-xs text-[#8BA89E]">AgroSentinel &gt; {getPageTitle()}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#5CFF8A] animate-pulse"></div>
        <span className="uppercase tracking-wider text-xs text-[#5CFF8A]">AI SYSTEM ONLINE</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-[#8BA89E]">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#5CFF8A]"></span> ONLINE</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#38D9FF]"></span> 2m ago</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#5CFF8A]"></span> LIVE</span>
        </div>
        
        {isDemo && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded">
            DEMO
          </span>
        )}

        <div className="font-mono text-[#38D9FF] text-sm tracking-wider w-20 text-right">
          {time}
        </div>

        <div className="relative cursor-pointer text-[#8BA89E] hover:text-[#E8F5F0]">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#07110F]"></span>
        </div>

        <div className="w-8 h-8 rounded-full border border-[#5CFF8A]/30 flex items-center justify-center bg-[#10211E] text-xs font-bold text-[#E8F5F0]">
          AS
        </div>
      </div>
    </div>
  );
}
