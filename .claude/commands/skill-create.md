---
description: Generate SKILL.md files by analyzing git history for recurring patterns in this repository
---

<!--
origin: affaan-m/everything-claude-code/commands/skill-create.md
adaptation-summary: Scoped to GIS Hub skill categories and existing .claude/skills/ structure.
  Local analysis mode (no GitHub App required).
-->

# /skill-create — Generate Skills from Git History

Analyzes commit history and codebase to generate SKILL.md files for detected recurring patterns.

## Usage

```bash
# Analyze current repo — generates SKILL.md candidates
/skill-create

# Also generate instincts for continuous-learning-v2
/skill-create --instincts
```

## What It Does

1. Read last 200 commits — `git log --oneline -200`
2. Identify recurring patterns (commit type + file patterns)
3. Group patterns by GIS Hub skill categories:
   - `spatial` → spatial validation, geometry ops
   - `rls` → row-level security patterns
   - `tile` → tile generation, Martin config
   - `popia` → POPIA annotation patterns
   - `auth` → authentication / tenant isolation
   - `api` → API route patterns
   - `e2e` → Playwright test patterns
4. For each category with ≥ 3 pattern matches → generate `SKILL.md` candidate
5. Write candidates to `.claude/skills/<category>_generated/SKILL.md`
6. Prompt human review before using

## Output Location

`.claude/skills/<category>_generated/SKILL.md` — human review required before use

## Notes

- Generated skills are **candidates** — review before adding to active skill registry
- Existing skills (listed in `.claude/SKILLS.md`) are compared — duplicates flagged
- Add `--instincts` to also emit `.claude/instincts/<date>-skill-create.json`
