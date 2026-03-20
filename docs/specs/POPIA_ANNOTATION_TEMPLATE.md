# POPIA Annotation Template — CapeTown GIS Hub

> **Purpose:** Standardised, copy-pasteable POPIA annotation blocks for TypeScript files and SQL
> migrations. All files that touch personal information (PI) MUST include an annotation — this is
> Rule 5 of `CLAUDE.md` and is non-negotiable.
>
> **Reference:** 8 POPIA conditions → `.claude/guides/popia_quick_reference.md`
> **Compliance spec:** `docs/specs/10-popia-compliance.md`

---

## TypeScript Annotation Template

Copy this block verbatim to the top of any `.ts` / `.tsx` file that touches personal data.
Place it immediately above the first `import` statement (or below a module `"use client"` directive).

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [list specific fields, e.g., "callsigns (may identify pilot), ICAO24 (aircraft registration)"]
 * Purpose: [specific purpose, e.g., "Real-time airspace visualization for urban planning context"]
 * Lawful basis: [consent | contract | legal obligation | legitimate interests]
 * Retention: [e.g., "Cache TTL: 30s; Not persisted beyond session"]
 * Subject rights: [access ✓/✗ | correction ✓/✗ | deletion ✓/✗ | objection ✓/✗]
 * POPIA risk level: [LOW | MEDIUM | HIGH]
 * Review date: [YYYY-MM-DD]
 */
```

---

## Field-by-Field Guidance

### `Personal data handled`
List every PI field the file reads, writes, or transmits. Be specific — do not write "user data".
- ✅ `"email address, user_id, saved search query strings"`
- ✅ `"ICAO24 aircraft hex (may link to registered owner via public registry)"`
- ❌ `"some user info"` — too vague, rejected at review

Omit fields that are definitively non-PI (zone codes, aggregate statistics, basemap tiles).

### `Purpose`
One sentence. Directly tied to a product feature. Must answer: *why does this code need this PI?*
- ✅ `"Authenticate tenant users and enforce RLS policy"`
- ✅ `"Display saved property searches to the owning user only"`
- ❌ `"General data handling"` — too broad, fails condition §13

### `Lawful basis`
Choose exactly one. See full worked examples below.

| Basis | When to use |
|-------|-------------|
| `consent` | User explicitly opted in (registration checkbox, cookie banner) |
| `contract` | PI is necessary to fulfil the service the user signed up for |
| `legal obligation` | SA law requires the processing (e.g., audit log retention) |
| `legitimate interests` | Narrow operational need; a Legitimate Interests Assessment (LIA) must be on file |

### `Retention`
State the cache TTL **and** any database persistence period.
- ✅ `"Cache TTL: 30s; not persisted to database"`
- ✅ `"Stored in profiles table; deleted within 30 days of account deletion request"`
- ✅ `"Audit log: 7 years (SHA256 anonymised, SA regulatory requirement)"`

### `Subject rights`
Mark ✓ if the right is technically fulfilled by this module; mark ✗ if delegated elsewhere (still must be fulfilled somewhere).

| Right | Fulfilled by |
|-------|-------------|
| access | `GET /api/me/data` |
| correction | `PATCH /api/me/update` |
| deletion | `DELETE /api/me` cascade |
| objection | `POST /api/me/consent` withdrawal |

### `POPIA risk level`
Assign based on sensitivity and volume:

| Level | Criteria |
|-------|----------|
| `LOW` | Non-sensitive PI, small volume, no third-party transfer, no linkage risk |
| `MEDIUM` | Sensitive-adjacent PI or third-party transfer with DPA in place |
| `HIGH` | Special personal information (§26), children's data, cross-border transfer, linkage risk, emergency telemetry |

### `Review date`
Set to 12 months from today, or earlier if the underlying data source or legal basis changes.

---

## Worked Examples by Lawful Basis

### 1. Consent — User Profile

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: email address, display name, tenant_id, consent_timestamp, consent_version
 * Purpose: Store authenticated user profile required to personalise the GIS dashboard
 * Lawful basis: consent — user ticked POPIA consent checkbox at registration (not pre-checked)
 * Retention: Active: indefinite while account exists; Deleted: within 30 days of deletion request
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 * POPIA risk level: MEDIUM
 * Review date: 2027-03-11
 */
```

