'use client';

import React from 'react';
import { Sidebar, SidebarProvider, useSidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#07110F' }}>
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out" 
        style={{ marginLeft: collapsed ? 60 : 220 }}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto" style={{ paddingTop: 48 }}>  
          <div className="page-enter h-full w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
