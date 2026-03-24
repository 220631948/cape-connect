/**
 * @file src/lib/auth/auth.ts
 * @description Unified authentication interface for CapeGIS.
 * Wraps @supabase/ssr clients with domain-specific helpers.
 * @compliance POPIA: Handling authentication sessions and PII.
 */

import { createClient } from '@/lib/supabase/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeRole, type CanonicalRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';

export interface UserSession {
  id: string;
  email: string;
  role: CanonicalRole;
  tenantId: string | null;
}

/**
 * Get the current user session on the server (RSC, Actions, Route Handlers).
 * Uses supabase.auth.getUser() for secure server-side verification.
 */
export async function getServerSession(): Promise<UserSession | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch profile for role and tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      role: normalizeRole(profile?.role),
      tenantId: profile?.tenant_id || null,
    };
  } catch (err) {
    console.error('[Auth] Failed to get server session:', err);
    return null;
  }
}

/**
 * Protect a server-side route. Redirects to login if unauthenticated.
 * Optional: specify required roles.
 */
export async function protectRoute(options?: {
  redirectTo?: string;
  allowedRoles?: CanonicalRole[];
}) {
  const session = await getServerSession();
  const redirectTo = options?.redirectTo || '/login';

  if (!session) {
    redirect(redirectTo);
  }

  if (options?.allowedRoles && !options.allowedRoles.includes(session.role)) {
    redirect('/unauthorized');
  }

  return session;
}

/**
 * Sign out helper for client components.
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/login';
}
