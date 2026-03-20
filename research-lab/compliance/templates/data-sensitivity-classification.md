# Data Sensitivity Classification Guide

> Use this template to classify dataset privacy sensitivity for the Research Lab.

## Classification Levels

### PUBLIC
- Open government data (CoCT open data portal)
- OpenStreetMap data
- Publicly available satellite imagery
- Aggregated statistics (ward/suburb level)
- **No restrictions** on research use

### LOW
- Anonymized survey data
- Aggregated demographic data (census block level)
- Infrastructure data (roads, utilities) without operator details
- **Standard data handling** practices sufficient

### MEDIUM
- Property valuation data (GV Roll) — contains property addresses
- Business location data
- Land use classifications with owner references
- **Pseudonymization recommended** — remove direct identifiers where possible
- **PIA review recommended**

### HIGH
- Individual property owner information
- Residential address data linked to individuals
- Movement/travel pattern data
- Utility consumption data linked to addresses
- **PIA required** — complete Privacy Impact Assessment
- **POPIA annotation required** on all handling code
- **Access controls** — RLS + role-based access

### RESTRICTED
- Biometric data
- Health-related spatial data
- Crime victim location data
- Minor/child location data
- **Ethics board approval required**
- **Full PIA + POPIA audit required**
- **Differential privacy** must be applied
- **Data cannot leave secure environment**

## Quick Reference

| Sensitivity | PIA Required | POPIA Annotation | Access Controls | Differential Privacy |
|-------------|-------------|-----------------|-----------------|---------------------|
| PUBLIC | ❌ | ❌ | ❌ | ❌ |
| LOW | ❌ | ❌ | ✅ Basic | ❌ |
| MEDIUM | Recommended | Recommended | ✅ RLS | ❌ |
| HIGH | ✅ Required | ✅ Required | ✅ RLS + RBAC | Recommended |
| RESTRICTED | ✅ Required | ✅ Required | ✅ Full isolation | ✅ Required |
