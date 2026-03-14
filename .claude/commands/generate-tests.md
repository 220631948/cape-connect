<!--
trigger: /generate-tests [<path>] [--coverage-only] [--e2e]
primary_agent: TEST-COVERAGE-AGENT
-->

## Trigger
`/generate-tests [<path>] [--coverage-only] [--e2e]`

## Purpose
Generate Vitest unit test stubs and/or Playwright E2E test skeletons for components
and API routes that have zero or insufficient test coverage. Ensures every new
feature scaffolded by FEATURE-BUILDER receives a corresponding test stub before
the milestone DoD is signed off.

## Primary Agent
**TEST-COVERAGE-AGENT 📊** — invokes `test_stub_gen` and `ci_smoke_test` skills.

## Steps

1. **Coverage baseline** — run `/coverage-report` to identify zero-coverage files.
   If `<path>` is provided, target that specific file or directory instead.

2. **Unit test stub generation** — for each zero-coverage component,
   invoke `test_stub_gen` skill:
   - Generate Vitest stub with `vi.mock('maplibre-gl')` and `vi.mock('@supabase/supabase-js')`
   - Include placeholder test cases for: render (smoke), badge presence (Rule 1),
     fallback rendering (Rule 2), POPIA field assertions if applicable
   - Mark stub: `// STUB — complete this test`

3. **API route test skeleton** — for each zero-coverage API route in `app/src/app/api/`:
   - Generate Playwright API test with: `GET /api/route` returns 200,
     LIVE→MOCK fallback assertion, tenant isolation assertion

4. **E2E skeleton** — if `--e2e` flag:
   - Generate Playwright user-flow test for the component's primary interaction
   - Include: navigate to page, interact with component, assert expected state
   - Add data badge visibility assertion (Rule 1)

5. **Write stubs** alongside source files in `__tests__/` directory or
   `*.test.ts` pattern. Mark all generated stubs with `// STUB — complete`.

6. **Syntax validation** — invoke `ci_smoke_test` skill to verify stubs
   parse correctly and are discoverable by Vitest runner.

7. **Coverage delta estimate** — report: "Adding N stubs will increase coverage
   from X% to ~Y% (stubs only — real coverage requires implementation)."

## MCP Servers Used
- `filesystem` — read source files, write test stubs
- `playwright` — E2E skeleton generation (if `--e2e` flag)

## Success Criteria
- Stubs generated for all zero-coverage files in scope
- All stubs pass TypeScript syntax check
- Stubs include `// STUB` marker for developer tracking
- Coverage delta estimated
- No existing tests overwritten

## Usage Example
```bash
# Generate stubs for all zero-coverage files
/generate-tests

# Generate stubs for a specific component
/generate-tests app/src/components/AnalyticsDashboard.tsx

# Generate stubs + E2E skeletons
/generate-tests --e2e

# Just show coverage report without generating
/generate-tests --coverage-only
```
