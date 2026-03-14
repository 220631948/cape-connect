<!--
/fallback-check — Three-Tier Fallback Verification
Priority: P0
Primary Agent: FALLBACK-VERIFY-AGENT
Skill: fallback_verify
-->

## Trigger
`/fallback-check [--create-mocks] [--ci] [--route <path>]`

## Purpose
Verify that every API route implements the mandatory LIVE → CACHED → MOCK three-tier fallback
chain required by CLAUDE.md Rule 2. Scaffolds missing mock stubs with `--create-mocks`.
Non-zero exit in CI mode on any FAIL (2+ tiers missing).

## Primary Agent
**FALLBACK-VERIFY-AGENT 🪂** — invokes `fallback_verify` skill.

## Steps

1. **Invoke `fallback_verify` skill** against:
   - `src/app/api/**/*.ts` (all Next.js App Router route handlers)
   - If `--route <path>` provided: limit to that specific route file

2. **Verify LIVE tier** per route:
   - `fetch(`, `supabase.from()`, `supabase.rpc()`, `axios.`, `got(` pattern
   - Mark ✅ LIVE or ❌ MISSING

3. **Verify CACHED tier** per route:
   - `api_cache` table select, `getCached`, `readCache` pattern
   - Must be inside a try/catch or conditional guard on LIVE failure
   - Mark ✅ CACHED or ❌ MISSING

4. **Verify MOCK tier** per route:
   - Reference to `public/mock/*.geojson` filename
   - Verify the referenced file **physically exists on disk**
   - Mark ✅ MOCK, ⚠️ MOCK (referenced but missing file), or ❌ MISSING

5. **Output route table:**
   ```
   ROUTE | LIVE | CACHED | MOCK | FILE_EXISTS | STATUS
   ```

6. **If `--create-mocks` flag provided:**
   For each route with missing MOCK tier:
   - Create empty GeoJSON stub in `public/mock/<route-name>.geojson`
   - Stub format: `{"type":"FeatureCollection","features":[],"_stub":true}`
   - Log: `Created public/mock/<name>.geojson (stub — replace with real data)`

7. **Append to `docs/COMPLIANCE_LOG.md`** with timestamped results.

8. **If `--ci` flag:** Exit non-zero on any FAIL (PARTIAL does not fail CI but is logged).

## MCP Servers Used
- `filesystem` — read route files, verify mock file existence, write stubs
- `doc-state` — acquire write lock before COMPLIANCE_LOG.md update

## Success Criteria
- All API routes have LIVE + CACHED + MOCK tiers verified
- All referenced mock files physically exist in `public/mock/`
- `docs/COMPLIANCE_LOG.md` updated with results
- Zero FAIL in `--ci` mode (non-zero exit otherwise)

## Usage Example
```bash
# Full scan with report
/fallback-check

# Create missing mock stubs
/fallback-check --create-mocks

# CI mode — non-zero exit on FAIL
/fallback-check --ci

# Check a single route
/fallback-check --route src/app/api/analysis/route.ts
```
