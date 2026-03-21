/**
 * @file src/components/dashboard/QuickDropArea.tsx
 * @description Visual drop-zone for GeoJSON files with a yellow dashed border.
 */

import React, { useState } from 'react';
import { CrayonCard } from '../ui/CrayonCard';

interface QuickDropAreaProps {
  // Props kept for compatibility but inline styles removed
  colors?: any;
  cardShadow?: any;
}

const QuickDropArea: React.FC<QuickDropAreaProps> = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const allowedExtensions = ['.geojson', '.kml', '.czml', '.gpx', '.csv'];

    const invalidFiles = files.filter(file => {
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return !allowedExtensions.includes(extension);
    });

    if (invalidFiles.length > 0) {
      setError(`Unsupported format: ${invalidFiles[0].name.split('.').pop()?.toUpperCase()}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    console.log('Files accepted:', files);
  };

  return (
    <div
      className="relative h-full group"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CrayonCard
        colorVariant="yellow"
        className={`h-full flex flex-col items-center justify-center min-h-[120px] md:min-h-[200px] border-dashed border-2 border-crayon-yellow/50 transition-all duration-300 overflow-hidden ${
          isDragging ? 'scale-[1.02] border-crayon-yellow' : ''
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <span className="text-2xl md:text-3xl mb-2 md:mb-3 drop-shadow-sm">{error ? '❌' : '📁'}</span>
          <h3 className={`text-xs md:text-sm font-bold mb-1 ${error ? 'text-red-400' : 'text-white'}`}>
            {error ? 'Invalid Format' : 'Quick Spatial Drop'}
          </h3>
          <p className={`text-[8px] md:text-[10px] leading-relaxed max-w-[120px] ${error ? 'text-red-400' : 'text-zinc-300'}`}>
            {error ? error : 'Drag GeoJSON, KML, CZML, GPX or CSV'}
          </p>
        </div>

        {/* Coming Soon Overlay - only show if no error */}
        {!error && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-100 transition-opacity duration-300">
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg bg-crayon-yellow text-black">
              Coming Soon 🚧
            </div>
            <p className="text-[9px] mt-2 text-white/50 font-medium">Local ETL Engine v0.1</p>
          </div>
        )}
      </CrayonCard>
    </div>
  );
};

export default QuickDropArea;
