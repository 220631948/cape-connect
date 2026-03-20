#!/usr/bin/env bash
# install-hooks.sh — Install git hooks for CapeTown GIS Hub
# Usage: bash scripts/install-hooks.sh
set -euo pipefail

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRE_COMMIT="$HOOKS_DIR/pre-commit"
POST_COMMIT="$HOOKS_DIR/post-commit"

echo "[capegis] Installing hooks → $PRE_COMMIT and $POST_COMMIT"

cat > "$PRE_COMMIT" << 'HOOK'
#!/usr/bin/env bash
# CapeTown GIS Hub — pre-commit hook
# Syncs monitored doc indexes, then runs safety checks.
set -euo pipefail

PASS=0
FAIL=0

staged_files() { git diff --cached --name-only --diff-filter=ACM; }
staged_content() { git show ":$1" 2>/dev/null; }

echo "[pre-commit] Checking staged files..."

SCRIPT_DIR_HOOK="$(git rev-parse --show-toplevel)/scripts"
if [ -f "$SCRIPT_DIR_HOOK/sync_doc_indexes.py" ]; then
  mapfile -t MONITORED_FILES < <(staged_files | grep -E '^(docs|\.claude|\.gemini|\.github)/' || true)
  if [ "${#MONITORED_FILES[@]}" -gt 0 ]; then
    echo "  → Auto-syncing monitored documentation indexes..."
    DOC_SYNC_CMD=(python3 "$SCRIPT_DIR_HOOK/sync_doc_indexes.py")
    for f in "${MONITORED_FILES[@]}"; do
      DOC_SYNC_CMD+=(--changed "$f")
    done
    "${DOC_SYNC_CMD[@]}" || FAIL=$((FAIL+1))
    git add docs/INDEX.md .claude/INDEX.md .gemini/INDEX.md .github/INDEX.md docs/CHANGELOG_AUTO.md 2>/dev/null || true
  fi
fi

# 1. High-entropy / secret scan (base64-like 20+ char strings in non-test source)
echo "  → Secret scan..."
while IFS= read -r f; do
  case "$f" in *.ts|*.tsx|*.js|*.mjs|*.env*) ;;
    *) continue ;; esac
  if staged_content "$f" | grep -qE '(eyJ[A-Za-z0-9_-]{20,}\.|sk-[A-Za-z0-9]{32,}|service_role[[:space:]]*=[[:space:]]*ey)'; then
    echo "  ✗ Potential secret in: $f" >&2
    FAIL=$((FAIL+1))
  fi
done < <(staged_files)

# 2. Block .env files with non-placeholder real values
while IFS= read -r f; do
  case "$f" in .env|.env.*) ;; *) continue ;; esac
  if staged_content "$f" | grep -vE '^(#|[A-Z_]+=your_|[A-Z_]+=<|[A-Z_]+=$|[[:space:]]*$)' | grep -qE '[A-Z_]+=[^[:space:]]{8,}'; then
    echo "  ✗ .env file '$f' appears to contain real (non-placeholder) values — do not commit secrets." >&2
    FAIL=$((FAIL+1))
  fi
done < <(staged_files)

# 3. 300-line limit for .ts/.tsx source files
echo "  → Checking file size (≤300 lines for .ts/.tsx)..."
while IFS= read -r f; do
  case "$f" in *.ts|*.tsx) ;; *) continue ;; esac
  LINES=$(staged_content "$f" | wc -l)
  if [ "$LINES" -gt 300 ]; then
    echo "  ✗ $f has $LINES lines (limit 300, CLAUDE.md Rule 7)" >&2
    FAIL=$((FAIL+1))
  else
    PASS=$((PASS+1))
  fi
done < <(staged_files)

# 4. Migration file naming: YYYYMMDDHHMMSS_description.sql
echo "  → Checking migration naming..."
while IFS= read -r f; do
  case "$f" in supabase/migrations/*.sql) ;; *) continue ;; esac
  BASENAME=$(basename "$f")
  if ! echo "$BASENAME" | grep -qE '^[0-9]{14}_[a-z0-9_]+\.sql$'; then
    echo "  ✗ Migration '$BASENAME' must match YYYYMMDDHHMMSS_description.sql" >&2
    FAIL=$((FAIL+1))
  else
    PASS=$((PASS+1))
  fi
done < <(staged_files)

# 5. RLS check (delegate to check-rls.sh if present)
if [ -x "$SCRIPT_DIR_HOOK/check-rls.sh" ]; then
  echo "  → RLS check..."
  "$SCRIPT_DIR_HOOK/check-rls.sh" || FAIL=$((FAIL+1))
fi

# 6. CRS validation for GeoJSON (delegate to validate-crs.sh if present)
if [ -x "$SCRIPT_DIR_HOOK/validate-crs.sh" ]; then
  echo "  → CRS/bbox validation..."
  "$SCRIPT_DIR_HOOK/validate-crs.sh" || FAIL=$((FAIL+1))
fi

echo ""
echo "[pre-commit] Results: $PASS checks passed, $FAIL checks failed."
if [ "$FAIL" -gt 0 ]; then
  echo "[pre-commit] ✗ Commit blocked. Fix the issues above and re-commit." >&2
  exit 1
fi
echo "[pre-commit] ✓ All checks passed."
HOOK

chmod +x "$PRE_COMMIT"

cat > "$POST_COMMIT" << 'HOOK'
#!/usr/bin/env bash
# CapeTown GIS Hub — post-commit verification hook
set -euo pipefail

SCRIPT_DIR_HOOK="$(git rev-parse --show-toplevel)/scripts"
if [ ! -f "$SCRIPT_DIR_HOOK/sync_doc_indexes.py" ]; then
  exit 0
fi

mapfile -t MONITORED_FILES < <(git diff-tree --no-commit-id --name-only -r HEAD | grep -E '^(docs|\.claude|\.gemini|\.github)/' || true)
if [ "${#MONITORED_FILES[@]}" -eq 0 ]; then
  exit 0
fi

CHECK_CMD=(python3 "$SCRIPT_DIR_HOOK/sync_doc_indexes.py" --check)
for f in "${MONITORED_FILES[@]}"; do
  CHECK_CMD+=(--changed "$f")
done

if "${CHECK_CMD[@]}"; then
  echo "[post-commit] ✓ monitored indexes are in sync."
else
  echo "[post-commit] ✗ monitored indexes are stale. Run: python3 scripts/sync_doc_indexes.py" >&2
fi
HOOK

chmod +x "$POST_COMMIT"
echo "[capegis] ✓ pre-commit and post-commit hooks installed."
echo "[capegis] Scripts used by the hooks: scripts/sync_doc_indexes.py, scripts/check-rls.sh, scripts/validate-crs.sh"
