# HOOKS.md — Git and Actions Hook Reference

**Name**: .github/HOOKS.md  
**Purpose**: GitHub-facing reference detailing the Git hooks (`pre-commit`) and GitHub Actions (`pull_request`) that enforce safety, linting, and quality gates automatically.  
**When to invoke**: When diagnosing unexpected CI failures or configuring local developer Git constraints.  
**Example invocation**: Read `.github/HOOKS.md`  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**: N/A (Hook Registry)

---

## 🔒 Active Configuration Hooks

### 1. Husky Pre-Commit Linter (`pre-commit`)

**Name**: Husky Pre-Commit Linter  
**Purpose**: Automatically normalizes and lints `js, ts, jsx, tsx, py, rb` implementations prior to staging a commit locally. Eliminates unused import regressions.  
**When to invoke**: `git commit`  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### 2. Badge Lint Check (`pull_request` Action)

**Name**: Badge Lint Action  
**Purpose**: Catches Rule 1 violations (missing badge) when data retrieval patterns (`fetch(`, `supabase.`) are sensed in `src/components/*.tsx`. Blocks PR merge.  
**When to invoke**: `pull_request` to `main`  
**Example invocation**: N/A  
**Related agents/skills**: `BADGE-AUDIT-AGENT`  
**Configuration snippet**:

```yaml
name: Badge Lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run lint:badges
```

### 3. Fallback Verify Action

**Name**: Fallback Verify Action  
**Purpose**: Checks `src/app/api/*.ts` for complete `LIVE`, `CACHED`, and `MOCK` implementation references. Enforces Rule 2.  
**When to invoke**: `pull_request` to `main`  
**Example invocation**: N/A  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**: None

### 4. RLS Check Post-Migration Action

**Name**: RLS Check Action  
**Purpose**: Verifies canonical tenant isolation logic after every new Supabase migration write in `supabase/migrations/` via an isolated test runner. Enforces repo Rule 4.  
**When to invoke**: `pull_request` touching `supabase/migrations/*.sql`  
**Example invocation**: N/A  
**Related agents/skills**: `DB-MODE`  
**Configuration snippet**: None

### 5. File Size Guard Action

**Name**: File Size Guard Action  
**Purpose**: Fails Checks on `src/*.ts(x)` files exceeding the strict 300-line Rule 7 Refactor protocol. Prevents component bloat from merging.  
**When to invoke**: `pull_request` to `main`  
**Example invocation**: N/A  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**: None
