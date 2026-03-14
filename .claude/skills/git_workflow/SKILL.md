---
name: git-workflow
description: Git branching and commit conventions for the CapeTown GIS Hub milestone sequencer. Adapted from VoltAgent/awesome-agent-skills git-expert pattern. Use when creating branches, writing commit messages, or reviewing PR readiness.
---

# Git Workflow

## Branch Convention

| Branch type | Pattern | Example |
|-------------|---------|---------|
| Feature | `feat/M<N>-<short-description>` | `feat/M7-flight-tracking` |
| Hotfix | `hotfix/<short-description>` | `hotfix/rls-policy-bypass` |
| Research / docs | `docs/<short-description>` | `docs/opensky-research` |
| Skill integration | `feat/M0-<skill-name>` | `feat/M0-integrate-skills` |

> **Never commit directly to `main` — always PR.**
> `main` is the production branch; `master` is the working integration branch.

## Commit Message Format

```
<type>(<scope>): <description>

<body — optional, wrap at 72 chars>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types:** `feat` | `fix` | `docs` | `refactor` | `test` | `chore`
**Scope:** milestone or component (e.g., `M7`, `maplibre`, `rls`, `M0-skills`)

### Examples
```
feat(M7): add OpenSky three-tier fallback with mock GeoJSON

- LIVE: OpenSky API with 30s cache
- CACHED: Supabase api_cache table
- MOCK: public/mock/flights-cape-town.geojson

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```
docs(M0): add instinct_guard and security_review skills

Adapted from affaan-m/everything-claude-code instincts/ pattern.
No external code copied — skill logic authored from plan templates.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Pre-commit Checks

Before committing, verify:
- [ ] No secrets in staged files: `grep -rE "(api_key|secret|password)\s*=" <staged_files>`
- [ ] File size ≤ 300 lines per CLAUDE.md Rule 7 (planning docs and migrations exempt)
- [ ] Linter passes: `npm run lint`
- [ ] No `console.log` left in production API routes

## PR Checklist

```markdown
## Summary
- [ ] What changed (1–3 bullets)
- [ ] Why (link to milestone task or PLAN.md section)

## Milestone
M[N] — [milestone name]

## CLAUDE.md Compliance
- [ ] Geographic scope respected (Rule 9)
- [ ] No Lightstone data (Rule 8)
- [ ] Source badges present on new data components (Rule 1)
- [ ] Three-tier fallback wired (Rule 2)
- [ ] No hardcoded credentials (Rule 3)
- [ ] RLS on new tables (Rule 4)
- [ ] POPIA annotations on personal data files (Rule 5)
- [ ] File size ≤ 300 lines (Rule 7)

## Testing
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Mock fallback renders without error
```

## Hotfix Protocol
1. Branch from `main`: `git checkout -b hotfix/<description> main`
2. Fix and commit with `fix(<scope>): <description>`
3. PR to `main` (bypass milestone sequencing only for security/data issues)
4. Cherry-pick onto `master` after merge

## Milestone Sequencing Rule
Per CLAUDE.md Rule 10: milestones are sequential M0–M15.
- Do not merge M(N+1) features before M(N) DoD is confirmed by human.
- Feature branches should be prefixed with the milestone they belong to.
