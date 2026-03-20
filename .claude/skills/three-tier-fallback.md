# Three-Tier Data Fallback Pattern

This pattern is required on all new data sources in CapeTown GIS Hub.
A data source with only two tiers is not compliant. Count the tiers.

## The three tiers

**Tier 1 — Live API / Real-time source**
The primary data source. Hit this first. If it responds within timeout, use it.
Always include source attribution metadata with the response.

**Tier 2 — Cached / Tile Server fallback**
If Tier 1 fails or times out, serve from Martin tile cache or Supabase cache layer.
Log the fallback occurrence. Do not silently fall through.
The source attribution badge must reflect the cache timestamp.

**Tier 3 — Static fallback / Offline bundle**
If Tier 2 also fails, serve a static GeoJSON snapshot bundled with the app.
The snapshot must be dated. Show the snapshot date in the attribution badge.
A stale map is better than a blank map. A blank map is a lie about the world.

## Implementation checklist
- [ ] Tier 1 timeout is configured (not infinite)
- [ ] Tier 2 cache TTL is defined
- [ ] Tier 3 static file is committed to the repo
- [ ] Attribution badge updates correctly for each tier
- [ ] Error is logged (not swallowed) on tier transitions
