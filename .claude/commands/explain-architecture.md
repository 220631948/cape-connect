<!--
trigger: /explain-architecture [<component>] [--agents] [--flows] [--rules]
primary_agent: REPO-ARCHITECT
-->

## Trigger
`/explain-architecture [<component>] [--agents] [--flows] [--rules]`

## Purpose
Explain the CapeTown GIS Hub architecture in plain English — suitable for onboarding
new developers or AI agents entering the codebase. Answers "how does X work?" questions
with concrete file references, data flow diagrams, and CLAUDE.md rule explanations.
Uses `.claude/ARCHITECTURE.md` as the primary reference source.

## Primary Agent
**REPO-ARCHITECT 🏗️** — invokes `code_summarize` and `stack_detect` skills.

## Steps

1. **Read `.claude/ARCHITECTURE.md`** as the primary reference for all architectural facts.

2. **Component-specific explanation** — if `<component>` is provided:
   - Invoke `code_summarize` on the named component/module
   - Produce: what it does, what it imports, what it exports, which CLAUDE.md rules apply
   - Show how it connects to the broader data flow

3. **Agent ecosystem explanation** — if `--agents` flag:
   - List all 30 agents (25 milestone + 5 ARIS) with their domains
   - Show handoff chains: which agent activates which
   - Show supporting agents and when each is invoked
   - Show priority levels: P0 (always active) → P1 → P2 → P3

4. **Data flow explanation** — if `--flows` flag:
   - Describe client→API→PostGIS→Martin data pipeline
   - Explain three-tier fallback: LIVE → CACHED (`api_cache`) → MOCK (`public/mock/`)
   - Explain auth flow: Supabase Auth → JWT → tenant context injection → RLS
   - Show MapLibre rendering pipeline: vector tiles → layer Z-order → user interactions

5. **CLAUDE.md rules explanation** — if `--rules` flag:
   - Explain all 10 rules with examples from the actual codebase
   - Rule 1: badge format and placement
   - Rule 2: three-tier fallback chain
   - Rule 3: no API keys in source
   - Rule 4: RLS + application layer (both required)
   - Rule 5: POPIA annotation block format
   - Rule 6: CartoDB attribution
   - Rule 7: 300-line file limit
   - Rule 8: No Lightstone data
   - Rule 9: Cape Town bbox
   - Rule 10: Sequential milestone ordering

6. **Format response:**
   - OVERVIEW (2 paragraphs on the platform's purpose and architecture)
   - KEY CONCEPTS (bullet list: multi-tenancy, three-tier fallback, POPIA, etc.)
   - ASCII DIAGRAM (data flow or component hierarchy as applicable)
   - CODE REFERENCES (file paths with 1-line descriptions)
   - NEXT STEPS (what to read next for deeper understanding)

## MCP Servers Used
- `filesystem` — read ARCHITECTURE.md and source files

## Success Criteria
- Plain-English explanation produced (no jargon without definition)
- All file references point to existing files
- ASCII diagram accurately represents the described system
- All 10 CLAUDE.md rules correctly described if `--rules` flag used
- Agent handoff chain accurate if `--agents` flag used

## Usage Example
```bash
# General architecture overview
/explain-architecture

# Explain a specific component
/explain-architecture app/src/components/MapView.tsx

# Explain the agent ecosystem
/explain-architecture --agents

# Explain data flows
/explain-architecture --flows

# Explain all CLAUDE.md rules with examples
/explain-architecture --rules

# Full onboarding explanation
/explain-architecture --agents --flows --rules
```
