/**
 * @file src/lib/tenant/server.ts
 * @description Server-side utilities for tenant config resolution.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TenantConfig } from './TenantContext';

export async function getTenantConfig(tenantId: string): Promise<Partial<TenantConfig>> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: settings, error } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error || !settings) return {};

    return {
      primaryColor: settings.primary_color,
      secondaryColor: settings.secondary_color,
      brandName: settings.brand_name,
      logoUrl: settings.logo_url,
      fontFamily: settings.font_family,
      features: settings.features,
    };
  } catch (error) {
    console.error('[Tenant Config Error]:', error);
    return {};
  }
}
