# Operations Runbook
## CapeConnect GIS Hub

> Quick-reference for production operations.

---

## 1. Rollback Procedure

```bash
# List recent deployments
vercel ls --limit 10

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or via Vercel dashboard: Settings → Deployments → Promote
```

**When to rollback:**
- 500 error rate > 5% for 5 minutes
- Map tiles failing to load
- Auth flow broken

---

## 2. Database Connection Issues

### Symptoms
- API routes returning 500
- `PGRST` errors in Vercel Function logs

### Resolution
1. Check Supabase dashboard → Database → Connection Pool
2. If pool exhausted: restart pooler via Supabase Settings → Database
3. If persistent: check RLS policies haven't changed
4. Emergency: set `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (temporary only!)

---

## 3. OpenSky Rate Limiting

### Symptoms
- Flight tracking shows `CACHED` or `MOCK` tier permanently
- `429 Too Many Requests` in API route logs

### Resolution
1. Check `src/lib/opensky-rate-limit.ts` — default: 1 request/10s
2. If authenticated: 4 requests/10s limit
3. Verify OpenSky Network status: https://opensky-network.org/api/states/all
4. If blocked: fallback is automatic (CACHED → MOCK)

---

## 4. Vercel Function Timeouts

### Symptoms
- Spatial analysis queries timing out (> 30s)
- `FUNCTION_INVOCATION_TIMEOUT` in logs

### Resolution
1. Check `vercel.json`: `maxDuration` is 30s
2. For heavy spatial queries: add pagination or limit geometry complexity
3. Monitor PostGIS query plan: `EXPLAIN ANALYZE` on slow queries
4. Consider edge function caching for frequently-hit analysis endpoints

---

## 5. Map Tile Loading Failures

### Symptoms
- Grey/blank map area
- Console: `Failed to load tile` errors

### Resolution
1. Check CARTO CDN status: https://status.carto.com/
2. Check Cesium Ion quota: https://ion.cesium.com/tokens
3. If CARTO down: no client-side fallback (external dependency)
4. If Cesium down: SpatialView auto-falls back to MapLibre 2D

---

## 6. Key Environment Variables

| Variable | Purpose | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Vercel env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Vercel env |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key (server only) | Vercel env (secret) |
| `CESIUM_ION_TOKEN` | 3D Tiles access | Vercel env |
| `OPENSKY_USERNAME` / `PASSWORD` | Increased rate limit | Vercel env (optional) |
| `SENTRY_DSN` | Error tracking | Vercel env (optional) |

---

## 7. Monitoring Checklist (Daily)

- [ ] Check Vercel Functions → Error rate < 1%
- [ ] Check Supabase → Active connections < 80% pool
- [ ] Spot-check `https://<prod>/api/flights` returns valid JSON
- [ ] Verify Source badges show `LIVE` tier (not stuck on `MOCK`)

---

## 8. Emergency Contacts

| Role | Contact |
|---|---|
| Engineering Lead | TBD |
| Supabase Support | support@supabase.io |
| Vercel Support | support@vercel.com |
| Information Officer | TBD (DPIA sign-off required) |
