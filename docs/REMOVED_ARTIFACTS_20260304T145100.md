<!-- __generated_by: rebootstrap_agent -->
<!-- __timestamp: 2026-03-04T14:51:00Z -->

# Removed Artifacts Log — 2026-03-04T14:51:00Z

> **TL;DR:** Itemised log of artifacts removed during the second rebootstrap pass (2026-03-04T14:51), with removal rationale for each file.


## Summary

This document records artifacts removed or replaced during the copilot instructions
cleanup on 2026-03-04. The goal was to remove legacy branding, non-functional guards,
and unapproved stack references, replacing them with production-aligned instructions.

---

## 1. `.github/copilot/hooks/copilot-hooks.json`

**Status:** Previously removed (backup at `.github/copilot/hooks/copilot-hooks.json.bak`)

**What it contained:**

```json
{
    "hooks": {
        "SessionStart": [
            {
                "type": "command",
                "command": "echo '[RALPH] 🐛 Session started. Read AGENTS.md...' >&2"
            }
        ],
        "PreToolUse": [
            {
                "type": "command",
                "command": "echo '[RALPH SAFETY] Before file write: (1) Did you SEARCH FIRST?...' >&2"
            },
            {
                "type": "command",
                "command": "echo '[RALPH DESTRUCTIVE GUARD] Before bash: check for rm -rf, DROP...' >&2"
            }
        ],
        "PostToolUse": [
            {
                "type": "command",
                "command": "echo '[RALPH SECRET CHECK] Check for API keys...' >&2"
            },
            {
                "type": "command",
                "command": "echo '[RALPH POPIA] If file handles personal data...' >&2"
            }
        ],
        "Stop": [
            {
                "type": "command",
                "command": "echo '[RALPH SESSION END] Before stopping...' >&2"
            }
        ]
    }
}
```

**Why removed:**
- All hooks were echo-only — no actual enforcement or validation logic
- Used `[RALPH]` branding (Ralph Wiggum Protocol) which is not professional for production CI
- Safety intent was correct but implementation was purely cosmetic
- The echo messages ran on every tool invocation, adding noise without preventing issues

**Replacement:**
- Safety rules are now embedded in `.github/copilot/copilot-instructions.md` under "Vibecoding Safety Rules"
- POPIA checks are now in `.github/workflows/immersive-spatial-validation.yml` (popia-spatial-scan job)
- Secret scanning is handled by the `cesium-config-check` job and existing CI

---

## 2. `.github/copilot/copilot-instructions.md` — Legacy Content Removed

**Items removed from copilot-instructions.md:**

| Removed Item | Reason |
|---|---|
| "Ralph Wiggum Protocol" branding and quotes | Non-professional branding, not aligned with project identity |
| `shadcn/ui` references | Not in approved tech stack (CLAUDE.md §2) |
| `anime.js` and "Ralph Buddy" avatar references | Feature was never implemented; not in approved stack |
| `PostgreSQL 18` version reference | Incorrect — project uses PostgreSQL 15 (CLAUDE.md §2) |
| "Ralph Language" for user-facing strings | Not a real convention; removed |
| "The Ralph Test" final checklist | Replaced with professional vibecoding safety checklist |
| "Is it funny?" / "Is it unpossible to break?" checks | Not actionable quality gates |

**Items preserved:**
- All SA GIS standards (CRS, POPIA, attribution, fallback tiers)
- Atomic task loops and search-first workflow
- No stubs/placeholders rule
- File size limit (<= 300 lines)
- Strict TypeScript (no `any`)
- Three-tier fallback strategy
- Currency formatting (ZAR)

**Items added:**
- CesiumJS / Google 3D Tiles guidelines
- ArcGIS/QGIS upload handling
- 4DGS pipeline considerations
- OpenSky Network data handling
- Vibecoding safety rules
- spatialintelligence.ai inspiration patterns

---

## 3. Cross-references

- New workflow: `.github/workflows/immersive-spatial-validation.yml`
- Updated instructions: `.github/copilot/copilot-instructions.md`
- Existing (untouched): `.github/workflows/ci.yml`
- Existing (untouched): `.github/workflows/spatial-validation.yml`
- Root instructions (untouched): `.github/copilot-instructions.md`
