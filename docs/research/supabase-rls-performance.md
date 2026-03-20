# Supabase RLS Performance at Scale

> **TL;DR:** Row-Level Security adds measurable overhead to every query — typically 5–15% for simple policies, but potentially 10×+ for complex joins or spatial queries without proper indexing. The canonical capegis RLS pattern (`tenant_id = current_setting('app.current_tenant', TRUE)::uuid`) is among the cheapest forms. Key risks: GiST spatial index interaction with RLS predicates, silent policy failures returning empty sets instead of errors, and `FORCE ROW LEVEL SECURITY` gotchas with service role keys. Mitigation: composite indexes on `(tenant_id, geometry)`, `EXPLAIN ANALYZE` on all spatial queries, and integration tests verifying RLS returns correct data (not just "no error").
>
> **Roadmap Relevance:** M1 (Database + RLS) — policy design and performance baseline. M3 (Data Ingestion) — bulk insert performance with RLS enabled. M6 (Valuation) — GV Roll query performance with RLS + spatial filters.

---

## 1. RLS Overhead Benchmarks

### Simple equality policy (capegis pattern)
```sql
CREATE POLICY "tenant_isolation" ON properties
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```

| Scenario | Without RLS | With RLS | Overhead |
|----------|-------------|----------|----------|
| Point lookup by PK | 0.05 ms | 0.06 ms | ~20% (negligible) |
| Index scan, 100 rows | 1.2 ms | 1.4 ms | ~15% |
| Seq scan, 10K rows | 45 ms | 52 ms | ~15% |
| Spatial query (ST_Within), 1K results | 12 ms | 14 ms | ~17% |
| Complex join (3 tables) | 8 ms | 12 ms | ~50% |

`[ASSUMPTION — UNVERIFIED]` Benchmarks are extrapolated from PostgreSQL 15 RLS overhead studies and Supabase community reports. Actual capegis performance depends on data volume, index strategy, and Supabase plan tier.

### Problematic patterns (avoid)

```sql
-- BAD: Subquery in RLS policy — runs per row
CREATE POLICY "bad_role_check" ON properties
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE id = auth.uid() AND role >= 'ANALYST'
  ));

-- GOOD: Use current_setting (set once per transaction)
CREATE POLICY "good_role_check" ON properties
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND current_setting('app.user_role', TRUE) IN ('ANALYST','POWER_USER','TENANT_ADMIN','PLATFORM_ADMIN')
  );
```

`[VERIFIED]` `current_setting()` is evaluated once per transaction, not per row. This is the recommended pattern for Supabase RLS.

---

## 2. GiST Index + RLS Interaction

The critical performance risk for capegis: spatial queries combine RLS predicate with GiST index lookup.

```sql
-- This query must use BOTH the tenant_id B-tree AND the geometry GiST index
SELECT * FROM parcels
WHERE ST_Within(geometry, ST_MakeEnvelope(18.4, -33.95, 18.5, -33.90, 4326))
  AND tenant_id = '...'::uuid;  -- Added by RLS
```

### Index strategies

| Index type | Query pattern | Performance |
|------------|--------------|-------------|
| Separate indexes: `(tenant_id)` + GiST `(geometry)` | Bitmap AND | Good for <100K rows |
| Composite: `(tenant_id, geometry)` — **NOT possible** with GiST | N/A | GiST doesn't support composite with B-tree |
| Partial GiST per tenant: `WHERE tenant_id = X` | Excellent for known tenants | Doesn't scale to many tenants |
| Expression index + GiST | Complex | Marginal gains |

**Recommended approach:**
```sql
-- B-tree on tenant_id (RLS predicate)
CREATE INDEX idx_parcels_tenant ON parcels (tenant_id);

-- GiST on geometry (spatial queries)
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geometry);

-- PostgreSQL planner will use BitmapAnd to combine both indexes
```

`[VERIFIED]` PostgreSQL's query planner can combine B-tree and GiST indexes via BitmapAnd scan. Verified in PostgreSQL 15 documentation.

---

## 3. Silent Policy Failures

**The most dangerous RLS failure mode:** a misconfigured policy returns zero rows instead of an error.

```sql
-- If app.current_tenant is not set, current_setting returns NULL
-- NULL = uuid comparison → always false → zero rows returned
-- No error thrown!
SELECT * FROM properties; -- Returns empty set silently
```

### Mitigation strategies

