/**
 * @file src/hooks/useInvitations.ts
 * @description Invitation state management with optimistic updates, retry, and error banner.
 *
 * POPIA ANNOTATION
 * Personal data handled: invitation data (email, role, tenant ID)
 * Purpose: invitation lifecycle management in dashboard
 * Lawful basis: legitimate interests
 * Retention: component lifecycle (no persistence)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Invitation } from '@/components/dashboard/InvitationBanner';

const RETRY_DELAY_MS = 3000;

interface UseInvitationsResult {
  invitations: Invitation[];
  fetchError: string | null;
  loading: boolean;
  acceptInvitation: (id: string) => Promise<void>;
  declineInvitation: (id: string) => Promise<void>;
  dismissError: () => void;
}

/**
 * Manages invitation state with:
 * - Optimistic accept/decline (no window.location.reload)
 * - Single retry on fetch failure after 3s
 * - Dismissible error banner on persistent failure
 */
export function useInvitations(): UseInvitationsResult {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async (isRetry = false) => {
    try {
      const res = await fetch('/api/invitations/pending');
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      setInvitations(json.data ?? []);
      setFetchError(null);
    } catch {
      if (!isRetry) {
        setTimeout(() => fetchInvitations(true), RETRY_DELAY_MS);
      } else {
        setFetchError('Could not load invitations. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const acceptInvitation = useCallback(async (id: string) => {
    // Optimistic remove
    setInvitations((prev) => prev.filter((i) => i.id !== id));

    try {
      await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: id }),
      });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }

    // Background re-fetch to confirm
    fetchInvitations();
  }, [fetchInvitations]);

  const declineInvitation = useCallback(async (id: string) => {
    // Optimistic remove
    setInvitations((prev) => prev.filter((i) => i.id !== id));

    try {
      await fetch('/api/invitations/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: id }),
      });
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }

    // Background re-fetch
    fetchInvitations();
  }, [fetchInvitations]);

  const dismissError = useCallback(() => {
    setFetchError(null);
  }, []);

  return {
    invitations,
    fetchError,
    loading,
    acceptInvitation,
    declineInvitation,
    dismissError,
  };
}
