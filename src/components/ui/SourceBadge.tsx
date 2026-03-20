/**
 * @file src/components/ui/SourceBadge.tsx
 * @description Mandatory source attribution and tier indicator.
 * @compliance POPIA: Transparent data provenance reporting.
 */

import React from 'react';

export type DataTier = 'LIVE' | 'CACHED' | 'MOCK';

interface SourceBadgeProps {
  source: string;
  year: number;
  tier: DataTier;
  timestamp?: string; // ISO 8601 or formatted string
  theme?: 'light' | 'dark';
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  year,
  tier,
  timestamp,
  theme = 'dark',
}) => {
  const tierColors = {
    LIVE: '#2d9d7f', // Teal Serenity
    CACHED: '#3B82F6', // Blue
    MOCK: '#F59E0B', // Amber/Warning
  };

  const currentTheme = theme === 'dark' ? {
    bg: 'rgba(55, 65, 81, 0.8)',
    text: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.3)',
  } : {
    bg: 'rgba(255, 255, 255, 0.8)',
    text: '#1a202c',
    shadow: 'rgba(163, 177, 198, 0.3)',
  };

  // Simple formatting for timestamp if it's a date string
  const formattedTime = timestamp && !isNaN(Date.parse(timestamp))
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : timestamp;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          background: currentTheme.bg,
          borderRadius: '20px',
          fontSize: '10px',
          fontWeight: 700,
          color: currentTheme.text,
          backdropFilter: 'blur(4px)',
          boxShadow: `2px 2px 5px ${currentTheme.shadow}`,
          border: `1px solid ${tierColors[tier]}`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <span style={{ opacity: 0.8 }}>{source}</span>
        <span style={{ margin: '0 6px', opacity: 0.4 }}>•</span>
        <span style={{ opacity: 0.8 }}>{year}</span>
        <span style={{ margin: '0 6px', opacity: 0.4 }}>•</span>
        <span style={{ color: tierColors[tier] }}>{tier}</span>
      </div>
      {formattedTime && (
        <div style={{ fontSize: '9px', color: currentTheme.text, opacity: 0.6, paddingLeft: '8px' }}>
          Last updated: {formattedTime}
        </div>
      )}
    </div>
  );
};

export default SourceBadge;
