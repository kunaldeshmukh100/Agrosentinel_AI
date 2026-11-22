// @ts-nocheck
'use client'
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getDashboard } from '@/lib/api';
import { DashboardData } from '@/lib/types';
import AlertBadge from '@/components/AlertBadge';
import { Activity, Map as MapIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-800 animate-pulse flex items-center justify-center">Loading Map...</div> });

export default function OfficerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'clusters' | 'trends' | 'alerts'>('clusters');

  useEffect(() => {
    getDashboard().then(setData).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-900">
      {/* Top Stats */}
      <div className="h-20 border-b border-slate-700 flex items-center justify-around px-4 bg-slate-900/50">
        <div className="text-center"><div className="text-2xl font-bold text-white">{data?.total_farms || '-'}</div><div className="text-xs text-slate-400">Total Farms</div></div>
        <div className="text-center"><div className="text-2xl font-bold text-blue-400">{data?.active_observations || '-'}</div><div className="text-xs text-slate-400">Observations</div></div>
        <div className="text-center"><div className="text-2xl font-bold text-orange-400">{data?.active_clusters || '-'}</div><div className="text-xs text-slate-400">Active Clusters</div></div>
        <div className="text-center"><div className="text-2xl font-bold text-red-500">{data?.high_risk_farms || '-'}</div><div className="text-xs text-slate-400">High Risk</div></div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map Area */}
        <div className="w-3/5 h-full relative border-r border-slate-700">
          <MapComponent clusters={data?.clusters || []} observations={[]} center={[20.0, 74.0]} />
          
          <div className="absolute top-4 left-4 z-[400] glass-card px-4 py-2">
            <h3 className="font-bold flex items-center gap-2"><MapIcon size={16}/> Regional Overview</h3>
            <p className="text-xs text-slate-400">Nashik District</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-2/5 h-full flex flex-col bg-slate-900">
          <div className="flex border-b border-slate-700">
            <button onClick={() => setActiveTab('clusters')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'clusters' ? 'border-b-2 border-green-500 text-green-500' : 'text-slate-400'}`}>Clusters</button>
            <button onClick={() => setActiveTab('trends')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'trends' ? 'border-b-2 border-green-500 text-green-500' : 'text-slate-400'}`}>Trends</button>
            <button onClick={() => setActiveTab('alerts')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'alerts' ? 'border-b-2 border-green-500 text-green-500' : 'text-slate-400'}`}>Alerts</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'clusters' && (
              <div className="space-y-4">
                {data?.clusters.map(cluster => (
                  <div key={cluster.id} className="glass-card p-4 hover:border-slate-500 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-white capitalize">{cluster.disease.replace(/_/g, ' ')}</h4>
                        <p className="text-xs text-slate-400">Cluster {cluster.id.substring(0,8)}</p>
                      </div>
                      <AlertBadge level={cluster.alert_level} />
                    </div>
                    <div className="flex justify-between text-sm mt-4">
                      <div><span className="text-slate-400">Cases:</span> <span className="font-semibold">{cluster.case_count}</span></div>
                      <div><span className="text-slate-400">Risk:</span> <span className="font-semibold text-orange-400">{(cluster.avg_risk*100).toFixed(0)}%</span></div>
                      <div><span className="text-slate-400">Growth:</span> <span className="font-semibold text-red-400">+{cluster.growth_rate}/day</span></div>
                    </div>
                  </div>
                ))}
                {!data?.clusters.length && <p className="text-slate-500 text-center py-8">No active clusters</p>}
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="cases" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {data?.recent_alerts.map(alert => (
                  <div key={alert.id} className="glass-card p-3 flex gap-3 items-start border-l-4 border-l-red-500">
                    <AlertTriangle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-white">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{alert.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
