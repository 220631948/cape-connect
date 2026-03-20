Diff since last commit: !`git diff HEAD --name-only`
Search for new or modified API routes: !`git diff HEAD -- 'src/app/api/**' --stat`

For each changed file:
- Does it access or return PII (names, emails, locations, identity data)?
- Is RLS enforced on any PostGIS tables it queries?
- Is there a source attribution badge on any new data display component?
- Is consent documented for any new data collection?

Output a compliance summary table. Mark each item PASS, FAIL, or UNCERTAIN.
UNCERTAIN items must be flagged for human review. Do not guess on POPIA questions.
POPIA uncertainty is not a problem. POPIA silence is.
