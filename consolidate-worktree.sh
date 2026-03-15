#!/usr/bin/env bash
set -euo pipefail
: "${WORKTREE_DIR:=".claude/worktrees/agent-a3419dcd"}"
: "${BRANCH_NAME:="wu-1-consolidate-worktree"}"
: "${DRY_RUN:="${DRY_RUN:-0}"}"

echo "Worktree source: $WORKTREE_DIR"
echo "Target branch: $BRANCH_NAME"

if [ ! -d "$WORKTREE_DIR" ]; then
  echo "ERROR: worktree directory does not exist: $WORKTREE_DIR"
  exit 2
fi

# Ensure clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash local changes first."
  git status --porcelain
  exit 3
fi

# Paths expected to copy (top-level)
COPY_PATHS=( \
  "src" \
  "package.json" \
  "tsconfig.json" \
  "next.config.ts" \
  "vitest.config.ts" \
  "Dockerfile" \
  ".env.example" \
  "supabase" \
  ".github/workflows" \
)

echo "Planned copy paths:"
for p in "${COPY_PATHS[@]}"; do
  echo " - $p"
done

echo
echo "1) Showing rsync dry-run (files that would be copied)."
RSYNC_OPTS=(--archive --verbose --compress --human-readable --exclude '.git' --exclude '.claude' --exclude 'node_modules')

# Do not overwrite existing files by default (--ignore-existing)
if [ "$DRY_RUN" = "1" ]; then
  echo "DRY RUN mode: showing what would be copied (rsync --dry-run --ignore-existing)"
  for p in "${COPY_PATHS[@]}"; do
    if [ -e "$WORKTREE_DIR/$p" ]; then
      rsync --dry-run --ignore-existing "${RSYNC_OPTS[@]}" "$WORKTREE_DIR/$p" "$PWD/$p"
    else
      echo "Note: source path missing in worktree: $WORKTREE_DIR/$p"
    fi
  done
  echo
  echo "If output above looks correct, re-run with DRY_RUN=0 or unset DRY_RUN to actually copy & commit."
  exit 0
fi

echo "2) Copying files (rsync --ignore-existing) from $WORKTREE_DIR -> repo root"
for p in "${COPY_PATHS[@]}"; do
  if [ -e "$WORKTREE_DIR/$p" ]; then
    rsync --ignore-existing "${RSYNC_OPTS[@]}" "$WORKTREE_DIR/$p" "$PWD/$p"
  else
    echo "WARN: source path missing (skipping): $WORKTREE_DIR/$p"
  fi
done

echo "3) Showing git status of added files (untracked/staged candidates)"
git add -N "${COPY_PATHS[@]}" 2>/dev/null || true
git status --porcelain
echo

echo "4) Create branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"
echo "5) Stage changes carefully — only newly copied items will be added."
# Stage only expected top-level items if they exist
for p in "${COPY_PATHS[@]}"; do
  if git ls-files --error-unmatch -- "$p" >/dev/null 2>&1 || [ -e "$p" ]; then
    git add "$p"
  fi
done

echo "Staged files:"
git status --porcelain
echo

echo "6) Please review the staged diff:"
git --no-pager diff --staged --name-status
echo
read -p "Proceed to commit staged changes? (type 'yes' to commit) " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborting: no commit made. You are still on branch $BRANCH_NAME with staged changes."
  echo "To undo: git reset --hard && git checkout - && git branch -D $BRANCH_NAME"
  exit 0
fi

COMMIT_MSG=$(cat <<'EOF'
chore(repo): consolidate canonical worktree into repository root

- Move canonical files from .claude/worktrees/<agent> into repo root:
  - src/, package.json, tsconfig.json, next.config.ts, Dockerfile, .env.example, supabase/migrations/, .github/workflows/
- This is the first step to restore CI and buildability at repo root.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)

git commit -m "$COMMIT_MSG"
echo "Commit created on branch $BRANCH_NAME."
echo "If you want a patch file: git format-patch -1 HEAD --stdout > ../consolidate-worktree.patch"
echo "To create a unified diff instead: git diff origin/main...HEAD > ../consolidate-worktree.diff"
echo "Done."