Active milestone check: !`grep -m1 "IN PROGRESS\|🔄" ROADMAP.md`
Evidence gates status: !`grep -i "evidence gate\|gate [A-E]" PLAN.md | head -20`

Before starting a new milestone:
1. Confirm the previous milestone is signed off in ROADMAP.md
2. Confirm no evidence gates block the target milestone
3. Read the milestone's acceptance criteria from PLAN.md
4. Switch to a fresh worktree (wt-N where N is available)
5. Enter Plan Mode before writing a single line of implementation

If the previous milestone is not signed off, stop and run /milestone-signoff first.
