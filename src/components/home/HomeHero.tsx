import React from 'react';
import { GlowingButton } from '../ui/GlowingButton';
import Link from 'next/link';

export const HomeHero: React.FC = () => {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Background Decorative Scribble (simulated with SVG) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-20 blur-xl pointer-events-none w-full max-w-4xl">
        <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M100,500 Q 250,100 500,500 T 900,500" 
            fill="none" 
            stroke="var(--color-crayon-blue)" 
            strokeWidth="20" 
            strokeLinecap="round"
            className="animate-pulse"
          />
          <path 
            d="M200,400 Q 400,800 600,400 T 800,400" 
            fill="none" 
            stroke="var(--color-crayon-pink)" 
            strokeWidth="15" 
            strokeLinecap="round"
            className="animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
        </svg>
      </div>

      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8">
        TRACE THE <span className="text-crayon-blue drop-shadow-[0_0_15px_var(--color-crayon-blue)]">PULSE</span><br />
        OF THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-crayon-pink to-crayon-yellow drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">MOTHER CITY</span>
      </h1>

      <p className="max-w-2xl text-xl text-zinc-400 mb-12 font-medium">
        Cape Town's definitive spatial intelligence platform. 
        Where economic data meets the hand-drawn precision of urban exploration.
      </p>

      <div className="flex flex-wrap gap-6 justify-center">
        <Link href="/dashboard">
          <GlowingButton variant="blue">
            Explore Map
          </GlowingButton>
        </Link>
        <Link href="/analysis">
          <GlowingButton variant="pink">
            📐 Spatial Analysis
          </GlowingButton>
        </Link>
        <Link href="/login">
          <GlowingButton variant="pink">
            Tenant Login
          </GlowingButton>
        </Link>
      </div>

      {/* Decorative Arrow */}
      <div className="mt-20 animate-bounce text-zinc-600">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </div>
    </section>
  );
};

export default HomeHero;
