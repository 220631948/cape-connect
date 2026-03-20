# HOOKS.md — Claude Code Hook Reference

**Name**: .claude/HOOKS.md  
**Purpose**: Claude-facing reference detailing the pre- and post-tool execution hooks that enforce safety, linting, and quality gates automatically. Eliminates the need for explicit agent orchestration of linting or logging scripts.  
**When to invoke**: When diagnosing unexpected tool denials, verifying telemetry log behaviors, or creating new system constraints.  
**Example invocation**: Read `.claude/HOOKS.md`  
**Related agents/skills**: `COMPLIANCE-AGENT`  
**Configuration snippet**: N/A (Hook Registry)

---

## 🔒 Active Hooks

### 1. Auto-Linter (`PostToolUse`)

**Name**: PostToolUse Auto-Linter  
**Purpose**: Automatically normalizes and lints `js, ts, jsx, tsx, py, rb` implementations after a `Write` or `Edit` agent tool execution. Eliminates "stray whitespace" and unused import regressions.  
**When to invoke**: `Edit|MultiEdit`  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```json
"PostToolUse": [
  {
    "matcher": "Edit|MultiEdit",
    "hooks": [
      {
        "type": "command",
        "command": "if [[ \"$CLAUDE_TOOL_FILE_PATH\" == *.ts...]]; then npx eslint \"$CLAUDE_TOOL_FILE_PATH\" --fix 2>/dev/null || true; fi"
      }
    ]
  }
]
```

### 2. Command Activity Logger (`PreToolUse`)

**Name**: PreToolUse Command Activity Logger  
**Purpose**: Appends a structured audit trail (`~/.claude/command-log.txt`) on every single action performed by the agent suite to enforce observability across multi-step execution graphs.  
**When to invoke**: `*` (All commands)  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```json
"PreToolUse": [
  {
    "matcher": "*",
    "hooks": [
      {
        "type": "command",
        "command": "echo \"[$(date)] Tool: $CLAUDE_TOOL_NAME | File: $CLAUDE_TOOL_FILE_PATH\" >> ~/.claude/command-log.txt"
      }
    ]
  }
]
```

### 3. Badge Lint Pre-Write (D1)

**Name**: D1 Badge Lint Pre-Write  
**Purpose**: Catches Rule 1 violations (missing badge) at write time when data retrieval patterns (`fetch(`, `supabase.`) are sensed in `src/components/*.tsx`. Does not block but writes warning to `stderr`.  
**When to invoke**: `Write` to `src/components/*.tsx`  
**Example invocation**: N/A  
**Related agents/skills**: `BADGE-AUDIT-AGENT`, `source_badge_lint`  
**Configuration snippet**:

```json
"PreToolUse": [
  {
    "matcher": "Write",
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/badge-lint-prewrite.js \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
      }
    ]
  }
]
```

### 4. Fallback Verify Post-Write (D2)

**Name**: D2 Fallback Verify Post-Write  
**Purpose**: Checks `src/app/api/*.ts` for complete `LIVE`, `CACHED`, and `MOCK` implementation references. Enforces CLAUDE.md Rule 2.  
**When to invoke**: `Write` to `src/app/api/*.ts`  
**Example invocation**: N/A  
**Related agents/skills**: `FALLBACK-VERIFY-AGENT`  
**Configuration snippet**:

```json
"PostToolUse": [
  {
    "matcher": "Write",
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/fallback-verify-postwrite.js \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
      }
    ]
  }
]
```

### 5. MCP Health Pre-Check (D3)

**Name**: D3 MCP Health Pre-Check  
**Purpose**: Fast-fail lock checking proxy. Triggers an ESCALATE protocol to the user if P0 infrastructure services (`doc-state`, `filesystem`) degrade prior to executing an agent Task.  
**When to invoke**: `Task` execution  
**Example invocation**: N/A  
**Related agents/skills**: `MCP-HEALTH-AGENT`, `mcp_health_check`  
**Configuration snippet**:

```json
"PreToolUse": [
  {
    "matcher": "Task",
    "hooks": [
      {
        "type": "command",
        "command": "node .claude/hooks/mcp-health-precheck.js"
      }
    ]
  }
]
```

### 6. RLS Check Post-Migration (D4)

**Name**: D4 RLS Check Post-Migration  
**Purpose**: Verifies canonical tenant isolation logic after every new Supabase migration write in `supabase/migrations/`. Enforces CLAUDE.md Rule 4.  
**When to invoke**: `Write` on `supabase/migrations/*.sql`  
**Example invocation**: N/A  
**Related agents/skills**: `DB-AGENT`, `rls_audit`  
**Configuration snippet**:

```bash
command: "bash scripts/check-rls.sh \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null || true"
```

### 7. File Size Guard (D5)

**Name**: D5 File Size Guard  
**Purpose**: Issues non-blocking warnings on `src/*.ts(x)` files exceeding the strict 300-line Rule 7 Refactor protocol. Prevents component bloat.  
**When to invoke**: `Write` on `src/*.ts` or `src/*.tsx`  
**Example invocation**: N/A  
**Related agents/skills**: `REFACTOR-SPECIALIST`  
**Configuration snippet**:

```javascript
node .claude/hooks/filesize-guard.js "$CLAUDE_TOOL_INPUT_FILE_PATH"
```
