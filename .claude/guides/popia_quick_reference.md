# POPIA Quick Reference — Technical Implementation Guide

## The 8 Conditions for Lawful Processing

### 1. Accountability (§8)
- **Technical:** Designate an Information Officer
- **Code:** Audit log captures all data access/modification
- **Agent:** All agents must log actions touching PI in `audit_log` table

### 2. Processing Limitation (§9-12)
- **Technical:** Only process data for the specific, stated purpose
- **Code:** Each PI field has a documented purpose in the POPIA annotation
- **Action:** Remove any field not serving a documented purpose

### 3. Purpose Specification (§13-14)
- **Technical:** Collect for specific, explicitly defined purposes
- **Code:** Purpose stated in POPIA annotation header
- **Test:** Can you explain WHY each data field exists?

### 4. Further Processing Limitation (§15)
- **Technical:** Don't reuse data for undisclosed purposes
- **Code:** No sharing of user data between tenants
- **Test:** `tenant_id` RLS prevents cross-tenant data access

### 5. Information Quality (§16)
- **Technical:** Data must be complete, accurate, not misleading
- **Code:** Input validation on all PI fields
- **Action:** Provide data subject access for correction

### 6. Openness (§17-18)
- **Technical:** Inform data subjects about processing
- **Code:** POPIA consent banner at registration (M2)
- **UI:** Privacy policy link visible on every page

### 7. Security Safeguards (§19-22)
- **Technical:** Appropriate security measures
- **Code requirements:**
  - RLS on all tables (`ENABLE + FORCE`)
  - HTTPS only (Vercel enforces)
  - No PI in client-side storage
  - Auth middleware on all API routes serving PI
  - Service role key in `.env` only (never client-side)

### 8. Data Subject Participation (§23-25)
- **Technical:** Enable access, correction, deletion, objection
- **Code requirements:**
  - `/api/me/data` — export user's data (access right)
  - `/api/me/update` — update profile (correction right)
  - `/api/me/delete` — delete account and data (deletion right)
  - `/api/me/consent` — withdraw consent (objection right)
  - All actions logged in `audit_log`

## Data Classification Quick Check

| Data Type | Example | POPIA? | Required Controls |
|-----------|---------|--------|-------------------|
| Profile info | name, email | YES | RLS, consent, audit log |
| Property ownership | owner name | YES | RLS, consent, GUEST-restricted |
| Search history | saved searches | YES | RLS, retention policy |
| Favourites | bookmarked properties | YES | RLS, deletion on request |
| Session tokens | JWT | YES | Secure cookies, expiry |
| Map viewport | zoom/centre | NO | No personal data |
| Zone codes | IZS classification | NO | Public data |
| Aggregate stats | avg property value | NO | No individual identification |

## Guest Mode POPIA Boundary
- Guests may view: aggregate data, public zone codes, basemap
- Guests may NOT view: property owner names, individual valuations
- NO data collected from guests except: page views (anonymised)
- Max 3 sign-up prompts per session before backed off

## POPIA Annotation Template
```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [list]
 * Purpose: [specific purpose]
 * Lawful basis: [consent | contract | legal obligation | legitimate interests]
 * Retention: [period]
 * Subject rights: [access ✓ | correction ✓ | deletion ✓ | objection ✓]
 */
```

## Annotation Template (Extended)

> The minimal block above is the CLAUDE.md Rule 5 minimum. For full guidance — field explanations,
> worked examples for each lawful basis, M7 OpenSky flight data annotation, SQL migration version,
> quick-fill scenario table, and risk-level decision tree — see:
>
> **`docs/specs/POPIA_ANNOTATION_TEMPLATE.md`**

The extended template adds two required fields beyond the Rule 5 minimum:
- `POPIA risk level: [LOW | MEDIUM | HIGH]` — informs code review triage
- `Review date: [YYYY-MM-DD]` — ensures annotations do not go stale

All new files touching personal data MUST use the extended template from
`docs/specs/POPIA_ANNOTATION_TEMPLATE.md`, not the minimal block above.
