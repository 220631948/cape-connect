---
name: instinct-guard
description: Apply project-level behavioral guardrails before any code write. Adapted from affaan-m/everything-claude-code instincts/ pattern. Invoke before editing any governed file.
---

# Instinct Guard

## Purpose
Enforce non-negotiable project instincts (from CLAUDE.md) as a pre-flight checklist
before any file write or architectural decision.

## Instinct Checklist
Before writing any file, confirm:
- [ ] File is within geographic scope (Cape Town + Western Cape only, bbox 18.0/-34.5/19.5/-33.0)
- [ ] No Lightstone data references (Rule 8 — GV Roll 2022 is the approved valuation source)
- [ ] File ≤ 300 lines (Rule 7 — planning docs and migrations exempt)
- [ ] No hardcoded credentials (Rule 3 — credentials in `.env` only)
- [ ] RLS enforced if touching a database table (Rule 4 — both RLS + application layer)
- [ ] POPIA annotation present if personal data is handled (Rule 5)
- [ ] Source badge will be added to any data display (Rule 1 — `[SOURCE·YEAR·LIVE|CACHED|MOCK]`)
- [ ] Three-tier fallback wired (Rule 2 — LIVE→CACHED→MOCK, never blank map)

## Trigger
Invoke at session start when working on governed files, or when unsure whether
a proposed change respects CLAUDE.md constraints.

## Output
- PASS: list all 8 checks as ✓ — proceed
- FAIL: list failing check(s) — STOP and resolve before writing

## Example Output
```
Instinct Guard — Pre-flight check
1. Geographic scope ✓ (Cape Town bbox)
2. No Lightstone ✓
3. File size ≤ 300 lines ✓ (estimated 45 lines)
4. No hardcoded credentials ✓
5. RLS enforced ✓ (table: api_cache)
6. POPIA annotation ✓ (personal data: none)
7. Source badge ✓ (badge: `[OpenSky·2026·LIVE]`)
8. Three-tier fallback ✓ (mock: public/mock/flights-cape-town.geojson)

RESULT: PASS — proceed with file write
```
