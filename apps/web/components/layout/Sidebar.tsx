'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Map, AlertTriangle, Sprout, 
  Brain, TrendingUp, Bell, Database, Cpu, 
  FlaskConical, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(!collapsed);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

const mainNav = [
  { icon: LayoutDashboard, label: 'Command Center', href: '/dashboard', accent: true },
  { icon: Map, label: 'Live Risk Map', href: '/map' },
  { icon: AlertTriangle, label: 'Outbreaks', href: '/outbreaks' },
  { icon: Sprout, label: 'Farm Intelligence', href: '/farms' },
  { icon: Brain, label: 'AI Analysis', href: '/ai-analysis' },
  { icon: TrendingUp, label: 'Forecast', href: '/forecast' },
  { icon: Bell, label: 'Alerts', href: '/alerts', badge: true }
];

const systemNav = [
  { icon: Database, label: 'Data Sources', href: '/data-sources' },
  { icon: Cpu, label: 'Model Insights', href: '/model-insights' },
  { icon: FlaskConical, label: 'Simulation', href: '/simulation' }
];

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  const NavItem = ({ item }: { item: any }) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link href={item.href} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300
        ${active ? 'border-l-2 border-[#5CFF8A] bg-[#5CFF8A]/[0.06] text-[#5CFF8A]' : 'border-l-2 border-transparent text-[#8BA89E] hover:bg-[#5CFF8A]/[0.04] hover:text-[#E8F5F0]'}`}>
        <div className="relative">
          <Icon size={20} className={active ? 'drop-shadow-[0_0_8px_rgba(92,255,138,0.5)]' : ''} />
          {item.badge && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
        </div>
        {!collapsed && <span className="text-sm tracking-wide font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div 
      className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 border-r border-[#5CFF8A]/[0.08]"
      style={{
        width: collapsed ? '60px' : '220px',
        backgroundColor: 'rgba(13, 25, 23, 0.95)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex items-center h-16 px-4 mb-4 mt-2">
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <polygon points="50 5, 95 25, 95 75, 50 95, 5 75, 5 25" stroke="#5CFF8A" strokeWidth="6" fill="transparent"/>
          <circle cx="50" cy="50" r="15" fill="#5CFF8A" className="animate-pulse" />
        </svg>
        {!collapsed && <span className="ml-3 text-[#5CFF8A] font-bold tracking-wider text-lg">AgroSentinel</span>}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="mb-6">
          {!collapsed && <div className="px-5 mb-2 text-[10px] uppercase tracking-widest text-[#8BA89E]/60">Intelligence</div>}
          <div className="flex flex-col">
            {mainNav.map(item => <NavItem key={item.label} item={item} />)}
          </div>
        </div>

        <div className="mb-6">
          {!collapsed && <div className="px-5 mb-2 text-[10px] uppercase tracking-widest text-[#8BA89E]/60">System</div>}
          <div className="flex flex-col">
            {systemNav.map(item => <NavItem key={item.label} item={item} />)}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[#5CFF8A]/[0.08]">
        <NavItem item={{ icon: Settings, label: 'Settings', href: '/settings' }} />
        <button 
          onClick={toggle} 
          className="w-full flex items-center gap-3 px-4 py-4 text-[#8BA89E] hover:bg-[#5CFF8A]/[0.04] hover:text-[#E8F5F0] transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </div>
  );
}
