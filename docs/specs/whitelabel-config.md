# White-Label Configuration

> **TL;DR:** Each tenant may override logo, brand colours, fonts, and map style via the
> `tenant_settings` table. Settings are resolved once per request in Edge Middleware, merged
> with platform defaults, and injected into the React tree via a `TenantProvider` context.

| Field | Value |
|-------|-------|
| **Milestone** | M12 — Multi-Tenant White-Labeling |
| **Status** | Draft |
| **Depends on** | `11-multitenant-architecture.md`, M1 DB schema |
| **Architecture refs** | [SYSTEM_DESIGN](../architecture/SYSTEM_DESIGN.md) |

---

## Overview

CapeTown GIS Hub supports white-labelling at three levels:

| Level | What changes | Who controls it |
|-------|-------------|-----------------|
| **Branding** | Logo, colours, font family | TENANT_ADMIN |
| **Map style** | MapLibre base style JSON | TENANT_ADMIN (POWER_USER read-only) |
| **Feature flags** | Enable/disable product features | PLATFORM_ADMIN only |

All settings are stored in `tenant_settings` (one row per tenant). Defaults are applied at
runtime if a field is `NULL`, ensuring new tenants receive a functional platform immediately.

---

## `tenant_settings` Schema Reference

### Current Schema (live)

```sql
CREATE TABLE IF NOT EXISTS tenant_settings (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id             UUID        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color         TEXT        DEFAULT '#3B82F6',
    logo_url              TEXT,                           -- NULL → platform default logo
    font_family           TEXT        DEFAULT 'Inter',
    map_style_override_json JSONB,                        -- NULL → platform MapLibre style
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
```

### Planned Fields (pending migration)

The following columns are **not yet in the database**. They are documented here to guide the
future migration (`supabase/migrations/XXXX_tenant_settings_v2.sql`).

```sql
ALTER TABLE tenant_settings
  ADD COLUMN secondary_color TEXT    DEFAULT '#1E40AF',   -- Secondary brand colour
  ADD COLUMN brand_name      TEXT,                        -- White-label product name
  ADD COLUMN subdomain       TEXT    UNIQUE,              -- Mirror of tenants.slug
  ADD COLUMN support_email   TEXT,                        -- Tenant support contact
  ADD COLUMN features        JSONB   DEFAULT '{}'::jsonb; -- Feature flags (see below)
```

### Column Reference Table

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| `id` | UUID | `uuid_generate_v4()` | No | Primary key |
| `tenant_id` | UUID | — | No | FK → `tenants.id` (unique, CASCADE delete) |
| `primary_color` | TEXT | `#3B82F6` | No | Hex colour for buttons, accents, highlights |
| `logo_url` | TEXT | NULL | Yes | Supabase Storage path or absolute URL; NULL uses platform logo |
| `font_family` | TEXT | `Inter` | No | CSS `font-family` value loaded from Google Fonts |
| `map_style_override_json` | JSONB | NULL | Yes | Full MapLibre style spec; NULL uses platform default |
| `created_at` | TIMESTAMPTZ | `now()` | No | Row creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | No | Last update timestamp (trigger-maintained) |
| `secondary_color` ⚠️ | TEXT | `#1E40AF` | Yes | **Planned** — secondary brand colour |
| `brand_name` ⚠️ | TEXT | NULL | Yes | **Planned** — white-label product name (replaces "CapeTown GIS Hub" in UI) |
| `subdomain` ⚠️ | TEXT | NULL | Yes | **Planned** — mirror of `tenants.slug`; UNIQUE |
| `support_email` ⚠️ | TEXT | NULL | Yes | **Planned** — tenant support email shown in help UI |
| `features` ⚠️ | JSONB | `{}` | Yes | **Planned** — feature flag object (see TypeScript interface) |

> ⚠️ = not yet in database; requires migration before use.

---

## TypeScript Interface

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: none (branding config only)
 * Purpose: Render tenant-specific UI branding
 * Lawful basis: contract
 * Retention: for duration of tenant subscription
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection N/A
 */

import type { StyleSpecification as MapLibreStyleSpec } from 'maplibre-gl';

interface TenantWhitelabelConfig {
  primaryColor: string;               // Hex colour for buttons, accents
  logoUrl: string | null;             // Supabase Storage path or null (uses default logo)
  fontFamily: string;                 // CSS font-family string
  mapStyleOverride: MapLibreStyleSpec | null; // Custom MapLibre style JSON

  // Future fields (pending migration):
  secondaryColor?: string;
  brandName?: string;
  supportEmail?: string;
  features?: {
    drawTools: boolean;
    pdfExport: boolean;
    analyticsTab: boolean;
    flightTracking: boolean;
  };
}

