<\!--
trigger: /debug-issue "<error message or description>" [--file <path>] [--ci-run <url>]
primary_agent: BUG-INVESTIGATOR
-->

## Trigger
`/debug-issue "<error message or description>" [--file <path>] [--ci-run <url>]`

## Purpose
Investigate a reported bug or error. Accepts a quoted error message or plain-language
description, an optional file path to scope the search, or a CI run URL to pull logs from.
Produces a root-cause hypothesis and hands off the fix to the appropriate domain agent with a
written brief.

## Primary Agent
**BUG-INVESTIGATOR 🔍** — invokes `debug_trace` and `repo_graph` skills.

## Steps

1. **Invoke `debug_trace` with error input** — parse the error message for stack trace lines,
   module names, and error type. If `--ci-run <url>` provided, fetch CI logs and extract the
   first failure. If `--file <path>` provided, prioritise that file in trace analysis.

2. **Invoke `repo_graph` to map affected modules** — starting from the file identified in the
   stack trace, traverse the import graph one level up and one level down to identify all
   modules that could contribute to or be affected by the error.

3. **Formulate hypothesis** — produce a written root-cause hypothesis in the format:
   `HYPOTHESIS: <one sentence> | FILE: <path>:<line> | EVIDENCE: <stack/log excerpt>`
   Include alternative hypotheses if confidence < 80%.

4. **Identify correct fix agent** — match the affected module path against agent ownership
   defined in `.claude/AGENTS.md`. Output: `FIX AGENT: <agent-name> | SCOPE: <files>`.

5. **Hand off with written brief** — write a structured brief to `docs/debug/<ISO-8601-timestamp>-brief.md`
   (e.g. `docs/debug/2026-03-14T1530-brief.md`): error input, affected modules, hypothesis,
   recommended fix approach, and assigned agent.

## MCP Servers Used
- `filesystem` — read source files, write debug brief to docs/debug/
- `context7` — resolve library docs for error types from third-party packages

## Success Criteria
- Hypothesis written with `FILE: <path>:<line>` reference and evidence excerpt
- Domain agent identified and named
- Brief written to `docs/debug/<ISO-8601-timestamp>-brief.md`
- No source files modified during investigation

## Usage Example
```bash
# Investigate a runtime TypeError
/debug-issue "TypeError: Cannot read properties of undefined (reading 'features')" \
  --file src/components/analysis/AnalyticsDashboard.tsx

# Investigate from a CI run
/debug-issue "Build failed in GitHub Actions" --ci-run https://github.com/org/repo/actions/runs/123

# Plain-language description
/debug-issue "Map doesn't load on mobile after login"
```
