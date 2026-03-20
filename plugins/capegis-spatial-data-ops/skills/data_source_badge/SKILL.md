---
name: data-source-badge
description: Generate [SOURCE·YEAR·LIVE|CACHED|MOCK] badge for every data display component. Required by CLAUDE.md Rule 1.
---

# Data Source Badge Skill

## Purpose
Every component that displays data must show a visible `[SOURCE · YEAR · STATUS]` badge per CLAUDE.md Rule 1. This skill generates the badge component, wires it to the three-tier fallback state, and ensures it is never hidden behind a hover interaction.

## Trigger
Invoke when:
- Creating a new map layer, data panel, chart, or table component
- Reviewing an existing component that lacks a visible source badge
- Implementing the three-tier fallback (LIVE → CACHED → MOCK) in any component
- Running the H-badge-check hook reminder during PostToolUse

## Procedure

### Step 1 — Badge Component (reusable)
```typescript
// src/components/ui/DataSourceBadge.tsx
// Files ≤ 300 lines — this component is intentionally minimal

type DataStatus = 'LIVE' | 'CACHED' | 'MOCK';

interface DataSourceBadgeProps {
  source: string;   // e.g. "City of Cape Town GV Roll"
  year: number;     // e.g. 2022
  status: DataStatus;
}

const STATUS_STYLES: Record<DataStatus, string> = {
  LIVE:   'bg-emerald-900 text-emerald-300 border-emerald-700',
  CACHED: 'bg-amber-900  text-amber-300  border-amber-700',
  MOCK:   'bg-red-900    text-red-300    border-red-700',
};

export function DataSourceBadge({ source, year, status }: DataSourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${STATUS_STYLES[status]}`}
      aria-label={`Data source: ${source}, year ${year}, status ${status}`}
    >
      {source} · {year} · {status}
    </span>
  );
}
```

### Step 2 — Wire to Three-Tier Fallback State
```typescript
// In the consuming component
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';

// status comes from the three-tier fallback hook
const { data, status } = useDataWithFallback(/* ... */);

return (
  <div>
    {/* Badge must be ALWAYS VISIBLE — not hover-only */}
    <div className="flex items-center justify-between mb-2">
      <h2>Valuation Data</h2>
      <DataSourceBadge
        source="City of Cape Town GV Roll"
        year={2022}
        status={status}  // 'LIVE' | 'CACHED' | 'MOCK'
      />
    </div>
    {/* data display below */}
  </div>
);
```

### Step 3 — Approved Source Names
Use these exact strings for the `source` prop:

| Data | Source string | Year |
|------|---------------|------|
| Property valuations | `"City of Cape Town GV Roll"` | 2022 |
| Zoning | `"City of Cape Town Zoning"` | Current |
| Suburb boundaries | `"City of Cape Town Suburbs"` | Current |
| Cadastral parcels | `"City of Cape Town Cadastral"` | Current |
| Flood risk | `"City of Cape Town Flood Risk"` | Current |
| Fire risk | `"City of Cape Town Fire Risk"` | Current |
| Census data | `"StatsSA Census"` | 2022 |
| Aerial imagery | `"City of Cape Town Aerial"` | Current |

**Never** use `"Lightstone"` as a source — prohibited by CLAUDE.md Rule 8.

### Step 4 — Badge Placement Rules
- **Map layer panel:** Top-right of the layer card, always visible
- **Data table/chart:** Inline with the table/chart heading, left-aligned
- **Map overlay:** Bottom-left corner of the map container, above attribution
- **Dashboard card:** Below the card title, before the data

Badge must **not**:
- Be hidden behind a `hover:` or `group-hover:` class
- Be collapsed into a tooltip as the only source of status
- Be omitted when status is `MOCK` (MOCK is the most important state to show)

### Step 5 — Storybook / Test
```typescript
// src/components/ui/DataSourceBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { DataSourceBadge } from './DataSourceBadge';

test.each([['LIVE'], ['CACHED'], ['MOCK']] as const)(
  'renders %s status badge visibly',
  (status) => {
    render(<DataSourceBadge source="Test" year={2022} status={status} />);
    expect(screen.getByText(/Test · 2022 · /)).toBeVisible();
  }
);
```

## Output Format
```
Badge check: [ComponentName]
  Badge present: ✓ / ✗ MISSING
  Placement: [location]
  Status wired to fallback: ✓ / ✗
  Always visible (no hover gate): ✓ / ✗
```

## When NOT to Use This Skill
- Pure layout/navigation components with no data display
- Loading skeleton components (no data yet — badge appears after load)
- The `DataSourceBadge` component itself
- Server Components that only pass data down — badge belongs in the leaf display component
