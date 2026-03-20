/**
 * @file src/components/search/SearchOverlay.tsx
 * @description Global Search Autocomplete UI with Neumorphic Styling.
 * @compliance POPIA: Handling tenant-scoped property search interactions.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SourceBadge, DataTier } from '../ui/SourceBadge';

interface SearchResult {
  id: string;
  address: string;
  parcel_id: string;
  geometry: any;
  rank: number;
}

interface SearchOverlayProps {
  onSelect: (result: SearchResult) => void;
  colors: any;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ onSelect, colors }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [tier, setTier] = useState<DataTier>('LIVE');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await response.json();
        setResults(json.data);
        setTier(json.tier);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search Address or ERF..."
          aria-label="Search by address or ERF number"
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            background: colors.cardBg,
            color: colors.text,
            fontSize: '14px',
            outline: 'none',
            boxShadow: `inset 2px 2px 5px ${colors.shadow}, inset -2px -2px 5px ${colors.shadowInset}`,
          }}
        />
        {loading && <span style={{ fontSize: '12px' }}>⌛</span>}
      </div>

      {isOpen && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 8px 16px ${colors.shadow}`,
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: colors.textSecondary }}>RESULTS</span>
            <SourceBadge source="CoCT Geocoder" year={2026} tier={tier} />
          </div>
          {results.map((res) => (
            <div
              key={res.id}
              onClick={() => {
                onSelect(res);
                setIsOpen(false);
                setQuery(res.address);
              }}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.border}`,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <strong style={{ display: 'block', fontSize: '13px' }}>{res.address}</strong>
              <span style={{ fontSize: '11px', color: colors.textSecondary }}>ERF: {res.parcel_id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
