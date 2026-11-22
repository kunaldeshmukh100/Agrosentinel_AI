import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  accent?: 'green' | 'blue' | 'warning' | 'critical';
  className?: string;
}

export function MetricCard({
  label, value, unit, trend, trendLabel, icon, accent = 'green', className = ''
}: MetricCardProps) {
  
  const accentColors = {
    green: 'text-[#5CFF8A] border-[#5CFF8A]',
    blue: 'text-[#38D9FF] border-[#38D9FF]',
    warning: 'text-[#FFB547] border-[#FFB547]',
    critical: 'text-[#FF3B4E] border-[#FF3B4E]',
  };
  
  const accentColor = accentColors[accent];

  return (
    <div className={`glass-card p-4 relative overflow-hidden group hover:glass-card-elevated transition-all duration-300 ${className}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor.split(' ')[1]} bg-opacity-50`} />
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="data-label">{label}</h3>
        {icon && <div className="text-[#8BA89E] opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>
      
      <div className="flex items-end gap-2">
        <span className={`metric-value ${accentColor.split(' ')[0]} group-hover:glow-${accent === 'blue' ? 'blue' : 'green'} transition-all`}>
          {value}
        </span>
        {unit && <span className="text-[#8BA89E] font-mono text-sm mb-1">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs font-mono">
          {trend > 0 ? (
            <span className="text-[#5CFF8A] flex items-center">↑ {trend}%</span>
          ) : trend < 0 ? (
            <span className="text-[#FF3B4E] flex items-center">↓ {Math.abs(trend)}%</span>
          ) : (
            <span className="text-[#8BA89E] flex items-center">- {trend}%</span>
          )}
          {trendLabel && <span className="text-[#8BA89E]/60 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
