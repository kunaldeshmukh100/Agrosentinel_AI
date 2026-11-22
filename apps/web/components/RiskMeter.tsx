import React from 'react';

interface Props {
  risk: number;
  label?: string;
  future?: { '3d': number, '5d': number, '7d': number };
}

export default function RiskMeter({ risk, label = 'Risk Level', future }: Props) {
  // risk is 0 to 1
  const percent = Math.round(risk * 100);
  
  let color = 'bg-green-500';
  if (percent > 30) color = 'bg-yellow-500';
  if (percent > 60) color = 'bg-orange-500';
  if (percent > 80) color = 'bg-red-500';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-bold text-white">{percent}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${color}`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      
      {future && (
        <div className="flex gap-4 text-xs mt-2 text-slate-400">
          <div className="flex flex-col items-center">
            <span>3d</span>
            <div className={`w-2 h-2 rounded-full mt-1 ${future['3d'] > 0.8 ? 'bg-red-500' : future['3d'] > 0.6 ? 'bg-orange-500' : future['3d'] > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
          </div>
          <div className="flex flex-col items-center">
            <span>5d</span>
            <div className={`w-2 h-2 rounded-full mt-1 ${future['5d'] > 0.8 ? 'bg-red-500' : future['5d'] > 0.6 ? 'bg-orange-500' : future['5d'] > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
          </div>
          <div className="flex flex-col items-center">
            <span>7d</span>
            <div className={`w-2 h-2 rounded-full mt-1 ${future['7d'] > 0.8 ? 'bg-red-500' : future['7d'] > 0.6 ? 'bg-orange-500' : future['7d'] > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
          </div>
        </div>
      )}
    </div>
  );
}
