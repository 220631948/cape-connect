/**
 * @file src/components/DashboardScreen.tsx
 * @description Neumorphic Cape Town GIS Dashboard shell.
 * @compliance POPIA: Handling spatial property intelligence.
 */

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as turf from '@turf/turf';
import { SourceBadge } from './ui/SourceBadge';
import { MapRef } from './map/MapContainer';
import { CrayonCard } from './ui/CrayonCard';
import AnalysisResultPanel from './analysis/AnalysisResultPanel';
import AnalyticsDashboard from './analysis/AnalyticsDashboard';
import DashboardHeader from './dashboard/DashboardHeader';
import MetricsRow from './dashboard/MetricsRow';
import LiveFlightTelemetry from './dashboard/LiveFlightTelemetry';
import QuickDropArea from './dashboard/QuickDropArea';
import UserManagementPanel from './admin/UserManagementPanel';
import ImpersonationBanner from './admin/ImpersonationBanner';
import InvitationBanner, { Invitation } from './dashboard/InvitationBanner';
import type { ImpersonationState } from './admin/impersonation-types';
import { themes, ThemeName } from '../assets/tokens/themes';
import { useDomainState, DomainMode } from '@/hooks/useDomainState';
import { DomainSidebar } from './dashboard/DomainSidebar';

const SpatialView = dynamic(() => import('./map/SpatialView'), {
  ssr: false, loading: () => <div className="h-full flex items-center justify-center bg-gray-900"><p className="text-gray-400">Loading Immersive Engine... 🐢🌏</p></div>
});

