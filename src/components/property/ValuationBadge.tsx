/**
 * @file src/components/property/ValuationBadge.tsx
 * @description Specialized Source Badge for Property Valuations.
 * @compliance POPIA: Handling municipal valuation attribution.
 */

'use client';

import React from 'react';
import { SourceBadge, DataTier } from '../ui/SourceBadge';

interface ValuationBadgeProps {
  tier: DataTier;
  year?: number;
}

export const ValuationBadge: React.FC<ValuationBadgeProps> = ({
  tier,
  year = 2024,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <SourceBadge source="CoCT GV Roll" year={year} tier={tier} />
      <span 
        style={{ 
          fontSize: '10px', 
          color: '#718096', 
          fontStyle: 'italic',
          lineHeight: '1.2'
        }}
      >
        Municipal valuations for rating purposes only.
      </span>
    </div>
  );
};

export default ValuationBadge;
