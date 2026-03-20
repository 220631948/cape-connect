/**
 * @file src/components/dashboard/MetricsRow.tsx
 * @description Neumorphic metrics row for the GIS Dashboard.
 */

import React from 'react';
import { Theme } from '../../assets/tokens/themes';

interface MetricsRowProps {
  colors: Theme;
  cardShadow: any;
  theme: string;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  colors,
  cardShadow,
  theme,
}) => {
  const metrics = [
    { label: 'Active Flights', value: '12', icon: '✈️', textColor: 'text-crayon-blue', borderColor: 'border-crayon-blue' },
    { label: 'Data Sources', value: '8', icon: '🗂️', textColor: 'text-crayon-pink', borderColor: 'border-crayon-pink' },
    { label: 'Map Layers', value: '5', icon: '🗺️', textColor: 'text-crayon-yellow', borderColor: 'border-crayon-yellow' },
    { label: 'Users Online', value: '3', icon: '👥', textColor: 'text-emerald-400', borderColor: 'border-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className={`p-5 rounded-xl text-center border-t-4 bg-capetown-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${metric.borderColor}`}
          style={cardShadow}
        >
          <div className="text-2xl mb-2">
            {metric.icon}
          </div>
          <div className={`text-3xl font-black mb-1 ${metric.textColor}`}>
            {metric.value}
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsRow;
