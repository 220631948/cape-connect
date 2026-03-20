/**
 * CrayonButton.tsx
 * A neomorphic, "Whimsical Neumorphism" button with wobbly crayon borders.
 */
import React from 'react';

interface CrayonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: 'blue' | 'coral' | 'green' | 'amber' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ACCENT_MAP = {
  blue: 'stroke-[#5B8DEF] shadow-[#5B8DEF/20]',
  coral: 'stroke-[#FF6B6B] shadow-[#FF6B6B/20]',
  green: 'stroke-[#4ECDC4] shadow-[#4ECDC4/20]',
  amber: 'stroke-[#FFB347] shadow-[#FFB347/20]',
  purple: 'stroke-[#A78BFA] shadow-[#A78BFA/20]',
};

export const CrayonButton: React.FC<CrayonButtonProps> = ({ 
  children, 
  onClick, 
  accent = 'blue', 
  size = 'md',
  className = ''
}) => {
  const accentClasses = ACCENT_MAP[accent];
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-6 py-2 text-sm',
    lg: 'px-8 py-4 text-base',
  }[size];

  return (
    <button 
      onClick={onClick}
      className={`
        relative group active:scale-95 transition-all duration-200
        bg-[#12121A] text-[#F0F0F5] font-medium
        rounded-lg border-0 outline-none
        shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.02)]
        hover:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-3px_-3px_8px_rgba(255,255,255,0.03)]
        ${sizeClasses} ${className}
      `}
    >
      {/* Wobbly Crayon SVG Border */}
      <svg 
        className={`absolute inset-0 w-full h-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity ${accentClasses}`}
        viewBox="0 0 100 40" 
        preserveAspectRatio="none"
      >
        <path 
          d="M2,2 Q5,1 10,2 T20,1 T30,2 T40,1 T50,2 T60,1 T70,2 T80,1 T90,2 T98,2 L98,38 Q95,39 90,38 T80,39 T70,38 T60,39 T50,38 T40,39 T30,38 T20,39 T10,38 T2,38 Z"
          fill="none" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 4"
        />
      </svg>
      
      <span className="relative z-10 drop-shadow-sm">{children}</span>
    </button>
  );
};
