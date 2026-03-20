---
name: 'POPIA & Security'
description: 'Data privacy and security standards for South Africa'
applyTo: '**/hooks/**/*,**/services/**/*,**/contexts/**/*'
---

# POPIA Compliance & Security Standards

## POPIA (Protection of Personal Information Act 4 of 2013)

Every file that handles personal data MUST include a POPIA header comment:

```typescript
// [POPIA] Personal information handled: [list items]
// Purpose: [specific, explicit, lawful purpose]
// Lawful basis: [consent | contract | legal obligation | vital interests | public interest | legitimate interests]
// Retention: [period or reference to retention policy]
// Reviewed by: [agent/developer name] on [date]
```

### Personal Information (POPIA definition, inclusive):
- Names, email addresses, phone numbers
- Identification numbers (SA ID, passport)
- Location data (GPS coordinates, addresses)
- Online identifiers (session tokens, cookies)
- Behavioural data (search history, saved items, analytics)

### Required Mechanisms:
- Data subject access requests (user can view their data)
- Right to correction (user can update their info)
- Right to deletion (POPIA Section 23) — actual deletion within 30 days, audit log survives
- Right to object to processing
- Audit logging for significant actions (login, export, account deletion)

### Security:
- RLS must be enabled on every table with personal data
- Authentication required on all API endpoints serving personal data
- No personal data in client-side localStorage or sessionStorage
- No secrets in source code — always use environment variables
