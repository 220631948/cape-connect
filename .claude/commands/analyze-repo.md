<\!--
trigger: /analyze-repo [--update-arch] [--module <path>]
primary_agent: REPO-ARCHITECT
-->

## Trigger
`/analyze-repo [--update-arch] [--module <path>]`

## Purpose
Run a full repository intelligence analysis — stack detection, module graph, and architecture
summary. With `--update-arch` rewrites `.claude/ARCHITECTURE.md` with the latest findings.
With `--module <path>` scopes the analysis to a specific directory instead of the entire repo.

## Primary Agent
**REPO-ARCHITECT 🏗️** — invokes `stack_detect`, `repo_graph`, and `code_summarize` skills.

## Steps

1. **Invoke `stack_detect`** — identify frameworks, runtime versions, package manager, and
   dependency graph from `package.json`, `docker-compose.yml`, and `tsconfig.json`.

2. **Invoke `repo_graph`** — map inter-module imports and produce a dependency adjacency list.
   If `--module <path>` provided, scope graph to that directory and its direct dependents.

3. **Invoke `code_summarize` on target modules** — if `--module <path>`, summarise only files in
   that directory. Otherwise summarise all modules changed since the last architecture snapshot
   (compared against `.claude/ARCHITECTURE.md` timestamp).

4. **Write architecture summary** — output module-level summaries to `docs/architecture/`
   as `<module-name>-summary.md` files. Include stack table, dependency graph, and tech debt
   flags.

5. **Optionally rewrite `.claude/ARCHITECTURE.md`** — if `--update-arch` flag is set, replace
   the AI brain map sections (stack, module inventory, agent routing table) with current data.
   Never modify narrative or rule sections authored by humans.

## MCP Servers Used
- `filesystem` — read source files, write architecture summaries, update ARCHITECTURE.md
- `context7` — resolve library version docs for stack_detect validation

## Success Criteria
- `docs/architecture/` contains at least one new or updated summary file
- `.claude/ARCHITECTURE.md` updated (if `--update-arch`) with current timestamp
- No files under `src/` modified
- Module graph written to `docs/architecture/module-graph.md`

## Usage Example
```bash
# Full repo analysis before M17 kickoff
/analyze-repo --update-arch

# Scope analysis to analytics module only
/analyze-repo --module src/components/analysis/

# Graph only — no ARCHITECTURE.md rewrite
/analyze-repo --module src/lib/
```
