/**
 * @file src/hooks/useAuthRefresh.ts
 * @description Proactive JWT refresh hook — monitors session expiry and refreshes before timeout.
 *
 * POPIA ANNOTATION
 * Personal data handled: user session / JWT token metadata
 * Purpose: session continuity and authenticated experience
 * Lawful basis: legitimate interests
 * Retention: request-scoped (no persistence)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const REFRESH_CHECK_INTERVAL_MS = 60_000; // 60 seconds
const REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes before expiry

/**
 * Subscribes to Supabase auth state changes and proactively refreshes
 * the JWT when it's within 5 minutes of expiry. Shows a toast-style
 * message on refresh failure.
 */
export function useAuthRefresh() {
  const toastRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          showToast('Session expired. Please sign in again.');
        }
      }
    );

    // Proactive expiry check
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const nowSeconds = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = session.expires_at! - nowSeconds;

      if (timeUntilExpiry < REFRESH_THRESHOLD_SECONDS) {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          showToast('Session expired. Please sign in again.');
        }
      }
    }, REFRESH_CHECK_INTERVAL_MS);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      dismissToast();
    };
  }, []);

  function showToast(message: string) {
    dismissToast();

    const toast = document.createElement('div');
    toast.setAttribute('data-testid', 'auth-refresh-toast');
    toast.setAttribute('role', 'alert');
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
      'padding:12px 20px', 'border-radius:8px',
      'background:rgba(239,68,68,0.9)', 'color:white',
      'font-size:13px', 'font-weight:600',
      'box-shadow:0 4px 12px rgba(0,0,0,0.3)',
      'animation:slideUp 0.3s ease-out',
    ].join(';');
    toast.textContent = message;

    document.body.appendChild(toast);
    toastRef.current = toast;

    // Auto-dismiss after 8 seconds
    setTimeout(() => dismissToast(), 8000);
  }

  function dismissToast() {
    if (toastRef.current) {
      toastRef.current.remove();
      toastRef.current = null;
    }
  }
}
