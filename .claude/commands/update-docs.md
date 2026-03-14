<\!--
trigger: /update-docs [--module <path>] [--all] [--registry]
primary_agent: WORKFLOW-AUTOMATOR
-->

## Trigger
`/update-docs [--module <path>] [--all] [--registry]`

## Purpose
Regenerate documentation for changed modules. `--module <path>` scopes the update to one
directory. `--all` runs `code_summarize` across the entire `src/` tree. `--registry` recounts
agents, skills, and commands on the filesystem and updates the total-count headers in
`AGENTS.md`, `SKILLS.md`, and `COMMANDS.md` to match reality.

## Primary Agent
**WORKFLOW-AUTOMATOR ⚙️** — invokes `code_summarize` skill and `scripts/sync_doc_indexes.py`.

## Steps

1. **Invoke `code_summarize` on target scope** — if `--module <path>`, summarise only that
   directory. If `--all`, summarise all files under `src/`. If neither flag provided, summarise
   only files modified since the last `docs/architecture/` write (compare git diff).

2. **Write summaries to `docs/architecture/`** — one markdown file per module:
   `<module-name>-summary.md`. Include: exports list, dependencies, line count, and last-
   modified timestamp.

3. **If `--registry`: recount and update totals** — count actual `.md` files in:
   - `.claude/agents/` → update "Total agents:" in `.claude/AGENTS.md`
   - `.claude/skills/` → update "Total skills:" in `.claude/SKILLS.md`
   - `.claude/commands/` → update "Total commands:" in `.claude/COMMANDS.md`
   Use surgical string replacement within the header line only.

4. **Run `scripts/sync_doc_indexes.py`** — regenerate `docs/INDEX.md` auto-section and
   append entry to `docs/CHANGELOG_AUTO.md`. If the script is absent, skip and note in output.

5. **Confirm `INDEX.md` updated** — read `docs/INDEX.md` and verify the auto-section reflects
   newly written summary files. Output a diff summary of changed index entries.

## MCP Servers Used
- `filesystem` — read source files, write summaries, update registry headers
- `doc-state` — acquire write lock before updating AGENTS.md / SKILLS.md / COMMANDS.md

## Success Criteria
- `docs/architecture/` contains updated summary files for all targeted modules
- If `--registry`: count headers in AGENTS.md, SKILLS.md, COMMANDS.md reflect actual file counts
- `docs/INDEX.md` auto-section updated
- `docs/CHANGELOG_AUTO.md` entry appended

## Usage Example
```bash
# Update docs for the analytics module and sync registry counts
/update-docs --module src/components/analysis/ --registry

# Full doc regeneration across entire src/
/update-docs --all

# Registry sync only (no summarisation)
/update-docs --registry
```
