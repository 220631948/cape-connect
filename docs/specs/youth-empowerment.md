# Youth Digital Empowerment

> **TL;DR:** Implementation of the 'Youth Digital Empowerment' feature, including map layers for 'Local Digital Resources' (WiFi hubs, libraries, tech centres) and 'Safe-Walk Corridors' for youth commuting, with offline support via Dexie.js and tenant-isolated data via Supabase RLS.

| Field | Value |
|-------|-------|
| **Milestone** | M19 — Youth Digital Empowerment Layers |
| **Status** | Draft |
| **Depends on** | M4 (Architecture Layer), M12 (Multi-Tenant) |
| **Architecture refs** | [ADR-005](../architecture/ADR-005-tenant-subdomains.md), [ADR-007](../architecture/ADR-007-offline-first.md), [ADR-009](../architecture/ADR-009-three-tier-fallback.md) |

## Topic
The Youth Digital Empowerment feature provides community-focused spatial data to help youth navigate digital resources and commute safely in Cape Town. It turns the city into a big, friendly playground where everyone can find the "magic internet boxes" and "happy paths" to school!

## Map Layers

### 1. Local Digital Resources
- **Description:** Point layer showing locations of free WiFi hubs, public libraries, youth development centres, and digital skills labs.
- **Source:** CoCT Open Data Portal + Community Mapping.
- **Styling:** Circular markers with 'WiFi' or 'Book' icons; distinct colour palette for digital infrastructure.
- **Zoom Gate:** Min zoom 11.

### 2. Safe-Walk Corridors
- **Description:** Line layer showing designated safe walking routes to schools, libraries, and transport hubs, identified by community safety programs.
- **Source:** Western Cape Department of Community Safety (DoCS) + Community Input.
- **Styling:** Pulsing glow effect on lines to indicate active safety monitoring where data is available.
- **Zoom Gate:** Min zoom 12.

## Technical Implementation

### Offline Viewing (Dexie.js)
In accordance with [ADR-007](../architecture/ADR-007-offline-first.md), the 'Youth Digital Empowerment' data is persisted locally to ensure availability in low-connectivity areas (like when the internet goes on a nap):
- **Storage:** Data fetched from the API is stored in the `youth_resources` and `safe_corridors` tables within Dexie.js (IndexedDB).
- **Strategy:** Cache-first for map markers; background sync refreshes the local store when online.
- **Fallback:** If the network is unavailable, the `dataService` retrieves GeoJSON features directly from Dexie.

### Tenant Isolation (Supabase RLS)
Tenant isolation is enforced at both the application and database layers per [Rule 4](../../CLAUDE.md#rule-4--rls--application-layer-isolation). We make sure that different groups don't peek into each other's toy boxes!
- **Database:** All community resource tables include a `tenant_id` column with mandatory RLS policies.
- **RLS Policy:**
```sql
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources FORCE ROW LEVEL SECURITY;
CREATE POLICY "community_resources_tenant_isolation" ON community_resources
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```
- **Application:** The `TenantProvider` ensures that the `tenant_id` is automatically appended to all resource requests.

## POPIA Compliance

/**
 * POPIA ANNOTATION
 * Personal data handled: None.
 * Purpose: This feature visualizes public infrastructure and community safety corridors.
 * Lawful basis: Legitimate interests (Community Empowerment).
 * Retention: Not applicable (no personal data collected).
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

## Acceptance Criteria
1. **Local Digital Resources Layer:** Rendered as a vector layer with appropriate symbology.
2. **Safe-Walk Corridors Layer:** Rendered as a line layer with visibility toggles.
3. **Offline Mode:** Resources remain visible on the map when the device is offline (verified via Dexie storage).
4. **Tenant Security:** Resources from Tenant A are never visible to users of Tenant B (verified via RLS audit).
5. **Source Badges:** All displays include `[SOURCE · YEAR · STATUS]` badges.
