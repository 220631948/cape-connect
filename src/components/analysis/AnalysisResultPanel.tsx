/**
 * @file src/components/analysis/AnalysisResultPanel.tsx
 * @description UI Panel for spatial analysis results.
 * @compliance POPIA: Handling municipal data aggregates.
 */

'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import dynamic from 'next/dynamic';

const ExportPanel = dynamic(() => import('./ExportPanel'), {
  ssr: false,
  loading: () => <div className="text-[10px] text-slate-500 mt-2 italic">Loading export tools...</div>
});

interface AnalysisResultPanelProps {
  results: {
    property_count: number;
    total_valuation: number;
    zoning_breakdown: Record<string, number> | null;
  } | null;
  loading: boolean;
  onClose: () => void;
  colors: any;
  bufferDistance?: number;
  onBufferChange?: (dist: number) => void;
  feature?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  results,
  loading,
  onClose,
  colors,
  bufferDistance = 0,
  onBufferChange,
  feature,
}) => {
  if (!results && !loading && bufferDistance === 0) return null;

  const zoningData = results?.zoning_breakdown
    ? Object.entries(results.zoning_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '320px',
        background: colors.surface,
        borderRadius: '16px',
        padding: '20px',
        boxShadow: `8px 8px 16px ${colors.shadow}`,
        border: `1px solid ${colors.border}`,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>🔍 Spatial Analysis</h3>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: colors.textSecondary }}
        >
          ✕
        </button>
      </div>

      {/* Buffer Control */}
      {onBufferChange && (
        <div style={{ padding: '0 4px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: colors.textSecondary }}>
            <span>Buffer Distance</span>
            <span style={{ fontWeight: 600, color: colors.accent }}>{bufferDistance}m</span>
          </div>
          <input
            type="range"
            min="0"
            max="2000"
            step="10"
            value={bufferDistance}
            onChange={(e) => onBufferChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: colors.accent }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: colors.textSecondary }}>Counting robot-houses... ⌛</p>
        </div>
      ) : results ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: colors.bg, borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: colors.accent }}>{results?.property_count}</div>
              <div style={{ fontSize: '10px', color: colors.textSecondary }}>PROPERTIES</div>
            </div>
            <div style={{ padding: '12px', background: colors.bg, borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: colors.accent }}>
                R{(results?.total_valuation || 0 / 1000000).toFixed(1)}M
              </div>
              <div style={{ fontSize: '10px', color: colors.textSecondary }}>VALUATION</div>
            </div>
          </div>

          {zoningData.length > 0 && (
            <div style={{ height: '160px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Zoning Mix</div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoningData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {zoningData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {feature && <ExportPanel feature={feature} results={results} colors={colors} />}
        </>
      ) : null}
    </div>
  );
};

export default AnalysisResultPanel;
