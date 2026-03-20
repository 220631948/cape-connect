# /new-component — React Component Scaffolding

## Trigger
`/new-component [name]` or "scaffold a new component"

## What It Does
Creates a new React component following the Cape Town GIS project conventions from CLAUDE.md and the existing codebase patterns.

## Procedure
1. Ask for (if not provided): component name, purpose, milestone, component type
2. Determine the file path:
   - Map components → `app/src/components/map/`
   - Panel components → `app/src/components/panels/`
   - Tenant components → `app/src/components/tenant/`
   - Auth components → `app/src/components/auth/`
   - Dashboard components → `app/src/components/dashboard/`
   - UI components → `app/src/components/ui/`
3. Create the file with the required header:
```typescript
/**
 * [ComponentName]
 * What: [one sentence description]
 * Why: [purpose in the larger system]
 * Milestone: M[N] — [Milestone name]
 * Agent: [AGENT-NAME]
 */
```
4. Use TypeScript strict mode with explicit return types
5. Use named exports (not default exports)
6. If the component handles personal data → invoke `popia-compliance` skill
7. Verify file is under 300 lines

## Expected Output
A new `.tsx` file with proper header, typed props interface, and skeleton implementation.

## Skill Invoked
- `popia-compliance` — if component handles personal data
- `documentation-first` — verify design doc exists for this feature
