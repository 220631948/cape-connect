# HOOKS.md — CapeTown GIS Hub Claude Code Hook Reference

> Claude-facing reference for all hooks configured in `.claude/settings.local.json` and planned hooks in the agent pipeline. Cross-reference: `docs/infra/hooks-reference.md`.

**Hook runtime:** Claude Code (`settings.local.json`) | **Last updated:** 2026-03-14 | **Active hooks:** 7

---

## What Are Hooks?

Claude Code hooks are shell commands that run automatically before or after tool use. They enforce code quality, governance, and documentation consistency without requiring the agent to explicitly remember to run linters or log activity.

Hooks are configured in `.claude/settings.local.json` under the `hooks` key.

---

## Hook Implementation Files

Custom Node.js hook scripts live in `.claude/hooks/`. All scripts:
- Language: Node.js CommonJS (`require()` syntax)
- Max: 50 lines per file
- Exit: always `process.exit(0)` — non-blocking
- Output: `process.stderr.write()` only (no stdout pollution)
- Completes in < 500ms

| File | Trigger | What It Does |
|------|---------|-------------|
| `.claude/hooks/badge-lint-prewrite.js` | D1 — PreToolUse Write on `src/components/**/*.tsx` | Detects data-fetch patterns; warns if SourceBadge missing |
| `.claude/hooks/fallback-verify-postwrite.js` | D2 — PostToolUse Write on `src/app/api/**/*.ts` | Checks for LIVE/CACHED/MOCK tiers; warns on partial/missing |
| `.claude/hooks/mcp-health-precheck.js` | D3 — PreToolUse Task | Checks P0 MCP server paths; outputs ESCALATE if any missing |
| `.claude/hooks/filesize-guard.js` | D5 — PostToolUse Write on `src/**` | Counts lines; warns if > 300 (Rule 7); skips tests/migrations |

---

## Active Hooks (Configured in settings.local.json)

---

### Hook 1 — PostToolUse: Auto-Linter (ESLint / pylint / rubocop)

**Type:** `PostToolUse`
**Matcher:** `Edit|MultiEdit`
**Trigger condition:** Any `Edit` or `MultiEdit` tool use that writes to a `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, or `.rb` file.

**What it does:**
- **TypeScript/JavaScript** (`.js`, `.ts`, `.jsx`, `.tsx`): runs `npx eslint <file> --fix` — auto-fixes linting issues in the file just written.
- **Python** (`.py`): runs `pylint <file>` — reports linting warnings (no auto-fix; agent must address manually).
- **Ruby** (`.rb`): runs `rubocop <file> --auto-correct` — auto-fixes style issues.

**Configuration:**
```json
{
  "PostToolUse": [
    {
      "matcher": "Edit|MultiEdit",
      "hooks": [
        {
          "type": "command",
          "command": "if [[ \"$CLAUDE_TOOL_FILE_PATH\" == *.js || \"$CLAUDE_TOOL_FILE_PATH\" == *.ts || \"$CLAUDE_TOOL_FILE_PATH\" == *.jsx || \"$CLAUDE_TOOL_FILE_PATH\" == *.tsx ]]; then npx eslint \"$CLAUDE_TOOL_FILE_PATH\" --fix 2>/dev/null || true; elif [[ \"$CLAUDE_TOOL_FILE_PATH\" == *.py ]]; then pylint \"$CLAUDE_TOOL_FILE_PATH\" 2>/dev/null || true; elif [[ \"$CLAUDE_TOOL_FILE_PATH\" == *.rb ]]; then rubocop \"$CLAUDE_TOOL_FILE_PATH\" --auto-correct 2>/dev/null || true; fi"
        }
      ]
    }
  ]
}
```

**Environment variables used:**
- `$CLAUDE_TOOL_FILE_PATH` — the path of the file just written (set by Claude Code)

**Rationale:**
Ensures every file edit produces lint-clean code without requiring the agent to remember to run the linter. The `|| true` suffix prevents hook failure from blocking the agent if ESLint is not yet installed.

**Security implications:**
- Runs only on the specific file just written — no recursive scan
- `--fix` is safe; it only applies auto-fixable rules (formatting, unused imports)
- `2>/dev/null` suppresses noisy output; failures are silent but non-blocking

**Extension — adding a new language:**
To add TypeScript strict-mode checking, extend the condition chain:
```bash
elif [[ "$CLAUDE_TOOL_FILE_PATH" == *.ts || "$CLAUDE_TOOL_FILE_PATH" == *.tsx ]]; then
  npx tsc --noEmit --project tsconfig.json 2>/dev/null || true
