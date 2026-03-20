'use client';

/**
 * POPIA ANNOTATION
 * Personal data handled: user identifiers, names, emails, admin reauthentication inputs
 * Purpose: explicit admin confirmation before delegated impersonation
 * Lawful basis: legitimate interests
 * Retention: form state is in-memory and cleared on modal close
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import React, { useEffect, useRef, useState } from 'react';
import type { TenantUser } from './UserManagementPanel';
import type { StartImpersonationPayload } from './impersonation-types';

interface ImpersonationModalProps {
  open: boolean;
  targetUser: TenantUser | null;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (payload: StartImpersonationPayload) => Promise<void>;
}

const DURATION_OPTIONS = [
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
  { label: '15 minutes', value: 900 },
];

export const ImpersonationModal: React.FC<ImpersonationModalProps> = ({
  open,
  targetUser,
  loading,
  error,
  onCancel,
  onConfirm,
}) => {
  const reasonRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(900);
  const [currentPassword, setCurrentPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setDurationSeconds(900);
    setCurrentPassword('');
    setMfaCode('');
    reasonRef.current?.focus();
  }, [open]);

  if (!open || !targetUser) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onConfirm({
      target_user_id: targetUser.id,
      reason: reason || undefined,
      duration_seconds: durationSeconds,
      current_password: currentPassword,
      mfa_code: mfaCode || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="impersonation-modal-title"
        className="w-full max-w-xl rounded-2xl border border-crayon-coral/50 bg-capetown-card p-5 shadow-2xl"
      >
        <h3 id="impersonation-modal-title" className="mb-2 text-lg font-black text-white">
          Impersonate user
        </h3>
        <p className="mb-4 text-xs text-gray-300">
          You are about to act as <strong>{targetUser.full_name || targetUser.email}</strong>.
          Actions are audited and attributed to your admin account.
        </p>

        <form className="space-y-3" onSubmit={submit}>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              Reason (optional)
            </span>
            <input
              ref={reasonRef}
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              className="w-full rounded-lg border border-white/20 bg-capetown-dark px-3 py-2 text-sm text-white"
              aria-label="Impersonation reason"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              Session duration
            </span>
            <select
              value={durationSeconds}
              onChange={(event) => setDurationSeconds(Number(event.target.value))}
              className="w-full rounded-lg border border-white/20 bg-capetown-dark px-3 py-2 text-sm text-white"
              aria-label="Impersonation duration"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              Current password (required)
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-capetown-dark px-3 py-2 text-sm text-white"
              aria-label="Current password"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-300">
              MFA code (if enabled)
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-capetown-dark px-3 py-2 text-sm text-white"
              aria-label="MFA code"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/30 px-3 py-2 text-xs font-bold text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-crayon-coral px-3 py-2 text-xs font-black text-black disabled:opacity-50"
              aria-label="Confirm impersonation"
            >
              {loading ? 'Starting...' : 'Start impersonation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImpersonationModal;
