# Seeder Data — CapeTown GIS Hub

> **Purpose**: Deterministic test users for E2E and integration testing.
> All credentials are referenced via environment variables — never hardcoded.

## Seeded Users

| Role | Email | Password Env Var | Tenant | UUID |
|---|---|---|---|---|
| PLATFORM_ADMIN | `platformadmin@capegis.test` | `SEED_PLATFORM_ADMIN_PW` | platform (none) | `11111111-1111-1111-1111-111111111111` |
| TENANT_ADMIN | `tenantadmin@capegis.test` | `SEED_TENANT_ADMIN_PW` | Cape Town Metro (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`) | `22222222-2222-2222-2222-222222222222` |
| VIEWER | `viewer@capegis.test` | `SEED_VIEWER_PW` | Cape Town Metro (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`) | `33333333-3333-3333-3333-333333333333` |
| ANALYST | `analyst@capegis.test` | `SEED_ANALYST_PW` | Cape Town Metro (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`) | `44444444-4444-4444-4444-444444444444` |
| GUEST | `guest@capegis.test` | `SEED_GUEST_PW` | (none) | `55555555-5555-5555-5555-555555555555` |

## Seeded Tenant

| Name | Slug | UUID |
|---|---|---|
| Cape Town Metro | `cape-town-metro` | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` |

## How to Set Credentials

Add to `.env.local` (never commit):

```env
SEED_PLATFORM_ADMIN_PW=<password>
SEED_TENANT_ADMIN_PW=<password>
SEED_VIEWER_PW=<password>
SEED_ANALYST_PW=<password>
SEED_GUEST_PW=<password>
```

## Seed SQL

Run against Supabase with service-role key. See `supabase/seed.sql` (to be created after credentials are confirmed).

## Constraints

- **Existing users only** — do not create new users at runtime in tests
- **Fixed UUIDs** — enables deterministic test assertions
- **Env-var passwords** — never hardcoded per CLAUDE.md Rule 3
