---
name: popia-compliance
description: POPIA compliance checklist for South African data protection. Not legal advice.
---

# POPIA Compliance Check

Invoke before finalising any file that handles personal information.

## Checklist

1. **Identify Personal Information:** List all PI handled (names, contacts, IDs, location, online identifiers, behavioural data).
2. **Identify Purpose:** State the specific, lawful purpose for each data item.
3. **Identify Lawful Basis:** consent / contract / legal obligation / vital interests / public interest / legitimate interests.
4. **Data Minimisation:** Are we collecting more than necessary? Remove excess.
5. **Retention & Deletion:** Document retention period and deletion mechanism. Data must not be retained longer than necessary.
6. **Security Measures:** DB: confirm RLS. API: confirm auth. Frontend: no PI in client-side storage.
7. **Data Subject Rights:** Access, correction, deletion (POPIA §23), objection must be technically supported.
8. **Audit Logging:** Significant actions (login, export, deletion) must be logged in `audit_log` table.

## Required Header
```
// [POPIA] Personal information handled: [list]
// Purpose: [specific purpose]
// Lawful basis: [basis]
// Retention: [period]
// Reviewed by: [name] on [date]
```
