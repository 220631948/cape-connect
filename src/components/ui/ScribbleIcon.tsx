import React from 'react';

interface ScribbleIconProps {
  children: React.ReactNode;
  className?: string;
  viewBox?: string;
  size?: number;
}

export const ScribbleIcon: React.FC<ScribbleIconProps> = ({
  children,
  className = '',
  viewBox = "0 0 24 24",
  size = 24
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transform transition-transform group-hover:rotate-6 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g style={{ filter: 'drop-shadow(0 0 2px currentColor)' }}>
        {children}
      </g>
    </svg>
  );
};

export default ScribbleIcon;