### 2. Contract — Saved Searches

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: user_id (FK), search query strings, spatial bounding boxes, filter params
 * Purpose: Persist and retrieve saved property searches to deliver the core search feature
 * Lawful basis: contract — processing is necessary to provide the subscribed SaaS service
 * Retention: Deleted on account deletion; max retention 3 years if account inactive
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✗ (core contract feature)
 * POPIA risk level: LOW
 * Review date: 2027-03-11
 */
```

### 3. Legal Obligation — Audit Log

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: SHA256(user_id) — anonymised; action type; timestamp; tenant_id
 * Purpose: Immutable audit trail of data access/modification for regulatory compliance
 * Lawful basis: legal obligation — 7-year retention required under SA financial/regulatory rules
 * Retention: 7 years from event date; append-only; no UPDATE or DELETE for any role except PLATFORM_ADMIN
 * Subject rights: access ✓ (anonymised excerpt only) | correction ✗ | deletion ✗ | objection ✗
 * POPIA risk level: LOW (SHA256 hash is not directly reversible PII)
 * Review date: 2027-03-11
 */
```

### 4. Legitimate Interests — Tenant API Cache

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: tenant_id (organisational, not individual PI); cached API payloads
 * Purpose: Reduce external API calls and improve response time for all tenant users
 * Lawful basis: legitimate interests — operational efficiency; LIA on file; no individual PI in payloads
 * Retention: Cache TTL per entry (max 24h); purged on user deletion if entry contains user-linked PI
 * Subject rights: access ✗ (no individual PI) | correction ✗ | deletion ✓ (purged on account delete) | objection ✗
 * POPIA risk level: LOW
 * Review date: 2027-03-11
 */
```

---

## M7 OpenSky Flight Tracking — Worked Example

> **Why this is special:** OpenSky Network data is public telemetry, but callsigns and ICAO24 hex
> codes can be linked back to registered aircraft owners via public civil aviation registries.
> This creates a **linkage risk** even without direct storage of owner names.
> See also `docs/specs/10-popia-compliance.md` § Vendor Policy Mapping.

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled:
 *   - callsign (may identify pilot/operator when cross-referenced with public registry)
 *   - ICAO24 hex (links to registered aircraft owner via CAA/FAA public database)
 *   - latitude, longitude, altitude, velocity (real-time position — not stored)
 * Purpose: Real-time airspace visualisation over Cape Town bounding box for urban planning context
 * Lawful basis: legitimate interests — public safety/situational awareness; data is public telemetry;
 *               no de-anonymisation performed; no storage beyond 30s cache TTL
 * Retention: In-memory/SWR cache TTL: 30s; NOT persisted to Supabase or IndexedDB
 * Subject rights: access ✗ | correction ✗ | deletion ✗ | objection ✗
 *   (Real-time public telemetry; no individual data stored; no subject relationship established)
 * POPIA risk level: MEDIUM
 *   (Linkage risk exists via public registry; mitigated by no storage and no de-anonymisation)
 * Review date: 2027-03-11
 *
 * MITIGATIONS:
 *   - No callsign/ICAO24 stored in database or IndexedDB
 *   - Role gate: VIEWER+ only (no GUEST access to flight layer)
 *   - Access logged in audit_log with tenant_id (no individual PI in log entry)
 *   - No cross-referencing with owner registries performed in-app
 *   - Data source badge displayed: [OpenSky Network · LIVE · opensky-network.org]
 */
```

---

## SQL Migration Comment Template

Use this comment block at the top of any migration file that creates or alters a table containing PI.
Migration files are exempt from the 300-line rule but should remain focused.

