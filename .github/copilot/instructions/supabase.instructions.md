---
name: 'Supabase & PostGIS'
description: 'Database and Supabase conventions for the GeoSaaS project'
applyTo: '**/supabase/**/*,**/lib/supabase/**/*'
---

# Supabase & PostGIS Standards

- Every new table MUST have `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
- RLS policies use `current_setting('app.current_tenant')` for tenant isolation.
- Six RBAC roles: PLATFORM_ADMIN, TENANT_ADMIN, POWER_USER, ANALYST, VIEWER, GUEST.
- Spatial columns use `geometry(Point, 4326)` or `geometry(Polygon, 4326)` — always EPSG:4326.
- Create GiST indexes on all geometry columns.
- Tables with personal data (profiles, favourites, saved_searches, audit_log) must have POPIA annotation in SQL comments.
- Use `auth.uid()` in RLS policies for user-scoped data.
- Migrations are numbered sequentially: `YYYYMMDDHHMMSS_description.sql`.
- Never store actual API keys or secrets in migration files.
- The `audit_log` table must survive account deletion (POPIA regulatory requirement).
