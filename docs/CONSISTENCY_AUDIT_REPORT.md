## Consistency Audit Report
Generated: 2026-03-10T14:30:00Z | Agent: consistency-auditor

### ✅ Fully Consistent
| Capability | .github/ | .claude/ | .gemini/ | Status |
|---|---|---|---|---|
| agentSwitching | Standard | Standard | Standard | Consistent |
| INDEX.md | Present | Present | Present | Consistent |
| AGENTS.md | v2 Boilerplate| v2 Boilerplate| v2 Boilerplate| Consistent |

### ⚠️ Partial Match — Needs Harmonisation
| Capability | .github/ has | .claude/ has | .gemini/ has | Decision |
|---|---|---|---|---|
| Skills | 19 items | 19 items | 9 items | Sync verified skills to .gemini/ |
| Hooks | copilot-hooks.json| PostToolUse block | doc-index-sync.js | Harmonise maintenance trigger logic |
| MCP Servers | doc-state | doc-state | doc-state (Local) | Standardise local path usage |

### ❌ Missing in One or More Directories
| Capability | Missing in | Planned Action |
|---|---|---|
| AUTO markers | .gemini/GEMINI.md | Add BEGIN/END AUTO markers |
| Maintenance Rules| .gemini/GEMINI.md | Port Rules from CLAUDE.md |
| sonarqube-mcp | .github/ / .claude/| Keep Gemini-only (Extension) |

### 🤔 Assumptions Surfaced
| Assumption | Finding | Recommendation |
|---|---|---|
| docs/ as monitored | docs/ contains master| Keep as central hub |
| sonarqube scope | Extension only | Document as Gemini-specific |
| doc-state existence| mcp/doc-state/ exists| Activate for all 3 agents |
| install-hooks.sh | File exists | Use as canonical setup step |

[AGENT: consistency-auditor | SESSION: 2026-03-10T14:30:00Z]
