---
description: Scaffold a new React component with the project's file conventions.
name: new-component
tools: ['editFiles']
---

Create a new React component following the Cape Town Web GIS project conventions:

1. Create a new `.tsx` file at the appropriate path based on the component type:
   - Map components → `src/components/map/`
   - Panel components → `src/components/panels/`
   - Tenant components → `src/components/tenant/`
   - UI components → `src/components/ui/`

2. Include the required top-of-file comment block:
```typescript
// [ComponentName]
// What: [one sentence description]
// Why: [purpose in the larger system]
// Milestone: M[N] — [Milestone name]
// Agent: [AGENT-NAME]
```

3. Use TypeScript strict mode with explicit return types.
4. Use named exports (not default exports).
5. If the component handles personal data, add the `[POPIA]` header.
6. Keep the file under 300 lines.

Ask the user for: component name, purpose, and which milestone it belongs to.
