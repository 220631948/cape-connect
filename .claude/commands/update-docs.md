<!--
trigger: /update-docs [<path>] [--all] [--architecture] [--changelog]
primary_agent: WORKFLOW-AUTOMATOR
-->

## Trigger
`/update-docs [<path>] [--all] [--architecture] [--changelog]`

## Purpose
Update project documentation to reflect the current codebase state. Regenerates
ARCHITECTURE.md agent/skill/command counts, updates docs/INDEX.md (auto-section only),
appends to CHANGELOG_AUTO.md, and produces plain-English module summaries using
`code_summarize`. Respects `BEGIN/END AUTO` and `BEGIN/END HUMAN` markers — never
overwrites human-authored content.

## Primary Agent
**WORKFLOW-AUTOMATOR ⚙️** — invokes `code_summarize` and `docs_traceability_gate` skills.

## Steps

1. **Determine scope:**
   - If `<path>` provided: summarise that specific file or directory
   - If `--all` flag: summarise all of `app/src/` (by subdirectory to manage size)
   - If neither: summarise recently modified files (git diff --name-only HEAD~5)

2. **Module summarisation** — invoke `code_summarize` skill on target scope:
   - Produce 2–4 sentence summary per module
   - Include: purpose, exports, CLAUDE.md rule compliance badges
   - Flag any Rule violations (missing badge, missing fallback, missing POPIA)

3. **ARCHITECTURE.md update** — if `--architecture` flag:
   - Count current agents in `.claude/agents/` directory
   - Count current skills in `.claude/skills/` directory
   - Count current commands in `.claude/commands/` directory
   - Update header counts in `.claude/ARCHITECTURE.md`
   - Update agent list in Agent Ecosystem Map section

4. **INDEX.md regeneration** — update `docs/INDEX.md` auto-section only
   (within `<!-- BEGIN AUTO -->` and `<!-- END AUTO -->` markers):
   - List all files in `docs/` with brief description
   - Never touch `<!-- BEGIN HUMAN -->` / `<!-- END HUMAN -->` sections

5. **Changelog append** — if `--changelog` flag:
   - Append entry to `docs/CHANGELOG_AUTO.md` with timestamp:
     `[2026-03-14] docs(auto): /update-docs run — [N] modules summarised [workflow-automator]`

6. **Quality gate** — invoke `docs_traceability_gate` skill:
   - Verify all cross-references in updated docs point to existing files
   - Check evidence tags in research docs
   - Confirm auto-section markers are intact

## MCP Servers Used
- `filesystem` — read source files, write documentation updates
- `doc-state` — write lock for ARCHITECTURE.md and INDEX.md (if available)

## Success Criteria
- Module summaries produced with rule compliance badges
- ARCHITECTURE.md agent/skill/command counts accurate (if --architecture)
- INDEX.md auto-section updated without touching human sections
- CHANGELOG_AUTO.md appended (if --changelog)
- `docs_traceability_gate` passes — no broken cross-references
- No `<!-- BEGIN HUMAN -->` content modified

## Usage Example
```bash
# Update docs for a specific component
/update-docs app/src/components/AnalyticsDashboard.tsx

# Full codebase documentation update
/update-docs --all

# Regenerate ARCHITECTURE.md counts
/update-docs --architecture

# Full update with changelog
/update-docs --all --architecture --changelog
```
