/**
 * @file src/components/dashboard/GuestDashboard.tsx
 * @description Restricted dashboard view for GUEST role (CLAUDE.md Context isolation rule §6).
 * Shows only the map with basic layers. No protected features.
 *
 * POPIA ANNOTATION
 * Personal data handled: none
 * Purpose: restricted fallback view for unassigned users
 */

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';

const MapView = dynamic(() => import('@/components/map/SpatialView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-capetown-dark text-white/50">
      Loading map...
    </div>
  ),
});

export default function GuestDashboard() {
  // Proactive JWT refresh
  useAuthRefresh();

  return (
    <div className="flex h-screen bg-capetown-dark text-white/90 font-sans overflow-hidden">
      {/* Sidebar: Bare Minimum for Guests */}
      <div className="w-[300px] flex-shrink-0 bg-black/60 border-r border-white/10 flex flex-col p-6 z-10 backdrop-blur-md shadow-2xl relative">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden">
              <span className="text-xl">🌍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                Guest View
              </h1>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mt-0.5">
                CapeTown GIS
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-white/70 bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
            You are currently logged in as a <strong>Guest</strong>. You can view the public map, but analytics, exports, and admin tools require a role assignment.
          </p>
          <p className="text-xs text-white/50 px-2 italic">
            Wait for an invitation to join a workspace, or contact a PLATFORM_ADMIN.
          </p>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative order-first md:order-none z-0">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-capetown-dark text-white/30 text-sm tracking-wider">
            INITIALIZING MAP ENGINE...
          </div>
        }>
          <MapView />
        </Suspense>
      </div>
    </div>
  );
}
