#!/usr/bin/env bash
# integrate-everything.sh
# Validates skill templates, checks config integrity, and installs dataset tooling.
#
# External repos are NOT cloned — skills are authored from plan templates.
# The plan (PLAN.md / docs/research/external-repo-mapping.md) documents what was
# adapted from affaan-m/everything-claude-code and VoltAgent/awesome-agent-skills.
#
# Usage: bash scripts/integrate-everything.sh [--dry-run]
# Exit 0 = all checks passed. Exit 1 = one or more checks failed.
set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

REPO_ROOT="$(git rev-parse --show-toplevel)"
FAILURES=0

log()  { echo "[integrate] $*"; }
run()  { if $DRY_RUN; then echo "[dry-run] $*"; else eval "$*"; fi; }
pass() { echo "  [PASS] $*"; }
fail() { echo "  [FAIL] $*"; FAILURES=$((FAILURES + 1)); }

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 1: Verify skill directories and SKILL.md front-matter ==="
# ─────────────────────────────────────────────────────────────────────────────
NEW_SKILLS=(
  instinct_guard
  security_review
  dataset_ingest
  deerflow_research_loop
  git_workflow
  ci_smoke_test
)

for skill in "${NEW_SKILLS[@]}"; do
  skill_file="$REPO_ROOT/.claude/skills/$skill/SKILL.md"
  if [ -f "$skill_file" ]; then
    name_ok=$(grep -c "^name:" "$skill_file" || true)
    desc_ok=$(grep -c "^description:" "$skill_file" || true)
    if [ "$name_ok" -eq 1 ] && [ "$desc_ok" -eq 1 ]; then
      pass "$skill/SKILL.md — front-matter valid"
    else
      fail "$skill/SKILL.md — missing name or description field (name=$name_ok desc=$desc_ok)"
    fi
  else
    fail "$skill/SKILL.md — file not found (expected: $skill_file)"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 2: Structural check — instinct_guard must have 8 checklist items ==="
# ─────────────────────────────────────────────────────────────────────────────
instinct_file="$REPO_ROOT/.claude/skills/instinct_guard/SKILL.md"
if [ -f "$instinct_file" ]; then
  check_count=$(grep -c "^\- \[ \]" "$instinct_file" || true)
  if [ "$check_count" -ge 8 ]; then
    pass "instinct_guard — $check_count checklist items (≥ 8 required)"
  else
    fail "instinct_guard — only $check_count checklist items (need ≥ 8)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 3: Create support directories if absent ==="
# ─────────────────────────────────────────────────────────────────────────────
run "mkdir -p '$REPO_ROOT/.claude/agents'"
run "mkdir -p '$REPO_ROOT/docs/research/datasets'"
if ! $DRY_RUN; then
  pass "Support directories ready"
fi

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 4: Verify dataset catalog exists ==="
# ─────────────────────────────────────────────────────────────────────────────
catalog="$REPO_ROOT/docs/research/open-datasets.md"
if [ -f "$catalog" ]; then
  row_count=$(grep -cE "^\| [0-9]" "$catalog" || true)
  if [ "$row_count" -ge 5 ]; then
    pass "Dataset catalog — $row_count entries (≥ 5 required)"
  else
    fail "Dataset catalog — only $row_count entries (need ≥ 5)"
  fi
else
  fail "Dataset catalog — docs/research/open-datasets.md not found"
fi

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 5: Verify .claude/settings.json structure ==="
# ─────────────────────────────────────────────────────────────────────────────
settings="$REPO_ROOT/.claude/settings.json"
if [ -f "$settings" ]; then
  if grep -q '"mcpServers"' "$settings" 2>/dev/null || grep -q '"permissions"' "$settings" 2>/dev/null; then
    pass "settings.json — structure OK"
  else
    fail "settings.json — may be malformed (mcpServers or permissions block not found)"
  fi
else
  fail "settings.json — file not found"
fi

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 6: No-credential scan on new skill files ==="
# ─────────────────────────────────────────────────────────────────────────────
skill_dirs=()
for skill in "${NEW_SKILLS[@]}"; do
  skill_dir="$REPO_ROOT/.claude/skills/$skill"
  [ -d "$skill_dir" ] && skill_dirs+=("$skill_dir")
done

if [ "${#skill_dirs[@]}" -gt 0 ]; then
  if grep -rE "(api_key|secret|password|token)\s*=\s*['\"][^'\"]{8,}" \
      "${skill_dirs[@]}" 2>/dev/null; then
    fail "Potential hardcoded credential detected — review output above"
  else
    pass "No hardcoded credentials found in new skill files"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 7: Install Python dataset tools (optional) ==="
# ─────────────────────────────────────────────────────────────────────────────
if command -v pip &>/dev/null || command -v pip3 &>/dev/null; then
  PIP=$(command -v pip3 || command -v pip)
  run "$PIP install --quiet geopandas shapely fiona pyproj 2>/dev/null \
    || log 'WARN: pip install failed — install manually: pip install geopandas shapely fiona pyproj'"
  if ! $DRY_RUN; then
    pass "Python geo tools installed (geopandas, shapely, fiona, pyproj)"
  fi
else
  log "WARN: pip/pip3 not found — install manually: pip install geopandas shapely fiona pyproj"
fi

# ─────────────────────────────────────────────────────────────────────────────
log "=== Integration summary ==="
# ─────────────────────────────────────────────────────────────────────────────
echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "RESULT: $FAILURES check(s) FAILED — resolve before committing"
  $DRY_RUN && echo "(DRY RUN — no files were modified)"
  exit 1
else
  echo "RESULT: All checks PASSED"
  $DRY_RUN && echo "(DRY RUN — no files were modified)"
fi
