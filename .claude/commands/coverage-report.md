<!--
/coverage-report — Test Coverage Analysis
Priority: P2
Primary Agent: TEST-COVERAGE-AGENT
Skill: test_stub_gen
-->

## Trigger
`/coverage-report [--component <path>] [--generate-stubs]`

## Purpose
Generate a Vitest test coverage report. Identify components with zero coverage.
Optionally generate Vitest stubs for uncovered components.

## Primary Agent
**TEST-COVERAGE-AGENT 📊** — invokes `test_stub_gen` skill.

## Steps

1. **Run Vitest with coverage** (v8 provider):
   ```bash
   npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=text
   ```
   Extract per-component coverage: lines, branches, functions, statements.

2. **Identify zero-coverage components:**
   - Filter `src/components/**/*.tsx` with 0% line coverage
   - Exclude: `src/test/`, `src/__tests__/`, index barrel files

3. **Output coverage table:**
   ```
   COMPONENT | LINES | BRANCHES | FUNCTIONS | STATUS
   ```

4. **If `--generate-stubs` flag:**
   For each zero-coverage component:
   - Invoke `test_stub_gen` skill
   - Generate stub at `src/__tests__/<ComponentName>.test.tsx`
   - Report: "Stub created: <path>"

5. **If `--component <path>`:** Limit report to that component subtree.

6. **Coverage thresholds:**
   - < 40% → ❌ CRITICAL — block merge
   - 40–60% → ⚠️ WARNING — log for improvement
   - > 60% → ✅ PASS

## MCP Servers Used
- `filesystem` — read source + test files, write coverage report

## Success Criteria
- Coverage report generated for all `src/components/`
- Zero-coverage components identified
- Stubs generated if `--generate-stubs` provided
- Coverage threshold status reported

## Usage Example
```bash
/coverage-report
/coverage-report --generate-stubs
/coverage-report --component src/components/analysis
```
