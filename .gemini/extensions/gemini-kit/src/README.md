# Source Code

TypeScript source code for Gemini-Kit MCP extension.

## Purpose

Core implementation of MCP tools, utilities, and extension functionality.

## Components

| Directory/File | Description |
|----------------|-------------|
| `tools/` | MCP tool implementations |
| `index.ts` | Extension entry point |
| `utils/` | Utility functions |

## Key Files

- **tools/checkpoint.ts** - Git checkpoint management
- **tools/learning.ts** - Learning system (kit_save_learning, kit_get_learnings)
- **tools/integration.ts** - GitHub/Jira integration
- **tools/security.ts** - Secret detection and blocking

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Changelog

### 2024-12-24
- Initial documentation
