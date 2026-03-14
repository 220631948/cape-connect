<\!--
trigger: /refactor-module <file-path> [--dry-run] [--max-lines <n>]
primary_agent: REFACTOR-SPECIALIST
-->

## Trigger
`/refactor-module <file-path> [--dry-run] [--max-lines <n>]`

## Purpose
Safely split an oversized file into smaller, focused modules to comply with CLAUDE.md Rule 7
(source files ≤ 300 lines). `--dry-run` produces the split plan and impact report without
writing any files. `--max-lines <n>` overrides the 300-line default limit for the output
modules.

## Primary Agent
**REFACTOR-SPECIALIST ✂️** — invokes `refactor_plan` skill.

## Steps

1. **Read file and count lines** — read `<file-path>`, count total lines, list all exported
   identifiers (functions, components, types, constants). Confirm file exceeds `--max-lines`
   (default 300). Abort with explanation if file is already within limit.

2. **Invoke `refactor_plan`** — analyse exports and internal dependencies to propose a split:
   group related identifiers into logical sub-modules, suggest output file paths, and estimate
   line counts for each output file.

3. **Execute split (if not `--dry-run`)** — write each new module file. Preserve all JSDoc
   comments, POPIA annotations, and `// STUB` markers. Add `// Extracted from <original-file>`
   header comment to each new file.

4. **Update all importers** — invoke `repo_graph` to find every file that imports from
   `<file-path>`. Update each importer's import paths to reference the correct new sub-module.

5. **Run `npm run lint` and `npm run test`** — confirm no lint errors introduced and all
   existing tests pass. Report exit codes.

6. **Confirm all output files ≤ max-lines** — count lines in each new file. Flag any output
   file that still exceeds `--max-lines` and suggest a further split.

## MCP Servers Used
- `filesystem` — read original file, write new module files, update importers

## Success Criteria
- All output files ≤ 300 lines (or `--max-lines` override)
- `npm run test` exits 0 (no regressions)
- `npm run lint` exits 0 (lint clean)
- All import paths in dependent files updated; original replaced with a re-export barrel

## Usage Example
```bash
# Dry-run — see the plan without writing files
/refactor-module src/components/analysis/AnalyticsDashboard.tsx --dry-run

# Execute split with default 300-line limit
/refactor-module src/components/analysis/AnalyticsDashboard.tsx

# Split with a stricter 200-line output limit
/refactor-module src/lib/geoUtils.ts --max-lines 200
```
