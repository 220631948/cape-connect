# Design System — CapeTown GIS Hub

> **TL;DR:** Dark-first dashboard UI with crayon accent colours. Every component follows strict contrast ratios for accessibility, includes data source badges, and works across desktop and mobile. Now migrated to Tailwind CSS for utility-first styling.

## Dark Theme Specification

### Core Palette (Near-Black)
| Token | Hex | Usage | Contrast vs Text |
|-------|-----|-------|-----------------|
| `--bg-primary` | `#0B0C10` | App background, near-black | — |
| `--bg-secondary` | `#1F2833` | Cards, panels, sidebars | — |
| `--bg-tertiary` | `#45A29E` | Elevated surfaces (teal accents) | — |
| `--bg-hover` | `#66FCF1` | Interactive hover state | — |
| `--text-primary` | `#F0F0F5` | Headings, primary content | 16.2:1 on `--bg-primary` |
| `--text-secondary` | `#C5C6C7` | Labels, secondary content | 7.8:1 on `--bg-primary` |
| `--text-muted` | `#6B6B80` | Hints, disabled text | 4.6:1 on `--bg-primary` |
| `--border-default` | `#1F2833` | Card borders, dividers | — |
| `--border-focus` | `#00D1FF` | Focus rings, active borders | — |

### Contrast Requirements
- All text must meet WCAG 2.1 AA: ≥ 4.5:1 for body text, ≥ 3:1 for large text (18px+).
- Interactive elements must have ≥ 3:1 contrast against adjacent backgrounds.
- Focus indicators must have ≥ 3:1 contrast against both the element and its background.

## Crayon Accent Palette

Vibrant, youth-friendly colours inspired by crayon sets. Each has a designated role.

| Token | Hex | Role | Sample Use |
|-------|-----|------|------------|
| `--accent-blue` | `#00D1FF` | Primary action, navigation | Buttons, active nav, wayfinding |
| `--accent-pink` | `#FF61EF` | Alerts, community, highlights | Alerts, social features |
| `--accent-yellow`| `#FFD700` | Caution, insights, highlights | Warning indicators, charts |
| `--accent-coral` | `#FF6B6B` | Destructive actions | Error badges, deletions |
| `--accent-green` | `#4ECDC4` | Success, LIVE status | Data badges, confirmations |
| `--accent-purple` | `#A78BFA` | Analysis, deep insights | Research highlights |
| `--accent-cyan` | `#66FCF1` | Interactive elements | Hover states, active toggles |
| `--accent-lime` | `#A3E635` | Environmental, nature | Vegetation overlays |
| `--accent-orange` | `#FB923C` | MOCK data status | Fallback indicators |

### Status Colour Mapping
- `LIVE` → `--accent-green` (`#4ECDC4`)
- `CACHED` → `--accent-yellow` (`#FFD700`)
- `MOCK` → `--accent-orange` (`#FB923C`)

## Tailwind CSS Integration

The design system is implemented using Tailwind CSS. Configuration is defined in `tailwind.config.ts`.

### Custom Theme Configuration
```typescript
// tailwind.config.ts (excerpt)
{
  theme: {
    extend: {
      colors: {
        'near-black': '#0B0C10',
        'crayon-blue': '#00D1FF',
        'crayon-pink': '#FF61EF',
        'crayon-yellow': '#FFD700',
        // ...
      }
    }
  }
}
```

## Typography Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 12px | 400 | 1.5 | Badges, timestamps |
| `--text-sm` | 14px | 400 | 1.5 | Secondary labels, metadata |
| `--text-base` | 16px | 400 | 1.6 | Body text, descriptions |
| `--text-lg` | 18px | 500 | 1.5 | Section headings |
| `--text-xl` | 20px | 600 | 1.4 | Panel titles |
| `--text-2xl` | 24px | 700 | 1.3 | Page headings |
| `--text-3xl` | 30px | 700 | 1.2 | Dashboard hero metrics |

- **Font family:** System font stack — `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace:** `'JetBrains Mono', 'Fira Code', monospace` for coordinates, code, and data values.

## Component Patterns

### Card
- Background: `--bg-secondary`
- Border: `1px solid --border-default`
- Border radius: `8px`
- Padding: `16px`
- Shadow: `0 2px 8px rgba(0,0,0,0.3)`
- Hover: background shifts to `bg-opacity-80`, border to `--border-focus`

### Panel (Side/Bottom)
- Background: `--bg-secondary` with `backdrop-blur`
- Width: `320px` (side panel) or full-width (bottom panel)
- Collapsible with smooth animation (200ms ease-out)
- Close button: top-right, `44x44px` touch target

### Overlay / Modal
- Backdrop: `bg-black/70` with `backdrop-blur-sm`
- Content: `bg-secondary` card, max-width `max-w-xl`
- Focus trapped inside overlay until dismissed
- Escape key and backdrop click dismiss

### Map Controls
- Background: `bg-secondary/80`
- Border radius: `rounded-lg`
- Touch target: `h-11 w-11` minimum
- Grouped vertically on right edge (desktop) or bottom-right (mobile)
- Zoom: `+`/`-` buttons with visible focus rings
- Compass: `--accent-blue` north indicator
- Attribution: `© CARTO | © OpenStreetMap contributors` always visible, `--text-xs`

## Data Source Badge Component

The badge is mandatory on every data display (CLAUDE.md Rule 1).

### Structure
```
[SOURCE_NAME · YEAR · STATUS]
```

### Visual Spec (Tailwind Classes)
- Classes: `text-xs font-mono px-2 py-0.5 rounded bg-black/60 text-[#F0F0F5] flex items-center gap-1.5`
- Status dot: `h-1.5 w-1.5 rounded-full`
  - LIVE: `bg-crayon-green`
  - CACHED: `bg-crayon-yellow`
  - MOCK: `bg-crayon-orange`
- Position: bottom-left of data component, always visible without hover
- ARIA: `role="status"` with full text as `aria-label`

### Examples
- `[OpenSky · 2025 · LIVE]`
- `[CoCT GV Roll · 2022 · CACHED]`
- `[Sample Data · 2024 · MOCK]`

## Spacing Scale
| Token | Value | Tailwind equivalent |
|-------|-------|--------------------|
| `--space-1` | 4px | `1` / `0.25rem` |
| `--space-2` | 8px | `2` / `0.5rem` |
| `--space-3` | 12px | `3` / `0.75rem` |
| `--space-4` | 16px | `4` / `1rem` |
| `--space-6` | 24px | `6` / `1.5rem` |
| `--space-8` | 32px | `8` / `2rem` |

## High-Contrast Mode Overrides
- `@media (prefers-contrast: more)`
- `--bg-primary` → `#000000`
- `--text-primary` → `#FFFFFF`
- `--border-default` → `#FFFFFF`
- All accent colours increase saturation by 20%
- Badge backgrounds become fully opaque
