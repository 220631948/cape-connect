# SETTINGS.md — Settings Reference

**Name**: .github/SETTINGS.md  
**Purpose**: Documents the GitHub Copilot configuration boundaries encoded in `.vscode/settings.json` and `.github/copilot-instructions.md`. Defines execution permissions, context scope, and Copilot features for the workspace.  
**When to invoke**: When configuring new developer environments, testing Copilot behavior, or adjusting the inline chat settings.  
**Example invocation**: Read `.github/SETTINGS.md`  
**Related agents/skills**: `@workspace`  
**Configuration snippet**: N/A (Registry definition)

---

## 🛠️ Workspaces Configurations

### 1. `.vscode/settings.json`

**Name**: settings.json (VS Code Workspace Settings)  
**Purpose**: Tracks Copilot feature flags, enabled languages, and MCP connection definitions (if supported by the Copilot extension).  
**When to invoke**: Enabling/disabling Copilot inline suggestions for specific filetypes.  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```json
{
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true
  },
  "github.copilot.advanced": {
    "list": {
      "AGENTS.md": true
    }
  }
}
```

### 2. Copilot Custom Instructions

**Name**: `.github/copilot-instructions.md`  
**Purpose**: The system prompt injected into every `@workspace` chat. Enforces the CLAUDE.md/GEMINI.md top-level rules implicitly.  
**When to invoke**: Updating the core behavior of the Copilot chat assistant.  
**Example invocation**: N/A  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**:

```json
"github.copilot.chat.customInstructions": [
  { "file": ".github/copilot-instructions.md" }
]
```

---

## 🔒 Permission Grants

### 3. Commit/Push Restrictions

**Name**: GitHub Repository Branch Protections  
**Purpose**: Restricts direct pushes to `main`. All code MUST pass the mandatory GitHub Actions (`Badge Lint`, `RLS Check`, `File Size`).  
**When to invoke**: Reviewing PRs.  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**: None
