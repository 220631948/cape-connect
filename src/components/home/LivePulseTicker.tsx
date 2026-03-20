'use client';

import React from 'react';

export const LivePulseTicker: React.FC = () => {
  const stats = [
    { label: 'Total Properties', value: '842,912', color: 'text-crayon-yellow' },
    { label: 'Active Aircraft', value: '142', color: 'text-crayon-blue' },
    { label: 'Managed Tenants', value: '1,204', color: 'text-crayon-pink' },
    { label: 'Spatial Layers', value: '42', color: 'text-white' },
    { label: 'System Health', value: 'Optimal', color: 'text-green-400' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-zinc-800 py-3 overflow-hidden z-50">
      <div className="flex animate-scroll whitespace-nowrap gap-12">
        {[...stats, ...stats].map((stat, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
              {stat.label}
            </span>
            <span className={`text-sm font-bold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-zinc-700 mx-4">|</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LivePulseTicker;
