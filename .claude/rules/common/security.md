# Security Rules — CapeTown GIS Hub

<!--
origin: affaan-m/everything-claude-code/rules/common/security.md (merged)
adaptation-summary: Merged ECC security checklist with existing GIS-specific rules.
  Added POPIA, RLS, spatial injection, and AgentShield scan reference.
-->

## Core Rules (from CLAUDE.md)

- **Rule 3:** No API keys in source — `.env` only. Never hardcode or log.
- **Rule 4:** RLS on every table + application layer `tenant_id` check — both required.
- **Rule 5:** POPIA annotation on all files touching personal data.

## Pre-Commit Security Checklist

Before ANY commit:

- [ ] No hardcoded secrets (API keys, passwords, tokens, JWTs)
- [ ] All user inputs validated at system boundaries
- [ ] SQL injection prevention — parameterized queries only (never string concat)
- [ ] XSS prevention — sanitized HTML output
- [ ] CSRF protection enabled on all mutation routes
- [ ] Authentication verified on every protected route
- [ ] Rate limiting on all API endpoints (10 req/sec anon, 20 req/sec authed for OpenSky)
- [ ] Error messages don't leak stack traces, tenant data, or PII
- [ ] RLS enabled and forced on every new table
- [ ] POPIA annotation added to files with personal data

## Spatial-Specific Security

- Validate bounding box before PostGIS operations (Rule 9: Cape Town bbox)
- Never expose raw WKT/WKB in API responses without geometry simplification
- `ST_IsValid()` check before any geometry is stored
- Parcel/property data: guest users get outline only (Rule §6 — no PII)

## Secret Management

- NEVER hardcode secrets in source code
- ALWAYS use environment variables (`.env` / Vercel env)
- Validate required secrets at startup (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Rotate any secrets that may have been exposed immediately

## Security Response Protocol

Security issue found → STOP immediately:

1. Use `SECURITY-AUDITOR-AGENT` or `/security-scan`
2. Fix CRITICAL before continuing any other work
3. Rotate exposed secrets
4. Review entire codebase for similar patterns
5. Document in `docs/PLAN_DEVIATIONS.md` (DEV-NNN format)

## AgentShield Scan

Run periodically (or after major changes to agent/hook/MCP config):

```bash
npx ecc-agentshield scan
# Or via slash command:
/security-scan
```

Output formats: terminal (A–F grade), JSON (CI), Markdown, HTML.
Exit code 2 on critical findings — blocks build gate.
