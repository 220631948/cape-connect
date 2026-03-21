import React from 'react';

/**
 * AIWatermark Component
 *
 * Non-removable overlay component indicating AI-reconstructed content.
 * Required by GIS_MASTER_CONTEXT §9 before any AI feature is enabled.
 */
export function AIWatermark() {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] rounded bg-yellow-500/90 px-3 py-1.5 text-xs font-bold text-black shadow-lg backdrop-blur-sm"
      style={{ userSelect: 'none' }}
      aria-hidden="true"
    >
      ⚠️ AI-reconstructed — not verified ground truth
    </div>
  );
}

export default AIWatermark;
