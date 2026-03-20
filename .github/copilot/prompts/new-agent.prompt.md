---
mode: 'agent'
description: 'Scaffold a new .github/agents/*.agent.md file with proper frontmatter and protocol'
---
# New Agent Scaffolder

## Context
Read `AGENTS.md` (canonical fleet) and any existing agent file in `.github/copilot/agents/` before generating. Do not create agents that duplicate an existing role.

## Task
Generate a new agent definition file at `.github/copilot/agents/<name>.agent.md` based on the role described by the user.

### Required Sections:

**1. YAML Frontmatter**
```yaml
---
name: '<agent-name>'
description: '<one-line role description>'
tools:
  - <tool-name>
model: 'claude-sonnet-4-5'  # or gpt-4.1 for fast tasks
---
```
Tools must be chosen from: `read_file`, `write_file`, `run_terminal_command`, `search_code`, `get_file_changes`, `semantic_search`, `list_directory`, `get_errors`.

**2. TL;DR**
One paragraph describing the agent's singular responsibility and what it must NOT do.

**3. Scope & Boundaries**
- What this agent owns
- What it must hand off to another agent (with agent name)
- Geographic scope reminder: Cape Town + Western Cape only

**4. Chain-of-Thought Protocol**
Numbered steps the agent follows for every task:
1. Read relevant context files first
2. State assumptions explicitly before acting
3. Check CLAUDE.md rule compliance
4. Execute task
5. Validate output against acceptance criteria
6. Handoff or escalate

**5. Skill References**
List any `.github/copilot/prompts/*.prompt.md` files this agent should invoke, and when.

**6. Handoff Pattern**
```
On completion: → <next-agent> with payload: <what to pass>
On failure: → orchestrator.agent.md with error summary
```

**7. CLAUDE.md Rules Enforced**
List which Rules (1–10) this agent actively enforces.

### Constraints:
- File ≤300 lines
- No duplicate roles with existing fleet agents
- Update `AGENTS.md` fleet table after creating the file

## Output Format
Complete `.agent.md` file following the sections above, then a one-line instruction to update `AGENTS.md`.
