import React from 'react';
import { AlertLevel } from '@/lib/types';

interface Props {
  level: AlertLevel;
}

export default function AlertBadge({ level }: Props) {
  const colors = {
    GREEN: 'bg-green-500 text-green-900',
    YELLOW: 'bg-yellow-500 text-yellow-900',
    ORANGE: 'bg-orange-500 text-orange-900',
    RED: 'bg-red-500 text-white pulse-red-anim'
  };

  const dotColors = {
    GREEN: 'bg-green-200',
    YELLOW: 'bg-yellow-200',
    ORANGE: 'bg-orange-200',
    RED: 'bg-white'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[level]}`}></span>
      {level}
    </span>
  );
}
