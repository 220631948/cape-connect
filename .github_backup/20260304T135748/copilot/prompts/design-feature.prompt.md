---
description: Generate a feature design document following the documentation-first workflow.
name: design-feature
agent: agent
tools: ['codebase', 'search', 'fetch', 'editFiles']
---

Generate a feature design document following the documentation-first workflow from `.github/skills/documentation_first_design/SKILL.md`.

Create a new document in `docs/` that includes:

1. **Feature Overview:** What it does, who it serves (persona), and acceptance criteria.
2. **Data Sources:** Each external source with status from `DATA_CATALOG.md` and fallback strategy.
3. **RBAC Boundary:** Which roles can access, from `RBAC_MATRIX.md`.
4. **Implementation Plan:** 5–10 bullet list of files to create/edit.
5. **Error States:** What happens when data is unavailable.
6. **Empty States:** What users see before data loads.
7. **POPIA Implications:** Does it handle personal data? If yes, complete the checklist.
8. **Assumptions:** Flag any with `[ASSUMPTION — UNVERIFIED]`.

Ask the user for: feature name, target milestone, and the persona it serves.
