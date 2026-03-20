/**
 * @file src/components/dashboard/DomainSidebar.tsx
 * @description Specialized sidebar for Domain-Specific Dashboards (M23).
 * Switches layout/controls based on the active DomainMode.
 */

'use client';

import React from 'react';
import { DomainMode, useDomainState } from '@/hooks/useDomainState';
import { CrayonCard } from '../ui/CrayonCard';
import { SourceBadge } from '../ui/SourceBadge';

interface DomainSidebarProps {
  colors: any;
}

export const DomainSidebar: React.FC<DomainSidebarProps> = ({ colors }) => {
  const { mode, params, updateDomainParam } = useDomainState();

  if (mode === 'general') return null;

  const renderEmergency = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🚑</span>
        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Emergency Mode</h3>
      </div>
      
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-red-200">Fire Awareness Radius</span>
          <span className="text-xs font-mono text-white">{params.radius || '5'}km</span>
        </div>
        <input 
          type="range" min="1" max="50" step="1"
          value={params.radius || '5'}
          onChange={(e) => updateDomainParam('radius', e.target.value)}
          className="w-full accent-red-500 bg-red-950 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-gray-400 uppercase font-bold px-1">Active Situational Data</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
            <div className="text-[9px] text-blue-300">Wind Direction</div>
            <div className="text-xs text-white flex items-center gap-1">
              <span style={{ transform: 'rotate(45deg)', display: 'inline-block' }}>↑</span> NW 12kt
            </div>
          </div>
          <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
            <div className="text-[9px] text-orange-300">Active Hotspots</div>
            <div className="text-xs text-white">4 detected</div>
          </div>
        </div>
      </div>

      <CrayonCard 
        colorVariant="blue" 
        className="p-3 border-red-500/20 bg-red-500/5"
      >
        <div className="text-[10px] text-red-400 font-bold mb-1">🚨 PROXIMITY ALERT</div>
        <p className="text-[11px] text-gray-300 leading-relaxed">
          Fire detected within 4.2km of Kirstenbosch. Air quality sensors reporting particulates rising.
        </p>
      </CrayonCard>
      
      <div className="mt-4">
        <SourceBadge source="NASA FIRMS" year={2026} tier="LIVE" />
      </div>
    </div>
  );

  const renderEnvironmental = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🌿</span>
        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Environmental Mode</h3>
      </div>

      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
        <div className="text-[10px] text-emerald-400 font-bold mb-2">NDVI DELTA (vs Baseline)</div>
        <div className="h-24 flex items-end gap-1 px-1">
          {[40, 60, 45, 80, 75, 40, 30].map((h, i) => (
            <div key={i} className="flex-1 bg-emerald-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-gray-500 font-mono">
          <span>T-7D</span>
          <span>LIVE</span>
        </div>
      </div>

      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
        <div>
          <label className="text-[10px] text-gray-400 block mb-1">Anomaly Threshold</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded p-1"
            value={params.threshold || 'severe'}
            onChange={(e) => updateDomainParam('threshold', e.target.value)}
          >
            <option value="moderate">Moderate Δ ( &gt; 0.15 )</option>
            <option value="severe">Severe Δ ( &gt; 0.30 )</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="show-clipping" className="accent-emerald-500" />
          <label htmlFor="show-clipping" className="text-[10px] text-gray-300">Highlight Moisture Loss</label>
        </div>
      </div>

      <div className="mt-4">
        <SourceBadge source="Sentinel-2" year={2026} tier="LIVE" />
      </div>
    </div>
  );

  const renderCitizens = () => (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div className="text-2xl mb-1">🏘️</div>
        <h3 className="font-bold text-white text-base">Cape Town Citizen View</h3>
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3">
        <span>📢</span> Report an Issue
      </button>

      <div className="space-y-3">
        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
          <div className="text-[10px] text-blue-300 uppercase font-bold mb-1">Local Service status</div>
          <div className="flex items-center gap-2 text-xs text-white">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Utility Grid: Stable
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
          <div className="text-[10px] text-orange-300 uppercase font-bold mb-1">Incidents in Table Bay</div>
          <div className="text-xs text-white">🚧 Roadwork on N1 (inbound)</div>
          <div className="text-[10px] text-gray-500 mt-1">Cleared in approx. 2 hrs</div>
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
        <div className="text-[10px] text-blue-200 mb-1">PROXIMITY STATS</div>
        <div className="text-lg font-bold text-white">12</div>
        <div className="text-[9px] text-gray-400">Public parks within 2km</div>
      </div>
    </div>
  );

  const renderFarmers = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🚜</span>
        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Farmer Insights</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-900/10 p-2 rounded-lg border border-amber-500/20">
          <div className="text-[9px] text-amber-300">Moisture Profile</div>
          <div className="text-xs text-white">42% (Normal)</div>
        </div>
        <div className="bg-amber-900/10 p-2 rounded-lg border border-amber-500/20">
          <div className="text-[9px] text-amber-300">Solar Gain</div>
          <div className="text-xs text-white">High (Clear)</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-gray-400 font-bold uppercase">Field NDVI Health</div>
        <div className="space-y-1">
          {[
            { n: 'Boundary Peak', v: 0.72, c: 'bg-green-500' },
            { n: 'Lower Slope', v: 0.45, c: 'bg-yellow-500' },
            { n: 'North Valley', v: 0.28, c: 'bg-red-500' }
          ].map((f, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[9px] text-gray-200 px-1">
                <span>{f.n}</span>
                <span>{f.v}</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className={`${f.c} h-full`} style={{ width: `${f.v * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
        <div className="text-[10px] text-gray-400 mb-2">Weather Correlation Overlay</div>
        <div className="flex gap-2">
          {['rain', 'wind', 'solar'].map(l => (
            <button 
              key={l}
              onClick={() => updateDomainParam('layer', l)}
              className={`flex-1 text-[9px] py-1 rounded transition-colors border ${
                params.layer === l 
                  ? 'bg-amber-500/40 border-amber-400 text-white' 
                  : 'bg-slate-900 border-slate-700 text-gray-500'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <SourceBadge source="Sentinel-2 + SAWS" year={2026} tier="LIVE" />
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {mode === 'emergency' && renderEmergency()}
      {mode === 'environmental' && renderEnvironmental()}
      {mode === 'citizens' && renderCitizens()}
      {mode === 'farmers' && renderFarmers()}
    </div>
  );
};
