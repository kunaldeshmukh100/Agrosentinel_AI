import React from 'react';
import { AlertLevel } from '../../lib/types';

interface RiskBadgeProps {
  level: AlertLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  percentage?: number;
}

export function RiskBadge({ level, size = 'md', className = '', percentage }: RiskBadgeProps) {
  const config = {
    GREEN: { bg: 'bg-[#5CFF8A]/10', text: 'text-[#5CFF8A]', border: 'border-[#5CFF8A]/30', dot: 'bg-[#5CFF8A]' },
    YELLOW: { bg: 'bg-[#FFB547]/10', text: 'text-[#FFB547]', border: 'border-[#FFB547]/30', dot: 'bg-[#FFB547]' },
    ORANGE: { bg: 'bg-[#FF6B5B]/10', text: 'text-[#FF6B5B]', border: 'border-[#FF6B5B]/30', dot: 'bg-[#FF6B5B]' },
    RED: { bg: 'bg-[#FF3B4E]/10', text: 'text-[#FF3B4E]', border: 'border-[#FF3B4E]/30', dot: 'bg-[#FF3B4E]' },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const c = config[level];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-mono tracking-wide border ${c.bg} ${c.text} ${c.border} ${sizes[size]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${level !== 'GREEN' ? 'animate-pulse' : ''}`}></span>
      {level}
      {percentage !== undefined && <span className="ml-1 opacity-80">{percentage}%</span>}
    </span>
  );
}