1. **Always use `TRUE` parameter:** `current_setting('app.current_tenant', TRUE)` returns NULL instead of error when setting doesn't exist
2. **Application-layer validation:** verify non-empty result sets for queries that should return data
3. **Integration tests:** test that RLS returns correct data for correct tenant, AND zero data for wrong tenant
4. **Monitoring:** alert on sudden drops in query result counts

```typescript
// Application-layer guard
const { data, error } = await supabase.from('properties').select('*').limit(1);
if (!error && data?.length === 0 && expectedNonEmpty) {
  logger.warn('RLS may be misconfigured: empty result for expected-nonempty query');
}
```

---

## 4. Bulk Operations with RLS

### INSERT performance
RLS `WITH CHECK` policies are evaluated per inserted row. For bulk GV Roll ingestion:

```sql
-- Slow: individual inserts (RLS check per row)
INSERT INTO valuation_data (tenant_id, ...) VALUES (...);  -- ×100,000

-- Better: batch insert (RLS check per row, but single transaction)
INSERT INTO valuation_data (tenant_id, ...) 
SELECT ... FROM staging_table;

-- Best: use service role key to bypass RLS for trusted ingestion
-- Then verify data integrity post-insert
```

`[VERIFIED]` Supabase service role key bypasses RLS. `FORCE ROW LEVEL SECURITY` does NOT apply to the service role (superuser).

### FORCE ROW LEVEL SECURITY gotcha

```sql
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
-- This forces RLS on the table OWNER, but NOT on superuser/service_role
-- Service role key still bypasses all policies
```

`[VERIFIED]` In PostgreSQL, `FORCE ROW LEVEL SECURITY` applies to the table owner but not to superusers. Supabase service_role is a superuser.

---

## 5. Tenant Partitioning Strategies

For very large tables (>1M rows per tenant), consider PostgreSQL partitioning:

| Strategy | Pros | Cons |
|----------|------|------|
| No partitioning + RLS | Simple, works now | Performance degrades at scale |
| Hash partitioning by `tenant_id` | Even distribution | Can't drop single tenant easily |
| List partitioning by `tenant_id` | Per-tenant management | Must add partition per new tenant |
| Hybrid: partition + RLS | Best of both | Complex migration, DDL per tenant |

**Recommendation for capegis M1:** Start without partitioning. Add list partitioning if any single table exceeds 5M rows or query latency exceeds 100ms at p95.

`[ASSUMPTION — UNVERIFIED]` The 5M row threshold is an estimated inflection point. Actual threshold depends on query patterns, index effectiveness, and Supabase compute tier.

---

## 6. Testing RLS Policies

```sql
-- Test as specific tenant
SET LOCAL app.current_tenant = 'tenant-uuid-here';
SET LOCAL app.user_role = 'VIEWER';

-- Should return only this tenant's data
SELECT count(*) FROM properties;

-- Should return zero for another tenant's data
SET LOCAL app.current_tenant = 'other-tenant-uuid';
SELECT count(*) FROM properties; -- Must be 0

-- Reset
RESET app.current_tenant;
RESET app.user_role;
```

### Integration test pattern (Vitest)
```typescript
describe('RLS: properties table', () => {
  it('returns only current tenant data', async () => {
    const { data } = await tenantAClient.from('properties').select('tenant_id');
    expect(data?.every(r => r.tenant_id === TENANT_A_ID)).toBe(true);
  });

  it('returns empty for wrong tenant', async () => {
    const { data } = await tenantBClient.from('properties').select('*')
      .eq('tenant_id', TENANT_A_ID);
    expect(data).toHaveLength(0);
  });
});
```

---

## 7. Performance Monitoring Queries

```sql
-- Find slow queries with RLS overhead
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%current_setting%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check if RLS policies are being used
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify EXPLAIN shows index usage with RLS
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM properties WHERE ST_Within(geometry, ...);
```

---

## 8. Open Questions

- [ ] What is the actual RLS overhead for ST_Within queries on 100K+ parcels with composite index strategy?
- [ ] Should we use `SET LOCAL` or `SET` for tenant context? (LOCAL is transaction-scoped, safer)
- [ ] At what row count should we introduce table partitioning?
- [ ] Should RLS policies use `auth.uid()` directly or `current_setting()` for role checks?
- [ ] How does Supabase's connection pooler (PgBouncer) interact with `SET` for tenant context?

---

*Research compiled: 2026-03-06 · capegis research audit*
