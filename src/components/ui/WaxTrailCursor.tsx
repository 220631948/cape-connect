'use client';

import React, { useEffect, useState, useRef } from 'react';

export const WaxTrailCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const trails = useRef<{ x: number; y: number; id: string }[]>([]);
  const [trailList, setTrailList] = useState<{ x: number; y: number; id: string }[]>([]);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');

      // Add to trails with a unique ID
      const newTrail = { x: e.clientX, y: e.clientY, id: crypto.randomUUID() };
      trails.current = [newTrail, ...trails.current.slice(0, 15)];
      setTrailList([...trails.current]);
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 w-6 h-6 bg-crayon-blue rounded-full pointer-events-none z-[9999] mix-blend-screen transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${position.x - 12}px, ${position.y - 12}px) scale(${isPointer ? 1.5 : 1})`,
          boxShadow: '0 0 20px var(--color-crayon-blue)'
        }}
      />
      {trailList.map((trail, index) => (
        <div
          key={trail.id}
          className="fixed top-0 left-0 w-4 h-4 bg-crayon-pink rounded-full pointer-events-none z-[9998] mix-blend-screen transition-opacity duration-500"
          style={{
            transform: `translate(${trail.x - 8}px, ${trail.y - 8}px)`,
            opacity: (10 - index) / 20,
            boxShadow: '0 0 10px var(--color-crayon-pink)'
          }}
        />
      ))}
    </>
  );
};

export default WaxTrailCursor;
