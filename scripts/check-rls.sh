#!/usr/bin/env bash
# check-rls.sh — Warn if CREATE TABLE in staged migrations lacks ENABLE ROW LEVEL SECURITY
# Usage: bash scripts/check-rls.sh   (checks staged .sql files)
#        bash scripts/check-rls.sh path/to/migration.sql  (checks specific file)
set -euo pipefail

FAIL=0; CHECKED=0

check_migration() {
  local file="$1"
  local content
  content=$(cat "$file" 2>/dev/null) || { echo "  ✗ Cannot read $file" >&2; return 1; }

  # Only care about files that CREATE a TABLE
  if ! echo "$content" | grep -iqE 'CREATE[[:space:]]+(TABLE|TABLE IF NOT EXISTS)'; then
    return 0
  fi

  CHECKED=$((CHECKED+1))
  local missing=0

  if ! echo "$content" | grep -iq 'ENABLE ROW LEVEL SECURITY'; then
    echo "  ✗ $(basename "$file") — CREATE TABLE found but ENABLE ROW LEVEL SECURITY missing (CLAUDE.md Rule 4)" >&2
    missing=$((missing+1))
  fi

  if ! echo "$content" | grep -iq 'FORCE ROW LEVEL SECURITY'; then
    echo "  ✗ $(basename "$file") — CREATE TABLE found but FORCE ROW LEVEL SECURITY missing (CLAUDE.md Rule 4)" >&2
    missing=$((missing+1))
  fi

  if ! echo "$content" | grep -iq 'tenant_isolation\|CREATE POLICY'; then
    echo "  ✗ $(basename "$file") — CREATE TABLE found but no tenant_isolation policy or CREATE POLICY (CLAUDE.md Rule 4)" >&2
    missing=$((missing+1))
  fi

  if [ "$missing" -gt 0 ]; then
    return 1
  fi

  echo "  ✓ $(basename "$file") — RLS + tenant policy present"
  return 0
}

if [ $# -ge 1 ]; then
  # Direct file mode
  for f in "$@"; do
    check_migration "$f" || FAIL=$((FAIL+1))
  done
else
  # Staged files mode (for pre-commit use)
  while IFS= read -r f; do
    case "$f" in *.sql) ;; *) continue ;; esac
    TMP=$(mktemp)
    git show ":$f" > "$TMP" 2>/dev/null
    check_migration "$TMP" || FAIL=$((FAIL+1))
    rm -f "$TMP"
  done < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)
fi

[ "$CHECKED" -eq 0 ] && echo "  ℹ No migration files with CREATE TABLE to validate." && exit 0

if [ "$FAIL" -gt 0 ]; then
  echo "  ✗ RLS check failed for $FAIL migration(s)." >&2
  exit 1
fi
echo "  ✓ All $CHECKED migration(s) have RLS + tenant isolation."
