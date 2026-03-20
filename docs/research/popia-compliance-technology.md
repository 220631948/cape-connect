# POPIA Compliance Technology Landscape

> **TL;DR:** South Africa's POPIA (Protection of Personal Information Act) mandates 8 processing conditions, a responsible party obligation, and data subject rights. For capegis, the critical intersection is spatial PII — property addresses, GPS coordinates, and movement patterns can identify individuals even without names. The GV Roll 2022 likely contains personal information (owner names + addresses) requiring full POPIA compliance. Key technical controls: POPIA annotation blocks on all PII-handling files, consent management UI, data minimisation in guest mode, right-to-deletion API, and audit logging. Section 72 cross-border transfer restrictions affect cloud hosting decisions.
>
> **Roadmap Relevance:** M1 (Database + Auth) — RLS tenant isolation, POPIA audit_log table. M4 (User Management) — consent management, data subject rights UI. M6 (Business/Valuation) — GV Roll PII handling, POPIA annotation on valuation components.

---

## 1. POPIA Conditions Overview

| # | Condition | capegis Implication |
|---|-----------|-------------------|
| 1 | Accountability | Designate Information Officer; maintain processing records |
| 2 | Processing limitation | Only collect spatial data needed for stated purpose |
| 3 | Purpose specification | Document purpose per data category (valuation, routing, analysis) |
| 4 | Further processing limitation | Don't repurpose GV Roll data for marketing |
| 5 | Information quality | Keep cached data current; stale cache = inaccurate data |
| 6 | Openness | Privacy policy accessible from every tenant |
| 7 | Security safeguards | Encryption at rest (Supabase), TLS in transit, RLS isolation |
| 8 | Data subject participation | Access, correction, deletion APIs for registered users |

`[VERIFIED]` POPIA commenced fully on 1 July 2021. Enforced by the Information Regulator (South Africa).

---

## 2. Spatial PII — The Hidden Risk

Spatial data creates PII even without explicit identifiers:

| Data type | PII risk | Mitigation |
|-----------|----------|------------|
| Property address | **HIGH** — directly identifies owner | RLS + role gating (ANALYST+) |
| GPS coordinate (precise) | **HIGH** — can identify residence | Truncate to 3 decimal places for GUEST/VIEWER |
| Movement pattern (OpenSky) | **MEDIUM** — aggregate only | Never track individual aircraft for non-aviation users |
| Suburb-level aggregation | **LOW** — k-anonymity natural | Safe for GUEST mode |
| Cadastral parcel geometry | **MEDIUM** — identifies property | Geometry only (no owner data) for VIEWER |

`[ASSUMPTION — UNVERIFIED]` The GV Roll 2022 contains owner names and is therefore "personal information" under POPIA Section 1. Legal confirmation required before ingesting owner-identifying fields.

---

## 3. POPIA Annotation Block (Mandatory)

Per CLAUDE.md Rule 5, every file handling personal data must include:

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [list fields]
 * Purpose: [specific purpose]
 * Lawful basis: [consent | contract | legal obligation | legitimate interests]
 * Retention: [period]
 * Subject rights: [access ✓ | correction ✓ | deletion ✓ | objection ✓]
 */
