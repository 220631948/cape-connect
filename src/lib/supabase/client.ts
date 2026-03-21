/**
 * @file src/lib/supabase/client.ts
 * @description Client-side Supabase instance using @supabase/ssr pattern.
 * @compliance POPIA: Handling authentication sessions.
 */

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