interface DashboardScreenProps {
  theme?: ThemeName;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ theme = 'dark' }) => {
  const { mode, setDomainMode, updateDomainParam } = useDomainState();
  
  // Layer Toggles
  const [showZoning, setShowZoning] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showFirms, setShowFirms] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showDraw, setShowDraw] = useState(false);

  // Analysis State
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [bufferDistance, setBufferDistance] = useState<number>(0);
  const [bufferedFeature, setBufferedFeature] = useState<any>(null);

  // Admin & User State
  const [impersonationState, setImpersonationState] = useState<ImpersonationState | null>(null);
  const [stopImpersonationLoading, setStopImpersonationLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const mapRef = useRef<MapRef>(null);

  const colors = themes[theme];
  const cardShadow = {
    boxShadow: theme === 'high-contrast' ? `1px 1px 0 ${colors.border}` : `8px 8px 16px ${colors.shadow}, -4px -4px 12px ${colors.shadowInset}`,
  };
  const headerShadow = {
    boxShadow: theme === 'high-contrast' ? `1px 1px 0 ${colors.border}` : `0 4px 12px ${colors.shadow}`,
  };

  const refreshImpersonationState = async () => {
    try {
      const response = await fetch('/api/admin/impersonation-state', { cache: 'no-store' });
      if (!response.ok) {
        setImpersonationState(null);
        return;
      }
      const json = await response.json();
      setImpersonationState(json as ImpersonationState);
    } catch {
      setImpersonationState(null);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations/pending');
      const json = await response.json();
      if (json.data) {
        setInvitations(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  useEffect(() => {
    refreshImpersonationState();
    fetchInvitations();
    const sync = () => { refreshImpersonationState(); };
    window.addEventListener('impersonation:changed', sync);
    return () => window.removeEventListener('impersonation:changed', sync);
  }, []);

  const handleAcceptInvitation = async (id: string) => {
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: id }),
      });
      if (response.ok) {
        setInvitations(invitations.filter(i => i.id !== id));
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };

  const handleDeclineInvitation = async (id: string) => {
    try {
      const response = await fetch('/api/invitations/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: id }),
      });
      if (response.ok) {
        setInvitations(invitations.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      setInvitations(invitations.filter(i => i.id !== id));
    }
  };

  const stopImpersonation = async () => {
    setStopImpersonationLoading(true);
    try {
      const response = await fetch('/api/admin/stop-impersonation', { method: 'POST' });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to stop impersonation');
      }
      await refreshImpersonationState();
      window.dispatchEvent(new CustomEvent('impersonation:changed'));
    } catch (error) {
      console.error('Stop impersonation failed:', error);
    } finally {
      setStopImpersonationLoading(false);
    }
  };

  const runAnalysis = async (geomFeat: any) => {
    setAnalysisLoading(true);
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometry: geomFeat.geometry }),
      });
      const json = await response.json();
      setAnalysisResults(json.data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleFeatureCreate = async (feature: any) => {
    setSelectedFeature(feature);
    setBufferDistance(0);
    setBufferedFeature(feature);
    await runAnalysis(feature);
  };

  const handleBufferChange = async (dist: number) => {
    setBufferDistance(dist);
    if (!selectedFeature) return;
    
    if (dist === 0) {
      setBufferedFeature(selectedFeature);
      await runAnalysis(selectedFeature);
      return;
    }
    
    try {
      const buffered = turf.buffer(selectedFeature, dist, { units: 'meters' });
      setBufferedFeature(buffered);
      await runAnalysis(buffered);
    } catch (e) {
      console.error('Buffer error:', e);
    }
  };

  const handleAnalysisClose = () => {
    setAnalysisResults(null);
    setSelectedFeature(null);
    setBufferedFeature(null);
    setBufferDistance(0);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans bg-capetown-dark text-white">
      <ImpersonationBanner
        state={impersonationState}
        stopping={stopImpersonationLoading}
        onStop={stopImpersonation}
      />
      <DashboardHeader 
        colors={colors} 
        headerShadow={headerShadow} 
        impersonationState={impersonationState}
        onSearchSelect={(res) => {
          if (res.geometry?.coordinates) {
            mapRef.current?.flyTo(res.geometry.coordinates);
          }
        }} 
      />

      {/* Domain Status Indicator */}
      <div className="mb-6 flex items-center justify-between bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            mode === 'emergency' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 
            mode === 'environmental' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' :
            mode === 'farmers' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' :
            'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
          }`} />
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">
              {mode.toUpperCase()} MODE
            </h1>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
              Role: {impersonationState?.target_user?.role || 'General Operator'} • System: 2026-METRO-V1
            </p>
          </div>
        </div>
        <div className="hidden sm:flex gap-6">
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase">Latency</div>
            <div className="text-xs font-mono text-emerald-400">12ms</div>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <div className="text-[10px] text-gray-500 uppercase">Tenant</div>
            <div className="text-xs font-mono text-blue-400">CAPETOWN-CORE</div>
          </div>
        </div>
      </div>

      <InvitationBanner
        invitations={invitations}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
        colors={colors}
      />
      
      <MetricsRow colors={colors} cardShadow={cardShadow} theme={theme} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Row 1: Map (2/4) */}
        <CrayonCard 
          colorVariant="blue"
          className="md:col-span-2 lg:col-span-2 xl:col-span-2 relative"
        >
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h2 className="text-base font-bold m-0 text-white">🗺️ Map View</h2>
            <div className="flex gap-2 flex-wrap">
              <SourceBadge source="CoCT IZS" year={2026} tier="MOCK" />
              <button onClick={() => setShowZoning(!showZoning)} className={`px-2 py-1 text-[10px] rounded border transition-colors cursor-pointer ${showZoning ? 'bg-crayon-blue border-crayon-blue text-black' : 'bg-transparent border-crayon-blue/50 text-crayon-blue'}`}>Zoning: {showZoning ? 'ON' : 'OFF'}</button>
              <button onClick={() => setShowSatellite(!showSatellite)} className={`px-2 py-1 text-[10px] rounded border transition-colors cursor-pointer ${showSatellite ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-emerald-500/50 text-emerald-400'}`}>Satellite: {showSatellite ? 'ON' : 'OFF'}</button>
              <button onClick={() => setShowFirms(!showFirms)} className={`px-2 py-1 text-[10px] rounded border transition-colors cursor-pointer ${showFirms ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-orange-500/50 text-orange-400'}`}>FIRMS: {showFirms ? 'ON' : 'OFF'}</button>
              <button onClick={() => setShowTraffic(!showTraffic)} className={`px-2 py-1 text-[10px] rounded border transition-colors cursor-pointer ${showTraffic ? 'bg-red-500 border-red-500 text-white' : 'bg-transparent border-red-500/50 text-red-400'}`}>Traffic: {showTraffic ? 'ON' : 'OFF'}</button>
            </div>
          </div>
          <div className="h-[300px] sm:h-[350px] rounded-lg overflow-hidden relative">
            <SpatialView showZoning={showZoning} showFlights={showFlights} showSatellite={showSatellite} showFirms={showFirms} showTraffic={showTraffic} showDraw={showDraw} onFeatureCreate={handleFeatureCreate} bufferedFeature={bufferedFeature} />
            <AnalysisResultPanel results={analysisResults} loading={analysisLoading} onClose={handleAnalysisClose} colors={colors} bufferDistance={bufferDistance} onBufferChange={handleBufferChange} feature={bufferedFeature} />
          </div>
        </CrayonCard>

        {/* Sidebar: Analytics & Domain Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DomainSidebar colors={colors} />
          
          <CrayonCard 
            colorVariant="blue" 
            className="flex-1 flex flex-col p-5"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {mode === 'general' ? '🗺️ Layer Intelligence' : '🛠️ Domain Overrides'}
              </h2>
            </div>
            <div className="flex-1 min-h-[250px]">
              <AnalyticsDashboard guestMode={theme === 'light'} />
            </div>
          </CrayonCard>

          <CrayonCard colorVariant="yellow">
            <h2 className="text-base font-bold mt-0 text-white">🚀 Quick Actions</h2>
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={() => setShowDraw(!showDraw)} className={`py-3 px-4 border-2 rounded-lg cursor-pointer font-semibold transition-all ${showDraw ? 'bg-crayon-yellow border-black text-black' : 'bg-transparent border-crayon-yellow text-crayon-yellow'}`}>
                {showDraw ? 'Exit Draw Mode' : 'Enter Draw Mode'}
              </button>
              <button onClick={() => setShowFlights(!showFlights)} className={`py-3 px-4 border-2 rounded-lg cursor-pointer font-semibold transition-all ${showFlights ? 'bg-crayon-yellow border-crayon-yellow text-black' : 'bg-transparent border-crayon-yellow text-crayon-yellow'}`}>
                {showFlights ? 'Stop Flight Tracking' : 'Start Flight Tracking'}
              </button>
            </div>
          </CrayonCard>
        </div>

        {/* Row 2: Live Telemetry */}
        <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
          <LiveFlightTelemetry colors={colors} cardShadow={cardShadow} />
        </div>

        {/* Row 2: Quick Drop Area */}
        <div className="md:col-span-2 lg:col-span-1 xl:col-span-2">
          <QuickDropArea colors={colors} cardShadow={cardShadow} />
        </div>

        {/* Row 3: Admin Panel (full width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <UserManagementPanel />
        </div>
      </div>

      <footer className="mt-10 p-4 text-center text-xs text-gray-500">
        Cape Town GIS Platform • 🐢✨
      </footer>
    </div>
  );
};

export default DashboardScreen;
