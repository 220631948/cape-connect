/**
 * AnalysisToolbar.tsx
 * ===================
 * Spatial analysis tool controls for buffer and intersection operations.
 * 
 * @compliance Rule 1: Source badge on analysis outputs
 * @compliance POPIA: Aggregate results only - no personal data exposed
 */

'use client';

import React from 'react';

interface AnalysisToolbarProps {
  mode: 'buffer' | 'intersect' | null;
  bufferDistance: number;
  onBufferChange: (distance: number) => void;
  onRunAnalysis: () => void;
  onClearAnalysis: () => void;
  hasFeature: boolean;
  isProcessing: boolean;
}

export const AnalysisToolbar: React.FC<AnalysisToolbarProps> = ({
  mode,
  bufferDistance,
  onBufferChange,
  onRunAnalysis,
  onClearAnalysis,
  hasFeature,
  isProcessing,
}) => {
  if (!hasFeature && !isProcessing) {
    return null;
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100]">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-2xl p-4 min-w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📐</span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {mode === 'buffer' ? 'Buffer Analysis' : 'Spatial Query'}
              </h3>
              <p className="text-xs text-zinc-400">
                {mode === 'buffer' 
                  ? 'Analyze properties within distance of drawn feature' 
                  : 'Intersect with selected geometry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClearAnalysis}
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Clear ✕
          </button>
        </div>

        {/* Buffer Control */}
        {mode === 'buffer' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-300 font-medium">Buffer Distance</label>
              <span className="text-sm font-bold text-emerald-400">{bufferDistance}m</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={bufferDistance}
              onChange={(e) => onBufferChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
              <span>0m</span>
              <span>500m</span>
              <span>1000m</span>
              <span>1500m</span>
              <span>2000m</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRunAnalysis}
            disabled={isProcessing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all text-sm shadow-lg hover:shadow-emerald-500/20"
          >
            {isProcessing ? '⏳ Processing...' : '🚀 Run Analysis'}
          </button>
          
          {mode === 'buffer' && (
            <button
              onClick={() => {}}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all text-sm border border-slate-600"
            >
              ⚙️ Options
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-[10px] text-zinc-500">
            ℹ️ Analysis uses City of Cape Town IZS zoning data and GV Roll 2022 valuation data.
            Results are aggregates only - no personal information is displayed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisToolbar;
