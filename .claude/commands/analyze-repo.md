<!--
trigger: /analyze-repo [--full] [--deps] [--architecture]
primary_agent: REPO-ARCHITECT
-->

## Trigger
`/analyze-repo [--full] [--deps] [--architecture]`

## Purpose
Full repository intelligence scan — detects tech stack, maps the module dependency
graph, audits dependencies for CVEs and unapproved packages, checks Rule 7 file size
compliance, and optionally regenerates `.claude/ARCHITECTURE.md`. The primary ARIS
health command — run at the start of any new milestone or ARIS self-evolution pass.

## Primary Agent
**REPO-ARCHITECT 🏗️** — coordinates sub-skills and writes consolidated report.

## Steps

1. **Stack detection** — invoke `stack_detect` skill:
   - Read `package.json`, `tsconfig.json`, `docker-compose.yml`
   - Cross-reference against CLAUDE.md §2 approved list
   - Flag any unapproved direct dependencies

2. **Module graph** — invoke `repo_graph` skill:
   - Traverse `app/src/` for all `.ts`/`.tsx` files
   - Map component → hook → utility dependency chains
   - List all API routes with HTTP methods
   - Detect circular imports and orphaned components
   - List `supabase/migrations/` timeline

3. **Dependency audit** — invoke `dependency_analysis` skill (if `--deps` or `--full`):
   - Run `npm outdated --json`
   - Run `npm audit --json`
   - Produce CRITICAL/HIGH/MEDIUM/LOW risk table

4. **Rule 7 check** — scan for files > 300 lines:
   ```bash
   find app/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
   ```
   Flag any file exceeding 300 lines as a Rule 7 violation.

5. **ARCHITECTURE.md update** — if `--architecture` flag:
   - Update agent/skill/command counts in `.claude/ARCHITECTURE.md`
   - Invoke `code_summarize` on changed modules since last update

6. **Write consolidated report** to `docs/architecture/REPO_INTELLIGENCE_REPORT.md`
   with timestamp and diffs from previous report.

## MCP Servers Used
- `filesystem` — read all project files, write report
- `doc-state` — write lock for ARCHITECTURE.md update (if available)

## Success Criteria
- Tech-stack report produced with APPROVED/UNAPPROVED status per package
- Module graph generated with API routes, hooks, component deps enumerated
- Dependency risk table complete (CRITICAL/HIGH/MEDIUM/LOW counts)
- Rule 7 violations listed (or "None detected ✅")
- `docs/architecture/REPO_INTELLIGENCE_REPORT.md` written with timestamp

## Usage Example
```bash
# Standard repo health scan
/analyze-repo

# Full scan with dependency audit
/analyze-repo --full

# Regenerate ARCHITECTURE.md with updated counts
/analyze-repo --architecture

# All checks
/analyze-repo --full --architecture
```
