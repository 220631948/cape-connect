'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MapContainer, { MapRef } from '@/components/map/MapContainer';
import AnalysisToolbar from '@/components/map/controls/AnalysisToolbar';
import SourceBadge from '@/components/ui/SourceBadge';

const AnalyticsDashboard = dynamic(() => import('@/components/analysis/AnalyticsDashboard').then(mod => ({ default: mod.AnalyticsDashboard })), {
  ssr: false,
  loading: () => <div className="p-4 text-zinc-300">Loading analytics...</div>
});

const ExportPanel = dynamic(() => import('@/components/analysis/ExportPanel'), {
  ssr: false,
  loading: () => <div className="text-[10px] text-slate-500 mt-2 italic">Loading export tools...</div>
});

export default function AnalysisPageClient() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'buffer' | 'intersect' | null>(null);
  const [bufferDistance, setBufferDistance] = useState(500);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const mapRef = React.useRef<MapRef>(null);

  // Theme colors for ExportPanel compatibility
  const themeColors = {
    surface: '#1e293b',
    bg: '#0f172a',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    accent: '#10b981',
    shadow: 'rgba(0, 0, 0, 0.3)',
  };

  const handleFeatureCreate = useCallback((feature: any) => {
    setSelectedFeature(feature);
    setAnalysisMode('buffer');
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    if (!selectedFeature) return;

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: analysisMode,
          feature: selectedFeature,
          bufferDistance: analysisMode === 'buffer' ? bufferDistance : undefined,
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setAnalysisResults(results);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [selectedFeature, analysisMode, bufferDistance]);

  const handleClearAnalysis = useCallback(() => {
    setSelectedFeature(null);
    setAnalysisResults(null);
    setAnalysisMode(null);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0B0C10]">
      {/* Map */}
      <MapContainer
        ref={mapRef}
        className="absolute inset-0"
        showDraw={true}
        showZoning={true}
        showSuburbs={true}
        onFeatureCreate={handleFeatureCreate}
        bufferedFeature={analysisMode === 'buffer' && selectedFeature ? {
          ...selectedFeature,
          properties: { ...selectedFeature.properties, bufferDistance }
        } : null}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-4 pointer-events-none">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-slate-800/90 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 transition-all shadow-lg"
            >
              {showAnalytics ? '🗺️ Map' : '📊 Analytics'}
            </button>
            <SourceBadge source="Analysis" year={2026} tier="LIVE" />
          </div>
          
          <div className="text-right">
            <h1 className="text-xl font-black text-white tracking-tight">SPATIAL ANALYSIS</h1>
            <p className="text-xs text-zinc-400">M17 Advanced Geospatial Intelligence</p>
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="absolute top-20 left-4 z-[100] w-96 max-h-[calc(100vh-8rem)] overflow-y-auto bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-2xl">
          <AnalyticsDashboard />
        </div>
      )}

      {/* Analysis Toolbar */}
      <AnalysisToolbar
        mode={analysisMode}
        bufferDistance={bufferDistance}
        onBufferChange={setBufferDistance}
        onRunAnalysis={handleRunAnalysis}
        onClearAnalysis={handleClearAnalysis}
        hasFeature={!!selectedFeature}
        isProcessing={!!analysisResults}
      />

      {/* Results Panel */}
      {analysisResults && (
        <div className="absolute bottom-20 right-4 z-[100] w-80 bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-2xl p-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Results</h3>
            <button
              onClick={handleClearAnalysis}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Properties</span>
              <span className="text-lg font-bold text-emerald-400">{analysisResults.property_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Total Valuation</span>
              <span className="text-lg font-bold text-emerald-400">
                R{(analysisResults.total_valuation / 1000000).toFixed(1)}M
              </span>
            </div>
            {analysisResults.zoning_breakdown && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-xs text-zinc-400 mb-2">Zoning Breakdown</div>
                {Object.entries(analysisResults.zoning_breakdown).map(([zone, count]) => (
                  <div key={zone} className="flex justify-between items-center text-xs py-1">
                    <span className="text-zinc-300">{zone}</span>
                    <span className="text-white font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Panel */}
          {selectedFeature && (
            <ExportPanel
              feature={selectedFeature}
              results={analysisResults}
              colors={themeColors}
            />
          )}

          {/* Data Source Info */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-[10px] text-zinc-500">
              Source: {analysisResults.source || 'GV Roll 2022'} | {analysisResults.year || 2022} | Tier: {analysisResults.tier || 'LIVE'}
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!selectedFeature && !analysisResults && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] text-center">
          <p className="text-sm text-zinc-300 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700">
            🎨 Draw a shape on the map to start analysis
          </p>
        </div>
      )}
    </div>
  );
}