fi
```

---

### Hook 2 — PreToolUse: Command Activity Logger

**Type:** `PreToolUse`
**Matcher:** `*` (all tools)
**Trigger condition:** Every tool use by Claude in this session.

**What it does:** Appends a structured log line to `~/.claude/command-log.txt` with the current timestamp, tool name, and file path.

**Configuration:**
```json
{
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
}
```

**Environment variables used:**
- `$CLAUDE_TOOL_NAME` — the name of the tool being invoked (e.g., `Edit`, `Bash`, `WebFetch`)
- `$CLAUDE_TOOL_FILE_PATH` — the file path argument (if applicable)

**Log file location:** `~/.claude/command-log.txt` (user home, not in the project)

**Sample log output:**
```
[Sat Mar 14 12:00:01 UTC 2026] Tool: Edit | File: app/src/components/SuburbLayer.tsx
[Sat Mar 14 12:00:05 UTC 2026] Tool: Bash | File:
[Sat Mar 14 12:00:08 UTC 2026] Tool: WebFetch | File:
```

**Rationale:**
- Provides an audit trail of all agent tool invocations
- Useful for debugging: if something unexpected changes, the log shows which tool touched it
- Complements the `doc-state` MCP server's distributed locking mechanism

**Security implications:**
- Log is written to `~/.claude/` (user home) — NOT committed to the repository
- File paths in the log may reveal project structure — do not share this log file externally
- No sensitive content (file contents, env vars) is logged — only tool name and path

**Rotation:** The log file is not automatically rotated. If it grows large, truncate manually:
```bash
> ~/.claude/command-log.txt   # empty the file
```

---

---

### Hook D1 — PreToolUse: Badge Lint Pre-Write

**ID:** D1
**Type:** `PreToolUse`
**Matcher:** `Write` on `*/src/components/*.tsx`
**Priority:** P0
**Script:** `.claude/hooks/badge-lint-prewrite.js`
**Trigger condition:** Any `Write` tool use targeting a `.tsx` file inside `src/components/`.

**What it does:**
- Reads the file at the path argument
- Detects data-fetching patterns: `fetch(`, `supabase.`, `useLiveData`, `useQuery`, `createClient`
- If a data-fetch pattern is found: checks for `SourceBadge` import OR inline `SOURCE.*YEAR.*(LIVE|CACHED|MOCK)` pattern
- If badge is missing: writes `⚠️ BADGE WARNING: <file> — data-fetch found but no SourceBadge. Rule 1 requires [SOURCE·YEAR·LIVE|CACHED|MOCK]. Invoke BADGE-AUDIT-AGENT.` to stderr
- Always `process.exit(0)` — non-blocking

**Configuration (in settings.local.json):**
```json
{
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
}
```

**Rationale:** Catches Rule 1 violations at write time rather than at audit time.
**Security:** Read-only on source files; no writes; stderr only.

---

### Hook D2 — PostToolUse: Fallback Verify Post-Write

**ID:** D2
**Type:** `PostToolUse`
**Matcher:** `Write` on `*/src/app/api/*.ts`
**Priority:** P0
**Script:** `.claude/hooks/fallback-verify-postwrite.js`
**Trigger condition:** Any `Write` tool use targeting an API route `.ts` file inside `src/app/api/`.

**What it does:**
- Reads the newly written file
- Checks for LIVE tier: external `fetch(` call or direct `supabase.from(` query
- Checks for CACHED tier: reference to `api_cache` table
- Checks for MOCK tier: reference to `public/mock/` path
- Missing tiers: outputs `⚠️ FALLBACK PARTIAL: <file> — missing CACHED tier` (or MOCK, or both) to stderr
- If all 3 tiers missing: outputs `⚠️ FALLBACK FAIL: <file> — no three-tier fallback. Rule 2 violation. Invoke FALLBACK-VERIFY-AGENT.`
- Always `process.exit(0)`

**Rationale:** Enforces CLAUDE.md Rule 2 immediately after each API route write.
**Security:** Read-only on just-written file; stderr only.

---

### Hook D3 — PreToolUse: MCP Health Pre-Check

**ID:** D3
**Type:** `PreToolUse`
**Matcher:** `Task` (all tasks)
**Priority:** P1
**Script:** `.claude/hooks/mcp-health-precheck.js`
**Trigger condition:** Every `Task` tool use (agent spawn or tool invocation).

**What it does:**
- Checks P0 MCP servers only: `filesystem`, `postgres`, `doc-state`
- Uses `fs.existsSync` on `mcp/doc-state/server.js` as a proxy health check (fast, < 100ms)
- If any P0 server path is missing: outputs `⚠️ MCP ESCALATE: doc-state server.js not found — P0 server may be unreachable. Run /mcp-status.` to stderr
- Always `process.exit(0)`, completes in < 500ms

**Rationale:** Alerts agents before spawning tasks when critical MCP infrastructure may be unavailable.
**Security:** Uses `fs.existsSync` only — no network calls; no reads of file contents.

---

### Hook D4 — PostToolUse: RLS Check Post-Migration

**ID:** D4
**Type:** `PostToolUse`
**Matcher:** `Write` on `*/supabase/migrations/*.sql`
**Priority:** P1
**Script:** `scripts/check-rls.sh` (existing — no new script needed)
**Trigger condition:** Any `Write` tool use targeting a `.sql` file in `supabase/migrations/`.

**What it does:**
- Invokes the existing `scripts/check-rls.sh "$CLAUDE_TOOL_INPUT_FILE_PATH"`
- That script parses the migration SQL and checks: `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, and a policy `USING (tenant_id = ...)` block
- Outputs `⚠️ RLS MISSING: <file> — migration adds table without RLS. Rule 4 violation.` if any are absent
- Delegates full check logic to the existing script (not duplicated here)

**Configuration:**
```bash
command: "bash scripts/check-rls.sh \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null || true"
```

**Rationale:** Automates Rule 4 RLS verification on every new migration write.
**Security:** Reads migration file only; no writes; delegates to validated existing script.

---

### Hook D5 — PostToolUse: File Size Guard

**ID:** D5
**Type:** `PostToolUse`
**Matcher:** `Write` on `*/src/*.ts` or `*/src/*.tsx`
**Priority:** P2
**Script:** `.claude/hooks/filesize-guard.js`
**Trigger condition:** Any `Write` tool use targeting a `.ts` or `.tsx` file inside `src/`.

**What it does:**
- Reads the file at the path argument and counts lines
- Skips files whose paths include: `migrations/`, `__tests__/`, `.test.`, `.spec.`, `.md`
- If line count > threshold (default 300): outputs `⚠️ RULE 7: <file> has N lines (max 300). Refactor into smaller modules.` to stderr
- Always `process.exit(0)`

**Rationale:** Enforces CLAUDE.md Rule 7 at write time; prevents accidental bloat.
**Security:** Read-only on source file; stderr only.

---

## Planned Hooks (Recommended for Implementation)

---

### Planned Hook 6 — PostToolUse: Doc Sync (INDEX.md Updater)

**Type:** `PostToolUse`
**Matcher:** `Write|Edit|MultiEdit` on `docs/**/*.md` or `.claude/**/*.md`
**Status:** 📋 PLANNED — not yet configured

**What it would do:**
- After any write to `docs/` or `.claude/`, run `scripts/sync-index.sh` to regenerate the affected `INDEX.md` and append to `docs/CHANGELOG_AUTO.md`
- If the `doc-state` MCP server is available: acquire write lock → update index → release lock → notify

**Proposed configuration:**
```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        {
          "type": "command",
          "command": "if [[ \"$CLAUDE_TOOL_FILE_PATH\" == */docs/* || \"$CLAUDE_TOOL_FILE_PATH\" == */.claude/* ]]; then python3 scripts/sync_doc_indexes.py \"$CLAUDE_TOOL_FILE_PATH\" 2>/dev/null || true; fi"
        }
      ]
    }
  ]
}
```

**Implementation note:** Uses existing `scripts/sync_doc_indexes.py`. The `scripts/sync-index.sh` shell wrapper does not yet exist — use the Python script directly. See `CLAUDE.md §8` Auto Documentation Maintenance Rules for the full specification.

---

### Planned Hook 7 — PostToolUse: POPIA Guard

**Type:** `PostToolUse`
**Matcher:** `Write|Edit` on `app/src/**/*.tsx`
**Status:** 📋 PLANNED — not yet configured

**What it would do:**
- After writing a TypeScript file, grep for personal data patterns (`email`, `name`, `address`, `id_number`)
- If found, check for POPIA annotation block
- If annotation missing, print a warning message (non-blocking)

**Rationale:** Enforces CLAUDE.md Rule 5 automatically without requiring the agent to remember to run `/audit-popia`.

---

## Git Pre-Commit Hooks (scripts/install-hooks.sh)

These hooks run at the git level (not Claude Code hooks) and are installed separately via `scripts/install-hooks.sh`.

### Pre-commit: No API Keys
Prevents committing files that contain hardcoded API keys, tokens, or secrets.

**Pattern checked:**
```bash
git diff --cached --diff-filter=ACM | grep -E "(api_key|secret|password|token)\s*=" | grep -v ".env.example"
```

**Trigger:** `git commit`
**Action:** Blocks commit if match found; instructs developer to move to `.env`

### Pre-commit: No .env Files
Prevents committing `.env` (only `.env.example` is allowed).

**Pattern checked:**
```bash
git diff --cached --name-only | grep -E "^\.env$"
```

**Trigger:** `git commit`
**Action:** Blocks commit immediately

### Pre-commit: File Size Check (Rule 7)
Warns (non-blocking) if any source file exceeds 300 lines.

**Pattern checked:**
```bash
for f in $(git diff --cached --name-only --diff-filter=ACM | grep -E "\.(ts|tsx|js|jsx|py)$"); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 300 ]; then
    echo "WARNING: $f has $lines lines (Rule 7: max 300)"
  fi
