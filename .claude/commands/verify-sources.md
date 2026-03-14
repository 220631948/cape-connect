# /verify-sources — Data Source Verification

## Trigger
`/verify-sources` or "check data sources against live APIs"

## What It Does
Reads `docs/API_STATUS.md` and probes each documented endpoint to verify availability, response format, and authentication requirements.

## Procedure
1. Read `docs/API_STATUS.md` — extract all documented endpoints
2. For each endpoint:
   - HTTP GET to the service directory or test URL
   - Check response code (200, 401, 403, 404, 5xx)
   - Verify response format matches documentation
   - Check if auth token is required
   - Measure response time
3. Compare results against documented status (CONFIRMED/LIKELY/UNCERTAIN)
4. Update `docs/API_STATUS.md` with findings
5. Flag any newly broken endpoints

## Expected Output
```
Data Source Verification — [date]
=====================================
Endpoints checked: [N]

✅ CONFIRMED (responding as documented):
  - [endpoint]: [status] [response_time]

⚠️ CHANGED (status differs from docs):
  - [endpoint]: documented as [X], actual is [Y]

🚨 UNAVAILABLE:
  - [endpoint]: [error]

Updated: docs/API_STATUS.md
```

## Skill Invoked
`mock-to-live-validation` (for endpoints transitioning status)
