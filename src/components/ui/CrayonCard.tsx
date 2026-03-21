import React from 'react';

interface CrayonCardProps {
  children: React.ReactNode;
  colorVariant?: 'pink' | 'yellow' | 'blue';
  className?: string;
}

export const CrayonCard: React.FC<CrayonCardProps> = ({ children, colorVariant = 'blue', className = '' }) => {
  const variantClasses = {
    pink: 'border-crayon-pink/20 hover:border-crayon-pink/60 hover:shadow-[0_0_30px_-5px_var(--color-crayon-pink)]',
    yellow: 'border-crayon-yellow/20 hover:border-crayon-yellow/60 hover:shadow-[0_0_30px_-5px_var(--color-crayon-yellow)]',
    blue: 'border-crayon-blue/20 hover:border-crayon-blue/60 hover:shadow-[0_0_30px_-5px_var(--color-crayon-blue)]',
  };

  return (
    <div
      className={`
        bg-[#161B22]/80
        backdrop-blur-sm
        border
        p-6
        transition-all
        duration-500
        hover:scale-[1.02]
        text-zinc-300
        group
        ${variantClasses[colorVariant]}
        ${className}
      `}
      style={{
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px'
      }}
    >
      {children}
    </div>
  );
};

export default CrayonCard;
