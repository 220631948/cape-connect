Read PLAN.md and ROADMAP.md. Identify the active milestone.
Run: !`git log --oneline -20`
Check every acceptance criterion listed in the milestone definition.
Check for unresolved evidence gates.
If all criteria pass and no gates are open: generate a sign-off block in the format:
  ✅ M[N] SIGNED OFF — [date] — [brief summary]
  Add this block to ROADMAP.md under the milestone entry.
If any criterion fails or any gate is unresolved: list the failures explicitly and stop.
Do not sign off a partial milestone. That is like saying you finished your dinner when you just moved the peas around.
