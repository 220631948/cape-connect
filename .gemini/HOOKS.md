# HOOKS.md — Gemini Hook Reference

**Name**: .gemini/HOOKS.md  
**Purpose**: Gemini-facing reference detailing the pre- and post-tool execution hooks that enforce safety, linting, and quality gates automatically. Eliminates the need for explicit agent orchestration of linting or logging scripts.  
**When to invoke**: When diagnosing unexpected tool denials or verifying telemetry log behaviors within the Gemini Sandbox execution context.  
**Example invocation**: Read `.gemini/HOOKS.md`  
**Related agents/skills**: `GEMINI-COMPLIANCE-AGENT`  
**Configuration snippet**: N/A (Hook Registry)

---

## 🔒 Active Configuration Hooks

### 1. Auto-Linter (`PostToolUse`)

**Name**: PostToolUse Auto-Linter  
**Purpose**: Automatically normalizes and lints `js, ts, jsx, tsx, py, rb` implementations after a `Write` or `Edit` agent tool execution. Eliminates "stray whitespace" and unused import regressions.  
**When to invoke**: File modifications.  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```yaml
hooks:
  postWrite:
    - command: "npx eslint --fix ${FILE_PATH} 2>/dev/null || true"
      match: "**/*.ts, **/*.tsx"
```

### 2. Command Activity Logger (`PreToolUse`)

**Name**: PreToolUse Command Activity Logger  
**Purpose**: Appends a structured audit trail (`~/.gemini/logs/command-log.txt`) on every single action performed by the agent suite to enforce observability across multi-step execution graphs.  
**When to invoke**: All tool executions.  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```yaml
hooks:
  preTool:
    - command: 'echo "[$(date)] Tool: ${TOOL_NAME}" >> ~/.gemini/logs/command-log.txt'
```

### 3. Badge Lint Pre-Write (D1)

**Name**: D1 Badge Lint Pre-Write  
**Purpose**: Catches Rule 1 violations (missing badge) at write time when data retrieval patterns (`fetch(`, `supabase.`) are sensed in `src/components/*.tsx`. Does not block but writes warning to `stderr`.  
**When to invoke**: `Write` to `src/components/*.tsx`  
**Example invocation**: N/A  
**Related agents/skills**: `BADGE-AUDIT-AGENT`  
**Configuration snippet**:

```yaml
hooks:
  preWrite:
    - command: "node scripts/badge-lint-prewrite.js ${FILE_PATH}"
      match: "src/components/**/*.tsx"
```

### 4. Fallback Verify Post-Write (D2)

**Name**: D2 Fallback Verify Post-Write  
**Purpose**: Checks `src/app/api/*.ts` for complete `LIVE`, `CACHED`, and `MOCK` implementation references. Enforces CLAUDE.md/GEMINI.md Rule 2.  
**When to invoke**: `Write` to `src/app/api/*.ts`  
**Example invocation**: N/A  
**Related agents/skills**: `GEMINI-COMPLIANCE-AGENT`  
**Configuration snippet**: None

### 5. MCP Health Pre-Check (D3)

**Name**: D3 MCP Health Pre-Check  
**Purpose**: Fast-fail lock checking proxy. Triggers an ESCALATE protocol to the user if P0 infrastructure services (`doc-state`, `filesystem`) degrade prior to executing an agent Task.  
**When to invoke**: System Initialization  
**Example invocation**: N/A  
**Related agents/skills**: `mcp-check`  
**Configuration snippet**: None

### 6. RLS Check Post-Migration (D4)

**Name**: D4 RLS Check Post-Migration  
**Purpose**: Verifies canonical tenant isolation logic after every new Supabase migration write in `supabase/migrations/`. Enforces repo Rule 4.  
**When to invoke**: `Write` on `supabase/migrations/*.sql`  
**Example invocation**: N/A  
**Related agents/skills**: `DB-AGENT`  
**Configuration snippet**: None

### 7. File Size Guard (D5)

**Name**: D5 File Size Guard  
**Purpose**: Issues non-blocking warnings on `src/*.ts(x)` files exceeding the strict 300-line Rule 7 Refactor protocol. Prevents component bloat.  
**When to invoke**: `Write` on `src/*.ts` or `src/*.tsx`  
**Example invocation**: N/A  
**Related agents/skills**: `GEMINI-COMPLIANCE-AGENT`  
**Configuration snippet**: None