```

### Files requiring POPIA annotation (predicted)
- `src/lib/supabase/valuation.ts` — GV Roll queries (owner names, addresses)
- `src/lib/supabase/profiles.ts` — user profiles (email, tenant membership)
- `src/components/property/PropertyDetail.tsx` — displays PII to authorised roles
- `src/lib/auth/session.ts` — JWT tokens containing user identity
- `supabase/migrations/*_audit_log.sql` — audit trail containing user actions

---

## 4. Consent Management Architecture

```
┌─────────────────────────────────────┐
│  Consent Banner (first visit)        │
│  ┌─────────────┐ ┌────────────────┐ │
│  │ Accept All  │ │ Manage Prefs   │ │
│  └─────────────┘ └────────────────┘ │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
  Store consent          Granular toggles:
  in profiles.           - Essential (required)
  consent_given_at       - Analytics (optional)
  consent_version        - Location (optional)
                         - Marketing (never for capegis)
```

### Database schema
```sql
ALTER TABLE profiles ADD COLUMN consent_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN consent_version TEXT DEFAULT 'v1';
ALTER TABLE profiles ADD COLUMN consent_preferences JSONB DEFAULT '{}';
```

---

## 5. Data Subject Rights Implementation

| Right | POPIA Section | Implementation |
|-------|--------------|----------------|
| Access | §23 | `/api/me/data-export` — JSON export of all user data |
| Correction | §24 | Profile edit UI + API endpoint |
| Deletion | §24 | `/api/me/delete` — soft delete, 30-day retention, then hard purge |
| Objection | §11(3) | Opt-out toggle per data processing purpose |

### Deletion cascade
```sql
-- Soft delete: mark for deletion
UPDATE profiles SET 
  deleted_at = NOW(),
  deletion_scheduled = NOW() + INTERVAL '30 days'
WHERE id = $1 AND tenant_id = current_setting('app.current_tenant', TRUE)::uuid;

-- Hard purge (scheduled job, runs daily)
DELETE FROM profiles WHERE deletion_scheduled < NOW();
DELETE FROM saved_searches WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM favourites WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM audit_log WHERE user_id NOT IN (SELECT id FROM profiles) 
  AND created_at < NOW() - INTERVAL '1 year';
```

---

## 6. Section 72 — Cross-Border Transfer

`[VERIFIED]` POPIA Section 72 restricts transfer of personal information outside South Africa unless the recipient country has adequate data protection laws or binding corporate rules apply.

| Hosting component | Location | Section 72 status |
|-------------------|----------|-------------------|
| Supabase | US/EU (AWS regions) | Requires assessment — use Supabase's DPA |
| Vercel | Global edge (Cloudflare) | Edge functions may process in SA region |
| DigitalOcean (Martin) | Choose Cape Town or Amsterdam DC | **Cape Town DC preferred** |
| GitHub (code) | US | Code ≠ personal data (usually exempt) |

`[ASSUMPTION — UNVERIFIED]` Supabase's Data Processing Agreement (DPA) satisfies POPIA Section 72 requirements. Legal review needed.

---

## 7. Guest Mode POPIA Compliance

Per CLAUDE.md Section 6:
- No PII collection for guests
- No cookies beyond essential session cookie
- No tracking pixels or analytics for unauthenticated users
- Max 3 sign-up prompts per session (not coercive)
- Aggregate-only data display (suburb level, not property level)

---

## 8. Audit Logging Requirements

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'VIEW_PROPERTY', 'EXPORT_DATA', 'DELETE_ACCOUNT'
  resource_type TEXT,   -- 'property', 'profile', 'search'
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

-- Only TENANT_ADMIN+ can read audit logs
CREATE POLICY "audit_log_tenant_admin" ON audit_log
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND current_setting('app.user_role', TRUE) IN ('TENANT_ADMIN', 'PLATFORM_ADMIN')
  );
```

---

## 9. HPCDPC (Health POPI Code of Conduct)

Not directly applicable to capegis unless health facility data is ingested. If Western Cape health facility locations are added as a layer:
- Facility locations are public data (not POPIA-restricted)
- Patient data is never ingested
- Health utilisation statistics must be aggregated to ward level minimum

---

## 10. Open Questions

- [ ] Is GV Roll 2022 owner name data classified as "personal information" under POPIA? (Legal opinion needed)
- [ ] Does Supabase's DPA satisfy POPIA Section 72 cross-border requirements?
- [ ] Should capegis appoint an Information Officer per tenant, or is platform-level sufficient?
- [ ] What is the retention period for audit_log entries? (Propose: 2 years)
- [ ] Do aggregated property valuations (suburb average) constitute "de-identified" data under POPIA?

---

*Research compiled: 2026-03-06 · capegis research audit*
