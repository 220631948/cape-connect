# /check-remit — Agent Boundary Verification

## Trigger
`/check-remit` or "am I within my allowed files?"

## What It Does
Reads the active agent definition from `.claude/agents/` and compares the files you've modified in this session against the agent's ALLOWED TOOLS AND FILES section.

## Procedure
1. Identify the current agent (from conversation context or ask)
2. Read `.claude/agents/[agent-name].md`
3. Extract the "ALLOWED TOOLS AND FILES" section
4. Extract the "PROHIBITED" section
5. List all files modified in the current session (`git diff --name-only`)
6. Compare against allowed/prohibited boundaries
7. Flag violations

## Expected Output
```
Remit Check — [agent-name]
=====================================
✅ WITHIN REMIT:
  - [file]: allowed by "[rule]"

🚨 OUTSIDE REMIT:
  - [file]: prohibited — [reason]
  - Recommended action: [revert / coordinate with [other-agent]]

⚠️ GREY AREA:
  - [file]: not explicitly allowed or denied — verify with human
```

## Skill Invoked
None (reads agent definitions directly)