```sql
-- ============================================================
-- POPIA ANNOTATION
-- Table: [table_name]
-- Personal data handled: [list columns that are PI]
-- Purpose: [why this table exists and why PI is needed]
-- Lawful basis: [consent | contract | legal obligation | legitimate interests]
-- Retention: [deletion cascade trigger or scheduled job]
-- Subject rights:
--   access     : [endpoint or mechanism]
--   correction : [endpoint or mechanism]
--   deletion   : [cascade delete or scheduled purge]
--   objection  : [endpoint or N/A]
-- POPIA risk level: [LOW | MEDIUM | HIGH]
-- RLS: ENABLED + FORCED (tenant_id isolation policy required)
-- Review date: [YYYY-MM-DD]
-- ============================================================
```

### Example — `profiles` table migration

```sql
-- ============================================================
-- POPIA ANNOTATION
-- Table: profiles
-- Personal data handled: email (from auth.users FK), display_name, avatar_url,
--   consent_timestamp, consent_version, tenant_id, role
-- Purpose: Store authenticated user identity and POPIA consent record
-- Lawful basis: consent — explicit checkbox at registration
-- Retention: Deleted within 30 days of account deletion request via cascade
-- Subject rights:
--   access     : GET /api/me/data
--   correction : PATCH /api/me/update
--   deletion   : DELETE /api/me (cascade)
--   objection  : POST /api/me/consent (consent withdrawal)
-- POPIA risk level: MEDIUM
-- RLS: ENABLED + FORCED (tenant_id isolation policy required)
-- Review date: 2027-03-11
-- ============================================================
```

---

## Quick-Fill Checklist by CapeTown GIS Scenario

Use this table to quickly select the right values when annotating a new file.

| Scenario | PI fields | Lawful basis | Risk level | Retention |
|----------|-----------|-------------|------------|-----------|
| **Basemap / map tiles** | None (no PI) | N/A — no annotation needed | — | — |
| **Suburb boundaries layer** | None (public spatial) | N/A | — | — |
| **Zoning overlay layer** | None (public data) | N/A | — | — |
| **Cadastral parcels (public)** | None at zoom < 14 | N/A | — | — |
| **User profile / auth** | email, display_name, consent | consent | MEDIUM | 30 days post-deletion |
| **Saved searches** | user_id, query strings | contract | LOW | 30 days post-deletion |
| **Favourites** | user_id, parcel_id | contract | LOW | 30 days post-deletion |
| **Property data (GV Roll)** | erf number, valuation (no owner name — Rule 8) | contract | LOW | Per GV Roll update cycle |
| **Audit log** | SHA256(user_id), action, timestamp | legal obligation | LOW | 7 years |
| **Flight tracking (OpenSky)** | callsign, ICAO24 (transient) | legitimate interests | MEDIUM | 30s cache TTL only |
| **Street View imagery** | None stored (API proxied) | legitimate interests | LOW | Not stored |
| **Tenant settings** | tenant admin email (organisational) | contract | LOW | While tenant account active |

---

## Risk Level Decision Tree

```
Does the file store, transmit, or process any personal information?
│
├── NO  → No annotation required. Add a single-line comment:
│         // No personal data handled — POPIA annotation not required
│
└── YES → Does it involve special personal information (§26: health,
          race, biometrics, criminal history, children's data)?
          │
          ├── YES → Risk level: HIGH. Escalate to human before proceeding.
          │
          └── NO  → Is PI transferred cross-border or to a third party
                    without a signed DPA?
                    │
                    ├── YES → Risk level: HIGH or MEDIUM. Verify DPA exists.
                    │
                    └── NO  → Small volume, internal use, no linkage risk?
                              │
                              ├── YES → Risk level: LOW
                              └── NO  → Risk level: MEDIUM
```

---

*Template v1.0 · 2026-03-11 · Created for M7 OpenSky Flight Tracking readiness (Unit 2)*
*Maintained by: agent writing the feature → reviewed by human before merge*
