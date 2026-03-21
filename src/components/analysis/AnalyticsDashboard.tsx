/**
 * @file src/components/analysis/AnalyticsDashboard.tsx
 * @description Integrated Analytics Dashboard using Recharts.
 * @compliance Rule 1: SourceBadge visible. Rule 2: Fallback logic.
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import SourceBadge from '../ui/SourceBadge';

interface AnalyticsData {
  valuationTrend: { year: number; avgValue: number }[];
  zoningMix: { name: string; value: number }[];
  summary: {
    totalErfs: number;
    medianValue: number;
    growthRate: string;
  };
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
}

const ZONING_COLORS: Record<string, string> = {
  'Residential': '#4CAF50',
  'Business': '#42A5F5',
  'Industrial': '#BDBDBD',
  'Community': '#CE93D8',
  'Open Space': '#80CBC4',
  'Other': '#757575'
};

export const AnalyticsDashboard: React.FC<{ guestMode?: boolean }> = ({ guestMode = false }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analysis/stats');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
    };
    fetchData();
  }, []);

  if (!data) return <div className="p-8 text-zinc-300">Loading Insights... 📊</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 overflow-y-auto max-h-full">
      {/* Summary Metrics */}
      <div className="md:col-span-2 grid grid-cols-3 gap-4">
        {[
          { label: 'Total Erfs', value: data.summary.totalErfs.toLocaleString(), icon: '🏡' },
          { label: 'Median Value', value: `R ${(data.summary.medianValue / 1000000).toFixed(1)}M`, icon: '💰' },
          { label: 'Annual Growth', value: data.summary.growthRate, icon: '📈' }
        ].map((m, i) => (
          <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-inner text-center">
            <div className="text-xl mb-1">{m.icon}</div>
            <div className="text-lg font-bold text-emerald-400">{m.value}</div>
            <div className="text-xs text-zinc-300 uppercase tracking-wider">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Valuation Trend */}
      <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Valuation Trend</h3>
        <div className={`h-48 w-full ${guestMode ? 'blur-md grayscale pointer-events-none' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.valuationTrend}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
              <XAxis dataKey="year" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: '8px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="avgValue" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {guestMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
            <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-emerald-400 transition-all">
              SIGN UP TO UNLOCK
            </button>
          </div>
        )}
        <div className="mt-4">
          <SourceBadge source={data.source} year={data.year} tier={data.tier} />
        </div>
      </div>

      {/* Zoning Mix */}
      <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Zoning Mix</h3>
        <div className={`h-48 w-full ${guestMode ? 'blur-md grayscale pointer-events-none' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.zoningMix}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {data.zoningMix.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ZONING_COLORS[entry.name] || ZONING_COLORS.Other} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: '8px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <SourceBadge source="CoCT IZS" year={2026} tier="MOCK" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
