import React from 'react';

interface GlowingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pink' | 'yellow' | 'blue';
  children: React.ReactNode;
}

export const GlowingButton: React.FC<GlowingButtonProps> = ({ 
  variant = 'blue', 
  children, 
  className = '',
  ...props 
}) => {
  const variantStyles = {
    pink: 'border-crayon-pink text-crayon-pink hover:bg-crayon-pink/10 shadow-[0_0_10px_rgba(255,97,239,0.3)] hover:shadow-[0_0_20px_rgba(255,97,239,0.6)]',
    yellow: 'border-crayon-yellow text-crayon-yellow hover:bg-crayon-yellow/10 shadow-[0_0_10px_rgba(255,215,0,0.3)] hover:shadow-[0_0_20px_rgba(255,215,0,0.6)]',
    blue: 'border-crayon-blue text-crayon-blue hover:bg-crayon-blue/10 shadow-[0_0_10px_rgba(0,209,255,0.3)] hover:shadow-[0_0_20px_rgba(0,209,255,0.6)]',
  };

  return (
    <button 
      className={`
        relative px-8 py-3 
        border-2 font-bold uppercase tracking-widest 
        transition-all duration-300 
        hover:-translate-y-1 active:translate-y-0.5
        rounded-[12px_4px_16px_4px/4px_16px_4px_12px]
        animate-pulse hover:animate-none
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
      <span className="absolute inset-0 rounded-inherit opacity-20 bg-current blur-md -z-10 group-hover:opacity-40 transition-opacity" />
    </button>
  );
};

export default GlowingButton;
