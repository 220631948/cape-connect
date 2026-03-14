---
name: ci-smoke-test
description: Run a minimal smoke test of a named Claude Code skill to verify it is discoverable and returns expected output structure. Use before merging new skills. Adapted from VoltAgent/awesome-agent-skills test-runner pattern.
---

# CI Smoke Test

## Purpose
Verify a new SKILL.md is well-formed and its documented procedure is executable
without real external dependencies. Runs as part of the `claude-integrate.yml` CI workflow.

## Trigger
Invoke when:
- A new SKILL.md is created in `.claude/skills/`
- An existing skill is modified
- CI pipeline `claude-integrate.yml` `validate-skills` job runs

## Procedure

### Step 1 — Validate SKILL.md Structure
```bash
skill_dir=".claude/skills/<skill_name>"
skill_file="$skill_dir/SKILL.md"

# Check required front-matter fields
name_count=$(grep -c "^name:" "$skill_file")
desc_count=$(grep -c "^description:" "$skill_file")

echo "name fields: $name_count (expected: 1)"
echo "description fields: $desc_count (expected: 1)"

[ "$name_count" -eq 1 ] && [ "$desc_count" -eq 1 ] && echo "PASS" || echo "FAIL"
```

### Step 2 — Skill-Specific Structural Checks

| Skill | Structural check | Expected value |
|-------|-----------------|----------------|
| `instinct_guard` | `grep -c "^\- \[ \]"` | 8 |
| `security_review` | `grep -c "^\- \[ \]"` | ≥ 10 |
| `dataset_ingest` | Contains "Step 1" through "Step 8" | 8 steps present |
| `deerflow_research_loop` | Contains "Step 1" through "Step 6" | 6 steps present |
| `git_workflow` | Contains "Branch Convention" and "Commit Message Format" | both present |
| `ci_smoke_test` | Contains "Step 1" through "Step 3" | 3 steps present |

```bash
# Example for instinct_guard:
check_count=$(grep -c "^\- \[ \]" .claude/skills/instinct_guard/SKILL.md)
[ "$check_count" -ge 8 ] && echo "PASS ($check_count items)" || echo "FAIL (found $check_count, need 8)"
```

### Step 3 — No-Credential Scan
```bash
# Verify no hardcoded secrets in new skill files
if grep -rE "(api_key|secret|password|token)\s*=\s*['\"][^'\"]{8,}" \
    .claude/skills/instinct_guard \
    .claude/skills/security_review \
    .claude/skills/dataset_ingest \
    .claude/skills/deerflow_research_loop \
    .claude/skills/git_workflow \
    .claude/skills/ci_smoke_test 2>/dev/null; then
  echo "FAIL: Potential hardcoded credential detected"
else
  echo "PASS: No hardcoded credentials found"
fi
```

### Step 4 — Dry-Run Invocation (optional, manual)
Ask Claude Code to execute the skill against a known-good fixture:
- `instinct_guard`: provide dummy file path → expect 8 checks listed
- `security_review`: use `src/app/api/zoning/route.ts` as target
- `dataset_ingest`: use `public/mock/zoning.geojson` as fixture
- `deerflow_research_loop`: 1-track mini-research on "Is RLS enabled on api_cache?"
- `git_workflow`: describe the correct branch name for an M7 feature branch
- `ci_smoke_test`: self-referential test of this skill's structure

## Output Format
```
Smoke test: <skill_name>
  SKILL.md exists:                ✓ / ✗
  Front-matter name field:        ✓ / ✗
  Front-matter description field: ✓ / ✗
  Structural check:               ✓ <detail> / ✗ <detail>
  No-credential scan:             ✓ / ✗

Result: PASS / FAIL
```

## CI Integration
This skill's structural checks are automated in `.github/workflows/claude-integrate.yml`
under the `validate-skills` job. The dry-run invocation (Step 4) is manual only.
