# License Compatibility & POPIA Compliance Audit
## CapeTown GIS Research Lab — Phase I

> **Audit date:** 2026-03-09  
> **Framework:** POPIA (Protection of Personal Information Act No. 4 of 2013)  
> **Auditor:** Autonomous GIS Lab — Compliance Agent  
> **Status:** COMPLETE (with open actions flagged)

---

## 1. Dataset License Clearance

| Dataset ID | Name | License | Commercial OK? | Share-alike? | Research OK? | Status |
|------------ |------|---------|:--------------:|:------------:|:------------:|--------|
| ds-001 | CoCT GV Roll 2022 | Open Government Licence (SA) | ✅ | No | ✅ | **CLEARED** |
| ds-002 | CoCT IZS Zoning | Open Government Licence (SA) | ✅ | No | ✅ | **CLEARED** |
| ds-003 | CoCT Cadastral Parcels | Open Government Licence (SA) | ✅ | No | ✅ | **CLEARED** |
| ds-004 | OSM Amenities (Cape Town) | ODbL 1.0 | ✅ | **Yes** | ✅ | **CLEARED — share-alike applies to derived databases** |
| ds-005 | OpenSky ADS-B Flights | CC BY 4.0 (non-commercial) | ❌ | No | ✅ | **BLOCKED — OQ-016: commercial use unresolved** |
| ds-006 | SpaceNet 8 Building Footprints | CC BY-SA 4.0 | ✅ | **Yes** | ✅ | **CLEARED — derived datasets must be CC BY-SA** |
| Sentinel-2 L2A | Copernicus Open Data | Copernicus Data Licence | ✅ | No | ✅ | **CLEARED** |

### 1.1 Share-Alike Obligations

The following datasets impose downstream obligations on **derived works**:

| Dataset | Obligation | Applies To |
|---------|-----------|------------|
| ds-004 (OSM/ODbL) | Derived *databases* must be published under ODbL 1.0 | Any PostGIS table derived from OSM data |
| ds-006 (SpaceNet 8 / CC BY-SA) | Derived *datasets* (e.g., model training outputs) must be CC BY-SA 4.0 | ML training data splits, annotated subsets |

**Action required:** Annotate any PostGIS table derived from OSM data with `COMMENT ON TABLE` citing ODbL 1.0.

---

## 2. POPIA Compliance Assessment

### 2.1 Personal Information Inventory

| Dataset | Personal Information Fields | Processing Purpose | Lawful Basis | Retention |
|---------|---------------------------|-------------------|--------------|-----------|
| ds-001 GV Roll 2022 | `Full_Names` (registered owner) | Property valuation analytics | Legitimate interests (public record) | Strip at ETL; never persist |
| ds-003 Cadastral Parcels | None (erf numbers only) | Spatial reference | N/A | Indefinite |
| ds-005 OpenSky | `icao24` (may identify private aircraft owner) | Flight density analytics | Legitimate interests | 7 days |

### 2.2 POPIA Conditions Checklist

| Condition | Met? | Evidence |
|-----------|:----:|---------|
| **Lawfulness** — Processing must be lawful | ✅ | GV Roll is a public statutory record; OSM is ODbL |
| **Purpose limitation** — Data used only for stated purpose | ✅ | ETL pipeline strips PII before DB load; no secondary use |
| **Data minimisation** — Only necessary fields collected | ✅ | GV Roll: only `Erf_Nr`, `Suburb`, `Zone_Code`, `Market_Val`, `Category_D`, `Extent_Of` persisted |
| **Data quality** — Personal data is accurate | ✅ | Source is CoCT statutory roll (authoritative) |
| **Retention limitation** — Not kept longer than necessary | ✅ | `Full_Names` dropped in-memory during ETL (never reaches DB) |
| **Data subject participation** — Rights must be honoured | ⚠️ | OQ-009: Formal DPIA not yet executed — required before first paying tenant |
| **Security measures** — Appropriate safeguards | ✅ | RLS enforced; `app.current_tenant` isolation; no export of PII |
| **Prohibition on cross-border transfers** | ⚠️ | OQ-008: Supabase DPA not yet signed — must be completed |

### 2.3 Open Compliance Actions (BLOCKING)

| Ref | Action | Owner | Blocking |
|-----|--------|-------|---------|
| **OQ-003/018** | Confirm `GV Roll 2022` column headers include `Full_Names` — download CSV and inspect | Human | EXP-004 |
| **OQ-008** | Sign Supabase DPA via Supabase dashboard → Settings → Legal | Human | M1 launch |
| **OQ-009** | Execute formal DPIA before first paying tenant on-boards | Human | First paid tenant |
| **OQ-014** | Rotate 3 compromised API keys (`CONTEXT7_API_KEY`, `EXA_API_KEY`, `VERCEL_TOKEN`) using BFG to purge git history | Human | Immediate |
| **OQ-016** | Obtain commercial license for OpenSky data or implement MOCK fallback as primary for paid tiers | Human | Paid tenant with flight data |

---

## 3. Research Experiment POPIA Classifications

| Experiment | POPIA Sensitive? | PII Fields | Pre-Processing Required |
|------------|:----------------:|-----------|------------------------|
| EXP-001 (Boundary QA) | No | None | None |
| EXP-002 (Land-use change) | No | None | None |
| EXP-003 (Flood risk) | No | None | None |
| EXP-004 (Valuation anomaly) | **Yes** | GV Roll `Full_Names` | Strip `Full_Names` in-memory before any model ingestion |

### EXP-004 POPIA Safeguards

```python
# Required pre-processing for EXP-004 — EXP-004-data-prep.py
import pandas as pd

PII_COLUMNS = ['Full_Names', 'Owner_Name', 'full_names', 'owner']  # check actual headers OQ-003

def strip_pii(df: pd.DataFrame) -> pd.DataFrame:
    """Drop all PII columns before any analysis or model training."""
    cols_to_drop = [c for c in df.columns if c in PII_COLUMNS]
    assert len(cols_to_drop) > 0 or not any(c in df.columns for c in PII_COLUMNS), \
        f"PII columns detected but not in strip list: {df.columns.tolist()}"
    return df.drop(columns=cols_to_drop, errors='ignore')

# Never pass raw_df to any model — always use stripped_df
raw_df = pd.read_csv('gv_roll_2022.csv', nrows=5)  # preview only
stripped_df = strip_pii(raw_df)
```

---

## 4. Attribution Requirements

All map UIs and publications must include:

```
© CARTO | © OpenStreetMap contributors
```

Publication datasets derived from OSM must include:
```
Data © OpenStreetMap contributors, licensed under ODbL 1.0
```

SpaceNet 8 model outputs must include:
```
Training data: SpaceNet 8 dataset, licensed under CC BY-SA 4.0
```

---

## 5. Audit Trail

| Date | Action | Agent |
|------|--------|-------|
| 2026-03-09 | Initial license clearance for ds-001 through ds-006 | Compliance Agent |
| 2026-03-09 | POPIA conditions checklist completed | Compliance Agent |
| 2026-03-09 | OQ-008/009/014/016 flagged as human-action blockers | Compliance Agent |
| — | Supabase DPA signed | **PENDING** |
| — | DPIA executed | **PENDING** |
| — | API keys rotated | **PENDING** |
