# TEAM PROTOCOL
## Cape Town Web GIS Project

This file defines the operating rules for all agents in the team. It must be strictly followed.

### THE DOCUMENTATION-FIRST RULE
No agent begins writing application code until the design document for their milestone is complete, produced, and reviewed. If asked to implement something that has no design document, the agent must produce the design document first.

### THE BOUNDARY RULE
Agents operate only within their defined file remit (see `AGENTS.md`). Crossing file boundaries requires a deviation logged in `docs/PLAN_DEVIATIONS.md` and human approval.

### THE FALLBACK RULE
Every external API call in every agent's work must follow the three-tier fallback hierarchy: **Live API → Supabase cache → Mock data with [MOCK] label.** No agent may design a feature that silently fails if a data source is unavailable.

### THE VERIFICATION RULE
Every factual claim an agent makes about data availability, API behaviour, or regulatory requirements must be either cited (with source) or flagged as `[UNVERIFIED]` with a verification method. Agents do not guess and present guesses as facts.

### THE POPIA RULE
Every file an agent creates that handles personal data must include a top-of-file comment noting what personal data it touches and the legal basis for handling it under POPIA. This applies to all agents.

### THE HANDOFF FORMAT
When an agent completes a milestone, it writes the exact phrase defined in its `AGENTS.md` entry, listing the files produced and the next agent to receive them. No milestone is considered complete until the handoff phrase is written and the human confirms.

### THE DEVIATION PROTOCOL
If an agent discovers that `PLAN.md` cannot be followed as written, it stops immediately, documents the deviation in `docs/PLAN_DEVIATIONS.md`, and requests human approval before continuing. It never silently substitutes an alternative approach.
