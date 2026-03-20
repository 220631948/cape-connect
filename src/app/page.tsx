import React from 'react';
import type { Metadata } from 'next';
import HomeHero from '../components/home/HomeHero';
import FeatureGrid from '../components/home/FeatureGrid';
import LivePulseTicker from '../components/home/LivePulseTicker';
import WaxTrailCursor from '../components/ui/WaxTrailCursor';

export const metadata: Metadata = {
  title: 'CapeTown GIS Hub | Cyber-Crayon Edition',
  description: 'Trace the pulse of the Mother City with next-generation spatial intelligence and real-time urban telemetry.',
  keywords: ['Cape Town', 'GIS', 'Property Valuation', 'Flight Tracking', 'Spatial Analysis'],
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0C10] text-white selection:bg-crayon-pink/30 cursor-none">
      <WaxTrailCursor />
      
      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5" style={{ 
        backgroundImage: `radial-gradient(var(--color-crayon-blue) 0.5px, transparent 0.5px)`, 
        backgroundSize: '30px 30px' 
      }} />

      {/* Content */}
      <div className="relative z-10">
        <HomeHero />
        <FeatureGrid />
        
        {/* Footer info */}
        <footer className="pt-12 pb-32 px-4 text-center border-t border-zinc-900 mt-24">
          <div className="mb-8">
            <span className="text-crayon-blue font-black text-2xl tracking-tighter italic">CAPE TOWN GIS</span>
          </div>
          <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
            Proprietary spatial data intelligence for the 2026 Metropolitan Vision. 
            All economic contours and airspace corridors are simulated for analysis.
          </p>
        </footer>
      </div>

      <LivePulseTicker />
    </main>
  );
}
