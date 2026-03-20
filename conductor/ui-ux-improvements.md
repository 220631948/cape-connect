# Plan: UI/UX and Responsiveness Improvements

## Objective
Enhance the responsiveness and UI/UX of `DashboardScreen.tsx` and `DashboardHeader.tsx` to ensure they render beautifully across all viewports (mobile, tablet, desktop).

## Key Files & Context
- `src/components/DashboardScreen.tsx`: The main layout container.
- `src/components/dashboard/DashboardHeader.tsx`: The header.

## Current State & Issues
- The `DashboardScreen` uses a CSS grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`. This is relatively responsive, but the layout of the specific cards within the grid might break or look squished on smaller screens.
- `DashboardHeader` uses flex-wrap, but padding and gaps might be too large for mobile viewports.
- The `LiveFlightTelemetry` and `QuickDropArea` components are added to the grid but might not have appropriate `col-span` classes for larger screens, causing them to stack awkwardly.

## Implementation Steps
1. **Refine Grid Layout in `DashboardScreen.tsx`**:
   - Ensure the "Map View" card spans appropriately across breakpoints (e.g., `col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2`).
   - Adjust `LiveFlightTelemetry` and `QuickDropArea` to span correctly (e.g., telemetry spanning 2 columns on large screens).
   - Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to fine-tune padding and gaps.
2. **Improve `DashboardHeader.tsx` Responsiveness**:
   - Reduce padding on smaller screens (`p-4 sm:p-6`).
   - Adjust text sizes for headings (`text-2xl sm:text-3xl`).

## Verification
- Layout does not break on mobile.
- Cards utilize available space efficiently on desktop.
