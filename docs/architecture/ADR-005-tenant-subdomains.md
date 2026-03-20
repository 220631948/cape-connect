# ADR 005: Tenant URL Strategy (Subdomains)

> **TL;DR:** Subdomain routing (`[tenant-slug].capegis.com`) selected for tenant identification. Provides professional white-labeling, clear session isolation, and prepares for custom domain support in Phase 2.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect, Technical Co-founder

## Context

Multi-tenant applications need a URL strategy for tenant context. This affects UX, white-labeling, and security isolation.

## Decision Drivers

- **White-labeling:** High-tier tenants prefer branded URLs
- **Context isolation:** Clear separation of tenant workspaces
- **Complexity:** Balance ease of setup vs. professional branding

## Considered Options

1. **Path-based:** `app.capegis.com/[tenant-slug]` — Simplest DNS, less professional
2. **Subdomain:** `[tenant-slug].capegis.com` — Professional, clear session boundaries
3. **Custom domains:** `maps.clientfirm.co.za` — Ultimate branding, highest complexity

## Decision

Chosen option: **Subdomain Routing (`[tenant-slug].capegis.com`)**.

### Implementation Strategy

- **Middleware:** Next.js Edge Middleware extracts subdomain from `host` header
- **Tenant Resolution:** Middleware verifies `tenant_slug` against DB, injects `tenant_id` into request
- **Wildcard DNS:** `*.capegis.com` points to Vercel deployment

## Consequences

- **Good:** Professional branding, easy multi-tenant scaling, prepares for custom domains
- **Bad:** Local dev requires `localhost` subdomain simulation (e.g., editing `/etc/hosts`)
- **Neutral:** Requires strict slug validation to prevent subdomain takeover

## Acceptance Criteria

- [ ] Edge Middleware extracts and validates tenant slug from subdomain
- [ ] Invalid slugs return 404 (not redirect to default tenant)
- [ ] `tenant_id` injected into request headers for downstream use
- [ ] Wildcard SSL configured for `*.capegis.com`
- [ ] Local dev instructions documented for subdomain simulation
