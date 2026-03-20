# Git Workflow — CapeTown GIS Hub

<!--
origin: affaan-m/everything-claude-code/rules/common/git-workflow.md
adaptation-summary: Added fleet commit format and milestone-scoped commit types.
  PR workflow adapted for milestone DoD gates.
-->

## Commit Message Format

```
<type>(<scope>): <description>

<optional body>
```

**Types:** `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `perf` | `ci` | `spatial`

**Fleet auto-maintained commits:**

```
docs(auto): {action} in {dir} [{agent_id}]
```

**Examples:**

```
feat(m17): add buffer analysis tool using Turf.js
fix(rls): enforce tenant_id check on api_cache table
docs(auto): update INDEX.md in .claude [ANTIGRAVITY]
spatial(tiles): add Martin MVT source for flood-risk layer
test(e2e): add Playwright test for guest-mode layer visibility
```

## Pull Request Workflow

1. Analyze full commit history — `git diff main...HEAD`
2. Verify all CLAUDE.md rules are satisfied (run `/milestone-audit`)
3. Draft comprehensive PR summary including test plan
4. Never merge without: passing CI, `COMPLIANCE-AGENT` sign-off, milestone DoD gate
5. Push with `-u` flag if new branch

## Branch Naming

```
feature/m<N>-<short-description>
fix/<issue-slug>
docs/<topic>
chore/<task>
```

## Pre-Commit Checklist

- [ ] No secrets in staged files (`git diff --staged | grep -i 'key\|secret\|password'`)
- [ ] POPIA annotations present on personal-data files
- [ ] Source badges on all new data display components
- [ ] `PLAN.md` CURRENT_PHASE updated if milestone advanced
