---
name: refactor_plan
description: >
  Read a source file, identify extract candidates (components, hooks, utilities),
  and produce a named proposed-module list with line ranges and rationale.
  Output must be approved before REFACTOR-SPECIALIST executes any changes.
__generated_by: aris-unit-5
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Analyses a source file to identify cohesive blocks that can be extracted into
separate modules without behaviour change. Produces a human-reviewable refactor
plan with proposed module names, line ranges, extraction type, and rationale.
**Must be approved before any code changes are made.**

## Trigger Conditions

- File exceeds 300 lines (CLAUDE.md Rule 7 violation)
- PROJECT-AUDIT-AGENT or `/analyze-repo` flags a file size issue
- REFACTOR-SPECIALIST is activated with a target file
- `/refactor-module` command invocation
- FEATURE-BUILDER reports a new component has grown too large

## Procedure

1. **Read the target file** completely using the Read tool.
   Note total line count. Confirm Rule 7 violation (> 300 lines) or document
   reason for refactoring (duplication, mixed responsibilities).

2. **Group lines by responsibility:** scan the file top-to-bottom and annotate
   each block with its single responsibility:
   - TypeScript types/interfaces
   - State management (Zustand store, useState, useReducer)
   - Data fetching (useEffect + fetch, SWR hooks)
   - Event handlers
   - Render/JSX output
   - Utility/helper functions

3. **Identify extraction candidates:** blocks with a single clear responsibility
   and minimal coupling to other blocks are candidates.
   A block is NOT a candidate if it shares state with > 2 other blocks.

4. **Assign proposed module names** following project conventions:
   - `use[Name].ts` for hooks
   - `[Name].tsx` for sub-components
   - `[name].utils.ts` for utility functions
   - `[name].types.ts` for type-only modules

5. **List line ranges:** `{ name, lines: [start, end], type, exports: [] }`

6. **Identify shared dependencies:** imports used by multiple proposed modules.
   Flag these as candidates for a barrel `index.ts` or shared util module.

7. **Output numbered proposal** for human approval before any execution.

## Output Format

```
=== REFACTOR PLAN ===
Target: app/src/components/MapView.tsx (420 lines — Rule 7 violation)

PROPOSED EXTRACTIONS:

1. useLayerManager (hook)
   Lines: 45–120 | Type: hook
   Exports: useLayerManager
   Rationale: Manages layer visibility state — single responsibility, 0 JSX
   Shared deps: layerStore (Zustand)

2. MapLegend (component)
   Lines: 280–350 | Type: component
   Exports: MapLegend
   Rationale: Renders layer legend — pure display, no state mutation

3. mapUtils (utility)
   Lines: 355–420 | Type: utility
   Exports: computeBbox, validateCRS
   Rationale: Pure functions, no React dependencies

BARREL: Create app/src/components/map/index.ts
After extraction: MapView.tsx ≈ 180 lines ✅

APPROVAL REQUIRED: Reply yes to proceed with extraction.
```

## When NOT to Use

- When file is ≤ 300 lines and no duplication is detected
- When the file already has a single, clear responsibility
- When refactoring requires logic changes (not a pure extraction — escalate)
- When the file is a migration or planning doc (Rule 7 exempts these)
