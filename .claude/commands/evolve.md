---
description: Cluster related instincts into a new SKILL.md when a category reaches evolution threshold
---

<!--
origin: affaan-m/everything-claude-code/commands/evolve.md
adaptation-summary: Threshold set to 5 instincts per GIS Hub category (vs 10 in ECC — smaller,
  more focused project). Output writes to existing .claude/skills/ structure.
-->

# /evolve — Cluster Instincts into Skills

When a GIS Hub instinct category reaches ≥ 5 instincts, `/evolve` clusters them into a new SKILL.md.

## Trigger

Run after `/instinct-status` shows a category is "🔄 evolve ready":

```
popia_surface  (6 instincts, avg confidence: 0.68) 🔄 → /evolve ready
```

## What It Does

1. Read all instinct files from `.claude/instincts/*.json`
2. Group by category; find those with ≥ 5 instincts
3. For each ready category:
   - Synthesize patterns into a structured SKILL.md
   - Write to `.claude/skills/<category>_evolved/SKILL.md`
   - Add `origin: evolved-from-instincts` annotation
4. Prompt: "Should this skill replace the existing one? Y to merge, N to keep as candidate"

## Output

- `.claude/skills/<category>_evolved/SKILL.md` — new skill synthesized from instincts
- Human approval required before replacing/merging with existing skills

## Example Output

```
✅ Evolved: popia_surface → .claude/skills/popia_surface_evolved/SKILL.md
   Based on 6 instincts (avg confidence: 0.68)
   Patterns captured: 4 file annotation patterns, 2 API surface guards

Merge with existing popia_compliance skill? [Y/N]
```

## GIS Hub Evolution Threshold: 5 instincts

(Lower than ECC's 10 — smaller, domain-focused project)
