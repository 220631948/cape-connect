'use client';

/**
 * POPIA ANNOTATION
 * Personal data handled: user identifiers, names, emails, role metadata
 * Purpose: transparent notice that delegated admin impersonation is active
 * Lawful basis: legitimate interests
 * Retention: in-memory UI state only
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import React from 'react';
import type { ImpersonationState } from './impersonation-types';

interface ImpersonationBannerProps {
  state: ImpersonationState | null;
  stopping: boolean;
  onStop: () => Promise<void>;
}

const formatTime = (iso?: string) => {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  state,
  stopping,
  onStop,
}) => {
  if (!state?.is_impersonating || !state.target_user) return null;

  const targetName = state.target_user.name || state.target_user.email || state.target_user.id;

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-crayon-coral bg-crayon-coral/15 px-4 py-3"
      aria-label="Impersonation status banner"
      role="status"
    >
      <div className="text-sm text-white">
        <span className="font-black text-crayon-coral">Impersonation active:</span>{' '}
        You are impersonating <strong>{targetName}</strong>. Actions are audited.
        <span className="ml-2 text-xs text-gray-300">
          Expires: {formatTime(state.expires_at)}
        </span>
      </div>
      <button
        type="button"
        className="rounded-lg bg-crayon-coral px-3 py-2 text-xs font-black text-black disabled:opacity-50"
        onClick={onStop}
        disabled={stopping}
        aria-label="Stop impersonation and return to admin"
      >
        {stopping ? 'Stopping...' : 'Return to admin'}
      </button>
    </div>
  );
};

export default ImpersonationBanner;
