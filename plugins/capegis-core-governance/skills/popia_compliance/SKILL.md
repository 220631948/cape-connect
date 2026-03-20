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

---

## GV Roll / ETL-Specific PII Handling

When working on data ingestion scripts (especially the GV Roll ETL — Milestone M6):

1. **Strip PII in memory before any DB write.** The `Full_Names` column (and any `owner_name`, `id_number`, `owner_email` fields) must be deleted from the DataFrame/object before it touches any database, file, or log.
2. **Verify in staging:** After loading to staging table, run a column check to confirm no PII column exists.
3. **Error logs contain ERF numbers only** — never log rejected row content that might contain owner names.
4. **PMTiles for offline** must be generated from sanitised PostGIS views only.

```python
# Correct PII stripping pattern (ETL_PIPELINE.md)
PII_COLS = ['Full_Names', 'owner_name', 'owner_email', 'id_number']
chunk.drop(columns=[c for c in PII_COLS if c in chunk.columns], inplace=True)

# Verify before DB write
assert not any(col in chunk.columns for col in PII_COLS), "PII not stripped!"
```

```sql
-- Staging verification (must return 0 rows before production transfer)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'gv_roll_staging'
  AND column_name IN ('Full_Names', 'owner_name', 'owner_email');
```

## Martin Tile Views (Spatial PII)

PostGIS views served by Martin must exclude personal data columns. Review any new view with:
```sql
-- Check view definition for PII columns
SELECT definition FROM pg_views WHERE viewname = 'your_tile_view';
```
Reject views containing: `owner_name`, `owner_email`, `full_names`, `id_number`, `contact_`.

## POPIA Annotation Template (Rule 5)

For TypeScript files:
```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [list — e.g., email, login timestamp, ERF number if linked to owner]
 * Purpose: [specific — e.g., property valuation display, user authentication]
 * Lawful basis: [consent | contract | legal obligation | legitimate interests]
 * Retention: [period — e.g., account active + 30 days; GV Roll cycle ~4 years]
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */
```

For SQL migration files:
```sql
-- POPIA: This table contains [none|minimal|personal] data.
-- Personal data: [list columns]
-- Retention: [period]
-- Deletion mechanism: [CASCADE | manual purge | RLS expiry]
```