/** Platform-wide defaults — merged when tenant field is NULL */
const WHITELABEL_DEFAULTS: TenantWhitelabelConfig = {
  primaryColor:    '#3B82F6',
  logoUrl:         null,
  fontFamily:      'Inter',
  mapStyleOverride: null,
  secondaryColor:  '#1E40AF',
  brandName:       'CapeTown GIS Hub',
  supportEmail:    'support@capegis.com',
  features: {
    drawTools:      true,
    pdfExport:      false,
    analyticsTab:   true,
    flightTracking: false,
  },
};
```

---

## Runtime Application

Settings are resolved on every request and threaded through the React tree:

```
Browser request
  → Next.js Edge Middleware
      → resolveSubdomain() → tenant_id
      → fetchTenantSettings(tenant_id)   // Supabase or Edge Config cache
      → merge(WHITELABEL_DEFAULTS, settings)
      → attach to request headers as x-tenant-config (base64-encoded JSON)
  → app/layout.tsx
      → read x-tenant-config header
      → <TenantProvider config={...}>
          → injectCSSVariables()     // --color-primary, --color-secondary
          → loadGoogleFont()         // if fontFamily ≠ 'Inter'
          → MapLibre initialised with mapStyleOverride (or default)
```

### CSS Variable Injection

```typescript
// lib/tenant/injectCSSVariables.ts
export function injectCSSVariables(config: TenantWhitelabelConfig): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary',   config.primaryColor);
  root.style.setProperty('--color-secondary', config.secondaryColor ?? '#1E40AF');
}
```

### Caching Strategy

| Layer | TTL | Invalidation |
|-------|-----|-------------|
| Supabase query (server) | 60 s (ISR) | `revalidatePath()` on settings save |
| Edge Config (optional) | 30 s | Webhook from settings update API |
| `localStorage` (client) | Session | Hard refresh clears |

---

## Example Tenant Configurations

### 1. Municipality — City of Cape Town

```json
{
  "primaryColor": "#006CB7",
  "secondaryColor": "#003F7F",
  "logoUrl": "tenants/capetown-municipality/logo.svg",
  "fontFamily": "Source Sans Pro",
  "brandName": "City of Cape Town GIS Portal",
  "supportEmail": "gis-support@capetown.gov.za",
  "mapStyleOverride": null,
  "features": {
    "drawTools": true,
    "pdfExport": true,
    "analyticsTab": true,
    "flightTracking": false
  }
}
```

### 2. Estate Agency

```json
{
  "primaryColor": "#B5913A",
  "secondaryColor": "#7A5E1E",
  "logoUrl": "tenants/lux-estates/logo.png",
  "fontFamily": "Playfair Display",
  "brandName": "Lux Estates GIS",
  "supportEmail": "tech@luxestates.co.za",
  "mapStyleOverride": null,
  "features": {
    "drawTools": false,
    "pdfExport": true,
    "analyticsTab": false,
    "flightTracking": false
  }
}
```

### 3. Research Institution — University

```json
{
  "primaryColor": "#8B1A1A",
  "secondaryColor": "#5A1010",
  "logoUrl": "tenants/uct-urban-studies/logo.svg",
  "fontFamily": "Merriweather",
  "brandName": "UCT Urban Studies GIS Lab",
  "supportEmail": "gislab@uct.ac.za",
  "mapStyleOverride": {
    "version": 8,
    "name": "UCT Research Dark",
    "sources": {},
    "layers": []
  },
  "features": {
    "drawTools": true,
    "pdfExport": true,
    "analyticsTab": true,
    "flightTracking": true
  }
}
```

---

## Security Considerations

### Who Can Update Settings

| Field group | Minimum role required |
|-------------|----------------------|
| `primary_color`, `logo_url`, `font_family` | TENANT_ADMIN |
| `map_style_override_json` | TENANT_ADMIN |
| `secondary_color`, `brand_name`, `support_email` | TENANT_ADMIN |
| `features` | **PLATFORM_ADMIN only** |
| `subdomain` | **PLATFORM_ADMIN only** |

Feature flags and subdomain changes are platform-level operations and must never be
user-editable. RLS alone is insufficient — the API route must also check `role = 'PLATFORM_ADMIN'`
before writing `features` or `subdomain`.

### RLS Policy

```sql
-- Only TENANT_ADMIN of the matching tenant may update branding columns
CREATE POLICY "tenant_settings_update" ON tenant_settings
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('TENANT_ADMIN', 'PLATFORM_ADMIN')
  );
```

### Logo URL Validation

- `logo_url` must be a path within `supabase.storage` (`tenants/<tenant_id>/...`).
- Absolute external URLs are rejected to prevent open-redirect and CSP violations.
- Validate in the API route before writing; sanitise before rendering (`<img src={...}`).

---

## Fallback Behaviour

If a tenant's `tenant_settings` row is missing or a field is `NULL`, the platform falls
back gracefully without error:

| Condition | Fallback |
|-----------|----------|
| No `tenant_settings` row | Use all `WHITELABEL_DEFAULTS` |
| `logo_url` is NULL | Render platform default logo (`/public/logo-default.svg`) |
| `font_family` is NULL | Use `Inter` (already loaded in layout) |
| `primary_color` is NULL | Use `#3B82F6` (platform blue) |
| `map_style_override_json` is NULL | Use platform MapLibre style |
| `features` is NULL or `{}` | Apply `WHITELABEL_DEFAULTS.features` |
| Supabase unreachable | Use last-known good settings from `localStorage`; show stale-config banner |

> **Rule 2 compliance:** Tenant config follows the three-tier fallback pattern —
> LIVE (Supabase) → CACHED (Edge Config / `localStorage`) → MOCK (hardcoded defaults).
> The map is never blank due to a missing config.
