---
name: continuous-learning-v2
description: Instinct-based learning system. Extracts session patterns into confidence-scored instincts and clusters them into skills via /evolve.
---

<!--
origin: affaan-m/everything-claude-code/skills/continuous-learning-v2/
adaptation-summary: GIS Hub instinct categories added (see categories table).
  Confidence scoring and /evolve cluster workflow preserved from ECC.
-->

# Continuous Learning v2 — GIS Hub Instinct System

## Overview

After significant sessions, captured patterns become **instincts** — structured, confidence-scored learnings that improve future agent behaviour. When enough instincts cluster around a theme, `/evolve` generates a new SKILL.md.

## Instinct Categories

| Category                     | Description                              | Min-Confidence |
| ---------------------------- | ---------------------------------------- | -------------- |
| `spatial_validation_pattern` | Geometry validation approaches           | 0.7            |
| `rls_bypass_guard`           | Anti-patterns that risked RLS bypass     | 0.6            |
| `tile_perf_threshold`        | Feature count → Martin handoff decisions | 0.8            |
| `popia_surface`              | Code patterns touching personal data     | 0.6            |
| `three_tier_path`            | Fallback implementations that worked     | 0.7            |
| `agent_handoff`              | Effective agent delegation sequences     | 0.7            |
| `mcp_server_usage`           | MCP call patterns with good outcomes     | 0.5            |
| `milestone_dod_pattern`      | Milestone completion patterns            | 0.75           |

## Instinct File Format

Location: `.claude/instincts/YYYYMMDD-<milestone>.json`

```json
{
  "session_date": "2026-03-17",
  "milestone": "M17",
  "agent": "ANTIGRAVITY",
  "instincts": [
    {
      "id": "TPT-001",
      "category": "tile_perf_threshold",
      "pattern": "Suburb boundaries >8000 features caused MapLibre lag; switched to Martin at 8k",
      "confidence": 0.85,
      "source": "M17 analysis session — MapLibre performance observation",
      "tags": ["maplibre", "martin", "perf"]
    }
  ]
}
```

## Capture Workflow

1. At session end, run `/learn` or `/learn-eval`
2. `CONTINUOUS-LEARNING-AGENT` reviews session tool calls + outcomes
3. Extracts 3–7 high-signal patterns (confidence ≥ 0.5)
4. Writes to `.claude/instincts/` — never overwrites existing files
5. Run `/instinct-status` to see accumulated instincts

## Evolution Workflow

```
/instinct-status          # see all instincts grouped by category
/evolve                   # when ≥10 instincts in a category → creates SKILL.md
```

## Commands

- `/learn` — extract patterns from current session
- `/learn-eval` — extract, score, and save with evaluation
- `/instinct-status` — view instincts grouped by category with confidence
- `/evolve` — cluster instincts into a new SKILL.md

## Guardrails

- Confidence < 0.5 → discard
- PII in pattern text → reject (POPIA)
- Max 7 instincts per session (quality over quantity)
- Instinct IDs are immutable (format: `CAT-NNN`)
