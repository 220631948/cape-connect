# 07 Multitenancy, Access Views & ArcGIS Hub

> **TL;DR:** Shared-Schema RLS with UUIDv7 is the 2026 gold standard for multi-tenant GIS (score 9.5/10). Implement immediately. Use `current_setting('app.current_tenant', TRUE)::uuid` in all RLS policies. SQL Views with `SECURITY BARRIER` enable role-based data levels (GUEST vs ANALYST). Koop JS bridges PostGIS ↔ ArcGIS Hub if needed.
>
> **Roadmap Relevance:** M1 (Database Schema) — RLS is foundational. CLAUDE.md Rule 4 mandates dual-layer isolation (RLS + app layer) on every tenant table.

## Overview & 2026 Status
[VERIFIED] In 2026, multi-tenancy in GIS has shifted from "separate databases" to "Shared Schema with rigorous Row-Level Security (RLS)." PostgreSQL 18 has introduced native **UUIDv7** (time-ordered UUIDs) [ASSUMPTION — UNVERIFIED: exact PG18 release date and UUIDv7 native support should be cross-checked against postgresql.org release notes], which dramatically improves write performance for large multi-tenant tables. 

For ArcGIS Hub integration, the community has converged on using **Koop JS** as a universal bridge. It allows open-source databases (like our PostGIS instance) to masquerade as official ArcGIS Feature Services, allowing ArcGIS Hub to consume our data without us needing an ArcGIS Enterprise license.

## Integration with PostGIS
*   **RLS best practices:** We use session variables (GUCs) like `SET LOCAL app.current_tenant_id = '...'` in our Next.js middleware. This ensures that every SQL query, including spatial ones, is automatically scoped to the correct tenant.
*   **ArcGIS Hub Consumption:** We use `@esri/arcgis-rest-js` to fetch data *from* ArcGIS Hub (like City of Cape Town zoning) and **Koop JS** to serve our data *to* ArcGIS Hub if needed.
*   **Access Views:** By creating SQL Views with `SECURITY BARRIER`, we can offer different "levels" of data (e.g., a 'Summary' view for GUESTs and a 'Full Details' view for ANALYSTs) while still using the same underlying PostGIS table.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| (RLS) Security is enforced at the database level; impossible to "forget" a WHERE clause in the frontend. | (RLS) Complex spatial joins can become slow if the planner can't "prune" by tenant first. |
| (UUIDv7) Prevents database fragmentation and improves sorting performance. | (Koop JS) Adds an extra microservice to maintain between PostGIS and the web. |
| (Views) Allows us to create "Virtual Layers" for different white-label tenants without duplicating data. | SQL Views can hide performance bottlenecks if not carefully indexed. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 10          | RLS is the only way to build a secure white-label platform quickly. |
| Scalability                | 9           | Shared schema + RLS is the industry standard for SaaS. |
| Multitenancy Support       | 10          | This is the core of our platform's value proposition. |
| Maintenance Effort         | 7           | RLS policies require strict testing to avoid regressions. |
| Cost / Licensing           | 10          | All core multitenancy components are open source. |
| Cape Town / WC Relevance   | 10          | Critical for integrating with the City's ArcGIS Hub. |
| **Overall Recommendation** | **9.5**     | **Implement Shared-Schema RLS with UUIDv7 immediately.** Use Koop JS only if a tenant strictly requires ArcGIS Hub integration. |

## Example Integration (Supabase RLS + UUIDv7)
Applying a spatial RLS policy to our parcels table:

```sql
-- Enabling RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels FORCE ROW LEVEL SECURITY;

-- Creating a policy that uses a session variable
CREATE POLICY parcel_tenant_isolation ON parcels
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Next.js 15 Middleware setting the tenant context
// middleware.ts
export async function middleware(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  // This SQL is executed at the start of every Supabase transaction
  await supabase.rpc('set_tenant_context', { id: tenantId });
}
```

## Relevance to Our White-Label Cape Town GIS Project
This is how we solve the "Data Sovereignty" problem. A municipality in the Western Cape might be happy to share their base map, but they won't want their internal "Drainage Network Analysis" visible to a private property developer. By using **Shared-Schema RLS**, we maintain a single, powerful platform while guaranteeing that each tenant's sensitive spatial data remains strictly their own.
