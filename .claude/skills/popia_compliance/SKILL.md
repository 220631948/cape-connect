---
name: popia-compliance
description: POPIA compliance checklist for South African data protection. Invoke before finalising any file that handles personal information. Not legal advice.
---

# POPIA Compliance Check

## Purpose
Systematically verify that code handling personal information complies with South Africa's Protection of Personal Information Act (POPIA). This skill enforces CLAUDE.md Rule 5.

## Trigger Condition
Invoke when creating or editing any file that reads, writes, stores, transmits, or displays personal information. Key tables: `profiles`, `favourites`, `saved_searches`, `audit_log`.

## Procedure

### Step 1 — Identify Personal Information
List ALL personal information (PI) the file handles:
- Names, contacts, email addresses
- ID numbers, online identifiers (session tokens, IPs)
- Location data, property ownership details
- Behavioural data (search history, favourites)

### Step 2 — Identify Purpose
State the specific, lawful purpose for each data item. Vague purposes like "analytics" are insufficient.

### Step 3 — Identify Lawful Basis
For each data item, select one:
- **Consent** — explicit opt-in from data subject
- **Contract** — necessary to fulfil a contract
- **Legal obligation** — required by law
- **Vital interests** — protect someone's life
- **Public interest** — exercise public authority
- **Legitimate interests** — balanced against data subject's rights

### Step 4 — Data Minimisation
Are we collecting more than necessary? Remove excess fields. No speculative data collection.

### Step 5 — Retention & Deletion
- Document retention period for each data item
- Confirm deletion mechanism exists (soft delete → hard delete after retention)
- Data must not be retained longer than necessary

### Step 6 — Security Measures
- **Database:** Confirm RLS enabled (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`)
- **API:** Confirm auth middleware on all routes serving PI
- **Frontend:** No PI in client-side localStorage/sessionStorage
- **Transmission:** HTTPS only

### Step 7 — Data Subject Rights
Verify technical support for:
- ✓ Access — data subject can request their data
- ✓ Correction — data subject can update inaccurate data
- ✓ Deletion — data subject can request erasure (POPIA §23)
- ✓ Objection — data subject can object to processing

### Step 8 — Audit Logging
Significant actions must be logged in the `audit_log` table:
- Login / logout
- Data export
- Record deletion
- Consent changes
- Role changes

## Required Output
Add this header to every file that passes the check:

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

Produce a compliance summary:
- ✅ COMPLIANT items
- ⚠️ REQUIRES ATTENTION items
- 🚨 ESCALATE TO LEGAL items

## When NOT to Use This Skill
- Files that never touch personal information (map rendering, tile serving, static assets)
- Test fixtures using obviously synthetic data
- Migration files (they get their own POPIA review at M15)
