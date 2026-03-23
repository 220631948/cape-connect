/**
 * @file src/hooks/useSessionRole.ts
 * @description Resolves the canonical RBAC role from the profiles table (not JWT claims).
 *
 * POPIA ANNOTATION
 * Personal data handled: user ID, role
 * Purpose: RBAC enforcement in UI components
 * Lawful basis: legitimate interests
 * Retention: component lifecycle (no persistence)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { type CanonicalRole, normalizeRole } from '@/lib/auth/roles';

interface SessionRoleResult {
  role: CanonicalRole;
  loading: boolean;
  tenantId: string | null;
}

/**
 * Fetches the canonical role from the `profiles` table for the current user.
 * Returns 'GUEST' when no session exists.
 * Role is sourced from DB — NOT from JWT claims.
 */
export function useSessionRole(): SessionRoleResult {
  const [role, setRole] = useState<CanonicalRole>('GUEST');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function resolveRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setRole('GUEST');
          setTenantId(null);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          setRole('GUEST');
          setTenantId(null);
          return;
        }

        setRole(normalizeRole(profile.role));
        setTenantId(profile.tenant_id);
      } catch {
        setRole('GUEST');
        setTenantId(null);
      } finally {
        setLoading(false);
      }
    }

    resolveRole();
  }, []);

  return { role, loading, tenantId };
}
