import React from 'react';

interface StatusDotProps {
  status: 'online' | 'warning' | 'offline' | 'syncing';
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, label, showLabel = true, className = '' }: StatusDotProps) {
  const config = {
    online: { color: 'bg-[#5CFF8A]', animation: 'animate-pulse' },
    warning: { color: 'bg-[#FFB547]', animation: 'animate-pulse' },
    offline: { color: 'bg-[#FF3B4E]', animation: '' },
    syncing: { color: 'bg-[#38D9FF]', animation: 'animate-pulse duration-700' },
  };

  const c = config[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${c.color} ${c.animation}`}></div>
      {showLabel && label && (
        <span className={`text-xs uppercase tracking-wider ${c.color.replace('bg-', 'text-')}`}>
          {label}
        </span>
      )}
    </div>
  );
}
