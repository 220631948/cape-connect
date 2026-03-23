/**
 * @file src/lib/supabase/server.ts
 * @description Server-side Supabase instance for RSC and Actions.
 * @compliance POPIA: Handling server-side user sessions and PII.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle edge case where set is called in RSC
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle edge case where remove is called in RSC
          }
        },
      },
    }
  );
};

/**
 * Sets app.current_tenant via RPC before returning the client.
 * Must be called before any RLS-protected query.
 * Throws if tenantId is null/undefined — never silently skip.
 *
 * @param client - Supabase server client from createServerSupabaseClient()
 * @param tenantId - The tenant UUID to inject into the PostgreSQL session
 * @returns The same client (for chaining)
 */
export async function withTenantContext<T extends { rpc: (...args: any[]) => any }>(
  client: T,
  tenantId: string | null | undefined
): Promise<T> {
  if (!tenantId) {
    throw new Error('withTenantContext: tenantId is required but was null/undefined');
  }

  const { error } = await client.rpc('set_tenant_context', { tenant_id: tenantId });

  if (error) {
    throw new Error(`withTenantContext: failed to set tenant context — ${error.message}`);
  }

  return client;
}
