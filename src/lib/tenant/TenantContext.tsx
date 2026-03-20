/**
 * @file src/lib/tenant/TenantContext.tsx
 * @description React Context for Tenant White-labeling.
 * @compliance Rule 4: Tenant isolation.
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';

export interface TenantConfig {
  primaryColor: string;
  secondaryColor: string;
  brandName: string;
  logoUrl: string | null;
  fontFamily: string;
  features: {
    drawTools: boolean;
    pdfExport: boolean;
    analyticsTab: boolean;
    flightTracking: boolean;
  };
}

const WHITELABEL_DEFAULTS: TenantConfig = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  brandName: 'CapeTown GIS Hub',
  logoUrl: null,
  fontFamily: 'Inter',
  features: {
    drawTools: true,
    pdfExport: false,
    analyticsTab: true,
    flightTracking: true,
  },
};

const TenantContext = createContext<TenantConfig>(WHITELABEL_DEFAULTS);

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ config: Partial<TenantConfig>; children: React.ReactNode }> = ({
  config,
  children,
}) => {
  const mergedConfig = useMemo(() => ({
    ...WHITELABEL_DEFAULTS,
    ...config,
    features: {
      ...WHITELABEL_DEFAULTS.features,
      ...config.features,
    },
  }), [config]);

  useEffect(() => {
    // Inject CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', mergedConfig.primaryColor);
    root.style.setProperty('--color-secondary', mergedConfig.secondaryColor);
    
    // Apply font family if provided
    if (mergedConfig.fontFamily !== 'Inter') {
      root.style.fontFamily = mergedConfig.fontFamily;
    }
  }, [mergedConfig]);

  return (
    <TenantContext.Provider value={mergedConfig}>
      {children}
    </TenantContext.Provider>
  );
};
