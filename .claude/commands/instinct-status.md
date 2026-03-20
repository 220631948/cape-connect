---
description: View learned instincts with confidence scores, grouped by GIS category
---

<!--
origin: affaan-m/everything-claude-code/commands/instinct-status.md (enhanced)
adaptation-summary: Added GIS Hub instinct categories, confidence display, and /evolve threshold indicator.
-->

# /instinct-status — View GIS Hub Instincts

Display all learned instincts from `.claude/instincts/*.json`, grouped by category.

## Output Format

```
📊 GIS Hub Instinct Status — [date]

  spatial_validation_pattern  (4 instincts, avg confidence: 0.82) ✅
  tile_perf_threshold         (3 instincts, avg confidence: 0.87) ✅
  rls_bypass_guard           (2 instincts, avg confidence: 0.71) ✅
  popia_surface               (6 instincts, avg confidence: 0.68) 🔄 → /evolve ready (≥5)
  three_tier_path             (1 instinct,  avg confidence: 0.75)
  agent_handoff               (0 instincts)
  mcp_server_usage            (2 instincts, avg confidence: 0.55)

  Total: 18 instincts across 6 categories
  Evolve candidates: popia_surface (6 instincts ≥ 5 threshold)

  Run /evolve to cluster popia_surface into a new SKILL.md
```

## Steps

1. Glob `.claude/instincts/*.json`
2. Parse and group by `category`
3. Calculate avg confidence per category
4. Flag categories with ≥ 5 instincts as `/evolve ready`
5. List top 3 highest-confidence instincts overall
