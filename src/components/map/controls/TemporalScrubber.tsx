'use client';

import React, { useState, useEffect } from 'react';

interface StacItem {
  id: string;
  datetime: string;
  assets: {
    data: {
      href: string;
    }
  }
}

interface TemporalScrubberProps {
  onDateChange: (item: StacItem) => void;
  className?: string;
}

export const TemporalScrubber: React.FC<TemporalScrubberProps> = ({
  onDateChange,
  className,
}) => {
  const [items, setItems] = useState<StacItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    // In a real app, fetch from GCS or /api/stac
    // For now, we'll use a mock based on the prompt's example
    const mockStac: StacItem[] = [
      {
        id: "cct-cadastral-2024-01",
        datetime: "2024-01-01T00:00:00Z",
        assets: { data: { href: "gs://cape-town-rasters/cadastral/2024-01.pmtiles" } }
      },
      {
        id: "cct-cadastral-2024-02",
        datetime: "2024-02-01T00:00:00Z",
        assets: { data: { href: "gs://cape-town-rasters/cadastral/2024-02.pmtiles" } }
      },
      {
        id: "cct-cadastral-2024-03",
        datetime: "2024-03-01T00:00:00Z",
        assets: { data: { href: "gs://cape-town-rasters/cadastral/2024-03.pmtiles" } }
      }
    ];
    setItems(mockStac);
    if (mockStac.length > 0) {
      onDateChange(mockStac[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    setSelectedIndex(idx);
    onDateChange(items[idx]);
  };

  if (items.length === 0) return null;

  const currentDate = new Date(items[selectedIndex].datetime).toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black uppercase tracking-widest text-crayon-pink">Timeline</span>
        <span className="text-sm font-mono text-white">{currentDate}</span>
      </div>
      <input
        type="range"
        min="0"
        max={items.length - 1}
        step="1"
        value={selectedIndex}
        onChange={handleChange}
        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-crayon-pink hover:accent-crayon-blue transition-all"
      />
      <div className="flex justify-between mt-1 px-1">
         {items.map((_, i) => (
           <div key={i} className={`w-1 h-3 rounded-full ${i === selectedIndex ? 'bg-crayon-blue' : 'bg-zinc-700'}`} />
         ))}
      </div>
    </div>
  );
};

export default TemporalScrubber;
