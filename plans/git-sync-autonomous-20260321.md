# Implementation Plan: Autonomous Git Sync & Security Hardening

## Approach
This plan implements a robust, stateful synchronization workflow between local and remote environments. It uses a phase-based execution model with mandatory security gates (Gitleaks) and automated conflict resolution based on file-type heuristics. The state is persisted to `/tmp/git-sync-state.json` to handle interruptions, and an audit trail is maintained in `docs/git-sync-audit.log`.

### Alternatives Considered
- **Merge-based sync:** Rejected in favor of **Rebase** to maintain a linear history and ensure all feature branches are strictly downstream of the current `main`.
- **Manual PR resolution:** Rejected to achieve the goal of autonomy, using `gh` CLI for automated merging of passing PRs.

## Steps

### 1. P0: Preflight & Environment Setup (10 min)
- **Action:** Detect `REPO_ROOT`, verify dependencies (`git`, `gh`, `gitleaks`, `pre-commit`).
- **Files:** `/tmp/git-sync-state.json`, `docs/git-sync-audit.log`.
- **Logic:** Stash dirty work with a unique timestamped message to ensure a clean starting state.

### 2. P1: Secret Scan (15 min)
- **Action:** Run `gitleaks detect --source .`.
- **Gate:** If secrets are found, emit `HUMAN_REQUIRED` and halt. Do not proceed to sync or push.

### 3. P2-P3: Multi-Branch Alignment (20 min)
- **Action:** Sync local `main` with `origin/main`.
- **Action:** Iterate through all remote branches. If missing locally, track them. If present, rebase local copy.

### 4. P4: Automated Rebase & Conflict Resolution (30 min)
- **Action:** For each feature branch, `git rebase main`.
- **Conflict Strategy:**
  - `*.md`: Union (keep both, de-duplicate).
  - `*.py`: Recent hunk wins (via `git log --follow`).
  - `*.ts/tsx`: Restrictive types + keep all exports.
  - `requirements.txt`/`package.json`: Superset (higher version wins).

### 5. P5-P6: Remote Synchronization & PR Resolution (30 min)
- **Action:** `git push --force-with-lease` for feature branches.
- **Action:** `gh pr merge --rebase --delete-branch` for all PRs where CI is green.
- **Action:** For failing/conflicting PRs, attempt local rebase fix and re-push once.

### 6. P7: Final Verification (10 min)
- **Check:** Verify S1 through S10 success criteria.
- **Cleanup:** Restore preflight stash and finalize audit log with `COMPLETE` status.

## Timeline
| Phase | Duration |
|-------|----------|
| P0: Preflight | 10 min |
| P1: Secret Scan | 15 min |
| P2-P3: Sync | 20 min |
| P4: Rebase Logic | 30 min |
| P5-P6: Push & PRs | 30 min |
| P7: Verification | 10 min |
| **Total** | **~2 hours** |

## Rollback Plan
1. **Branch Recovery:** Since we use `--force-with-lease`, we can recover previous states from `git reflog` if a push goes wrong.
2. **Stash Recovery:** `git stash pop` restores the state from before the sync started.
3. **State Reset:** Deleting `/tmp/git-sync-state.json` allows a fresh start.

## Security Checklist
- [x] Gitleaks pre-scan (P1)
- [x] Gitleaks per-branch scan before push (P5)
- [x] `--force-with-lease` instead of `--force` to prevent overwriting remote work
- [x] Audit log for all destructive operations

## Success Criteria (S1-S10)
- **S1:** `git diff origin/main` is empty.
- **S2/S3:** Local/Remote branch parity.
- **S4:** All branches rebased onto `main`.
- **S5:** Zero conflict markers.
- **S6:** `gh pr list --state open` is empty.
- **S7:** Gitleaks exits 0.
- **S8:** Pre-commit passes on `main`.
- **S9:** No orphaned `HEAD` branches.
- **S10:** Audit log marked `COMPLETE`.
