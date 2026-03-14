<!--
trigger: /refactor-module <file-path> [--extract <name>] [--dry-run]
primary_agent: REFACTOR-SPECIALIST
-->

## Trigger
`/refactor-module <file-path> [--extract <name>] [--dry-run]`

## Purpose
Plan and execute a module refactoring to resolve Rule 7 violations (files > 300 lines)
or extract duplicated logic. Always produces a `refactor_plan` for human approval
before executing any code changes. The `--dry-run` flag shows the plan only without
making changes.

## Primary Agent
**REFACTOR-SPECIALIST 🔧** — invokes `refactor_plan`, `repo_graph`, and `test_stub_gen` skills.

## Steps

1. **Validate target:**
   - Read target file and count lines
   - Confirm Rule 7 violation (> 300 lines) or document reason for refactor
   - If `--extract <name>` provided: focus plan on extracting that named concept

2. **Generate refactor plan** — invoke `refactor_plan` skill:
   - Identify cohesive blocks grouped by responsibility
   - Assign proposed module names (hook, component, utility, types convention)
   - List line ranges for each extraction
   - Identify shared dependencies needing barrel export
   - Output numbered proposal for review

3. **APPROVAL GATE:** present plan and await explicit "yes" before proceeding.
   If `--dry-run` flag: output plan and stop here.

4. **Check downstream consumers** — invoke `repo_graph`:
   - List all files that import the target module
   - Confirm renaming/moving will not break consumers
   - Flag any consumers that need import path updates

5. **Execute extraction:**
   - Create new files for each proposed module
   - Update imports in the original file
   - Create barrel `index.ts` if multiple modules extracted
   - Verify all refactored files are ≤ 300 lines (Rule 7)

6. **Generate test stubs** — invoke `test_stub_gen` for each newly created module.
   Mark stubs with `// STUB — complete`.

7. **Post-refactor verification:**
   - Confirm no circular imports (`repo_graph` re-run)
   - Confirm all files ≤ 300 lines
   - Report: `Before: N lines → After: [file1: N lines, file2: N lines, ...]`

## MCP Servers Used
- `filesystem` — read source files, create extracted modules
- `doc-state` — write lock for multi-file atomic operation (if available)

## Success Criteria
- `refactor_plan` approved before execution
- All refactored files ≤ 300 lines (Rule 7 resolved)
- No breaking changes to public API (props/return types unchanged)
- `repo_graph` confirms no new circular dependencies
- Test stubs generated for all new modules
- Barrel `index.ts` created if applicable

## Usage Example
```bash
# Standard refactor with plan + approval
/refactor-module app/src/components/MapView.tsx

# Plan only — no changes made
/refactor-module app/src/components/MapView.tsx --dry-run

# Focus on extracting a specific concept
/refactor-module app/src/components/MapView.tsx --extract LayerManager

# Refactor a hook file
/refactor-module app/src/hooks/useAnalytics.ts --dry-run
```
