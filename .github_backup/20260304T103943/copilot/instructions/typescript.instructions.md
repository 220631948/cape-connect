---
name: 'TypeScript Standards'
description: 'Coding conventions for TypeScript files in the GeoSaaS project'
applyTo: '**/*.ts,**/*.tsx'
---

# TypeScript Coding Standards

- Use TypeScript strict mode. Never use `any` — prefer `unknown` with type guards.
- Use named exports over default exports.
- Prefer `interface` over `type` for object shapes.
- Use `const` assertions for literal types.
- All function signatures must have explicit return types.
- Async functions must have try-catch error handling with typed errors.
- No `console.log` in production code — use structured logging.
- File size limit: 300 lines max. Split into focused modules if exceeded.
- Group imports: React → Next.js → third-party → local → types.

## Top-of-File Comment (Required)

```typescript
// [Component/Hook/Service Name]
// What: [one sentence description]
// Why: [one sentence explaining its purpose]
// Milestone: M[N] — [Milestone name]
// Agent: [AGENT-NAME]
```

## POPIA Annotation (When handling personal data)

```typescript
// [POPIA] Personal information handled: [list]
// Purpose: [specific purpose]
// Lawful basis: [one of the six bases]
// Retention: [retention period or reference]
// Reviewed by: [agent name] on [date]
```
