<\!--
trigger: /generate-tests [--component <path>] [--all-missing] [--ci-threshold <pct>]
primary_agent: TEST-COVERAGE-AGENT
-->

## Trigger
`/generate-tests [--component <path>] [--all-missing] [--ci-threshold <pct>]`

## Purpose
Generate Vitest test stubs for untested components. `--component <path>` scopes generation to
one file or directory. `--all-missing` scans all `src/components/` and `src/app/api/` for files
with no corresponding test file. `--ci-threshold <pct>` sets the coverage gate used to flag
files below target (default 60%).

## Primary Agent
**TEST-COVERAGE-AGENT 🧪** — invokes `repo_graph` and `test_stub_gen` skills.

## Steps

1. **Invoke `repo_graph` to list untested files** — compare every source file in
   `src/components/` and `src/app/api/` against existing test files in `src/__tests__/`.
   Flag files with no corresponding `*.test.ts` or `*.test.tsx` counterpart.

2. **Invoke `test_stub_gen` per file** — for each untested file, generate a Vitest stub with:
   `describe` block, one `it('// STUB', ...)` per exported function/component, and
   import of the module under test.

3. **Write stubs to `src/__tests__/`** — mirror the source directory structure.
   Each stub file must include the `// STUB` marker on the first line after imports
   so CI can detect unimplemented tests.

4. **Run coverage check** — invoke `/coverage-report` (or `npm run test -- --coverage` directly)
   to execute the full test suite with V8 coverage and capture per-file percentages.

5. **Output coverage table** — produce a markdown table: `File | Statements | Branches | Lines | Status`.

6. **Flag files below threshold** — mark any file with line coverage below `--ci-threshold`
   (default 60%) with `⚠️ BELOW THRESHOLD`. Do not fail the command; report only.

## MCP Servers Used
- `filesystem` — read source files, write test stubs
- `playwright` — scaffold e2e test stubs for page-level components when detected

## Success Criteria
- All generated stubs contain the `// STUB` marker
- Coverage report generated and written to `docs/coverage-report.md`
- No existing passing tests regress (exit code 0 from test runner)
- Files below `--ci-threshold` flagged in output

## Usage Example
```bash
# Generate stubs for all untested files with 60% coverage gate
/generate-tests --all-missing --ci-threshold 60

# Stub a single component
/generate-tests --component src/components/analysis/AnalyticsDashboard.tsx

# Scan with stricter threshold for pre-DoD check
/generate-tests --all-missing --ci-threshold 80
```
