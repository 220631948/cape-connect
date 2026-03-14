<\!--
trigger: /explain-architecture [--module <path>] [--data-flow] [--agents]
primary_agent: REPO-ARCHITECT
-->

## Trigger
`/explain-architecture [--module <path>] [--data-flow] [--agents]`

## Purpose
Produce a plain-English explanation of how the repository or a specific module is structured.
`--data-flow` explains the three-tier LIVE→CACHED→MOCK fallback chain with real route examples.
`--agents` explains which ARIS agent owns which module and why. Designed for onboarding new
developers or diagnosing unfamiliar code areas quickly.

## Primary Agent
**REPO-ARCHITECT 🏗️** — invokes `code_summarize` skill; reads ARCHITECTURE.md and AGENTS.md.

## Steps

1. **Read `.claude/ARCHITECTURE.md`** — extract the current stack table, module inventory, and
   agent routing table. Use this as the ground truth for all explanations in this session.

2. **If `--module <path>`: invoke `code_summarize` on that path** — generate a module-specific
   summary: exports, dependencies, file count, line count, and primary responsibilities.
   Cross-reference against the agent routing table to identify the owning agent.

3. **If `--data-flow`: explain three-tier fallback with route examples** — walk through the
   LIVE→CACHED→MOCK chain as implemented in the project:
   - LIVE: external API call (e.g., OpenSky, City of Cape Town WFS)
   - CACHED: `api_cache` Supabase table lookup with TTL check
   - MOCK: `public/mock/*.geojson` static file fallback
   Include at least two real route examples from `src/app/api/`.

4. **If `--agents`: read AGENTS.md and map ownership** — for each agent defined in
   `.claude/AGENTS.md`, list: agent name, owned modules/paths, primary skills, and trigger
   conditions. Format as a table for readability.

## MCP Servers Used
- `filesystem` — read ARCHITECTURE.md, AGENTS.md, and source module files
- `context7` — resolve library documentation references cited in explanations

## Success Criteria
- Plain-English explanation written to chat (never written to files)
- All file paths referenced are real paths that exist in the repository
- No source files modified
- Explanation is ≤ 600 words unless `--module` scope warrants more detail

## Usage Example
```bash
# Explain data flow — ideal for onboarding a new developer
/explain-architecture --data-flow

# Explain a specific module
/explain-architecture --module src/components/analysis/

# Show agent ownership map
/explain-architecture --agents

# Full overview for a new contributor
/explain-architecture --data-flow --agents
```