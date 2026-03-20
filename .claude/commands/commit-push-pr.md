Current git status: !`git status --short`
Recent commits: !`git log --oneline -10`
Active milestone: !`grep -m1 "IN PROGRESS\|🔄" ROADMAP.md || echo "Check ROADMAP.md manually"`

Write a conventional commit message referencing the active milestone.
Include in the PR description:
- Which milestone this closes or advances
- Any POPIA-relevant data handling changes (new tables, new PII fields, new endpoints)
- Testing notes (what was manually verified, what the verify-app agent confirmed)
Commit, push to origin, and open the PR. If no milestone is active, say so before proceeding.