done
```

**Trigger:** `git commit`
**Action:** Warning only — does not block commit. Planning docs and migrations exempt.

---

## Hook Governance

### When a hook fails silently
All active hooks use `2>/dev/null || true` — they fail silently to avoid blocking the agent. To debug:
1. Run the command manually in the terminal
2. Remove `2>/dev/null || true` temporarily
3. Check `~/.claude/command-log.txt` for the tool invocation that triggered it

### Adding a new hook
1. Edit `.claude/settings.local.json` under `hooks`
2. Document it in this `HOOKS.md` with trigger, configuration, rationale, and security implications
3. Test by invoking the relevant tool and checking side effects
4. If hook modifies files: add to `.gitignore` or ensure it only writes to allowed paths
5. Do NOT modify `settings.json` for local hooks — use `settings.local.json`

### Hook permissions and sandbox
The sandbox in `settings.local.json` is configured with:
```json
"sandbox": {
  "enabled": true,
  "autoAllowBashIfSandboxed": true
}
```
This means Bash commands in hooks run within the sandbox allowed-path list. Hooks writing outside allowed paths will fail silently.

---

## Cross-References

- Hook configuration: `.claude/settings.local.json`
- Full infrastructure docs: `docs/infra/hooks-reference.md`
- Allowed domains for WebFetch: see [`SETTINGS.md` → permissions.allow → WebFetch domain allowlist](./SETTINGS.md)
- MCP server configuration: `.claude/settings.json` and `MCP_SERVERS.md`
- Git hooks install: `scripts/install-hooks.sh`
