# ETL Pipeline: General Valuation (GV) Roll Ingestion


> **TL;DR:** The GV Roll (~830K rows) is ingested via a Python ETL pipeline: download CSV → chunk-process with pandas → strip PII (`Full_Names` column — POPIA critical) → load to staging table → transfer to production `valuation_data`. GV Roll 2022 is the approved source (CLAUDE.md Rule 8 — no Lightstone). See `docs/API_STATUS.md` for endpoint status.

**Document version:** 1.0
**Date:** 2026-03-01
**Status:** AUTHORITATIVE

## 1. Overview
The City of Cape Town General Valuation (GV) Roll is published as a large CSV file (~830,000 rows). It contains property valuations critical for the platform, but it is known to have formatting issues and crucially, the 2024 GV Roll contains Personally Identifiable Information (PII) in the `Full_Names` column.

This document outlines the strict ETL (Extract, Transform, Load) pipeline necessary to safely ingest this data into our PostGIS database while remaining POPIA compliant and performant.

## 2. Tooling
- **Language:** Python 3
- **Libraries:** `pandas` / `geopandas` for chunked CSV processing and validation, `psycopg2` or `SQLAlchemy` for database connections.
- **Database:** PostgreSQL with PostGIS extension.

## 3. Pipeline Architecture

### Phase 1: Extract (Download & Local Staging)
1. **Download:** The CSV is downloaded manually from `odp.capetown.gov.za` or retrieved programmatically from the ArcGIS FeatureLayer if possible (though bulk CSV is preferred for large datasets).
2. **Chunking:** Given the file size, the Python script reads the CSV in chunks (e.g., 50,000 rows at a time) to prevent memory exhaustion.

### Phase 2: Transform (Sanitization & Validation)
1. **PII Stripping (POPIA Compliance - CRITICAL):** The `Full_Names` column (and any other potential PII columns like ID numbers if present) MUST be explicitly dropped from the DataFrame in memory before it ever reaches the database.
2. **Data Type Casting:** Ensure numeric fields (e.g., `Market_val`, `Extent_of`) are parsed as numbers. Address NaN or Null values.
3. **Geometry Validation (If applicable):** If the CSV contains geometries, they must be validated. If it relies on a join with the `cadastral_parcels` table using `Erf_Nr`, ensure the join key is properly formatted (e.g., stripped of leading/trailing whitespace).

### Phase 3: Load (Database Ingestion)
1. **Staging Table:**
   - Load the cleaned, chunked DataFrames into a temporary, unindexed PostgreSQL staging table (e.g., `gv_roll_staging`).
   - *Why unindexed?* Bulk inserts into an unindexed table are significantly faster.
2. **Data Integrity Checks:**
   - Run SQL queries to verify row counts, check for nulls in required fields, and ensure no PII columns exist in the staging table.
3. **Production Transfer:**
   - Perform an `INSERT INTO ... SELECT ...` from the staging table to the production `valuation_data` table.
   - The production table will have composite indexes (e.g., on `tenant_id` and geometry) to support RLS.
4. **Cleanup:**
   - `TRUNCATE` or `DROP` the staging table.

## 4. Execution Example (Pseudo-code)

```python
import pandas as pd
import psycopg2
from sqlalchemy import create_engine

DB_URL = "postgresql://user:pass@host:port/dbname"
engine = create_engine(DB_URL)

chunk_size = 50000
csv_file = "General_Valuation_Roll_2024.csv"

# 1. Truncate staging table
with engine.connect() as con:
    con.execute("TRUNCATE TABLE gv_roll_staging;")

# 2. Process in chunks
for chunk in pd.read_csv(csv_file, chunksize=chunk_size):
    # POPIA Compliance: Strip PII
    if 'Full_Names' in chunk.columns:
        chunk = chunk.drop(columns=['Full_Names'])
    
    # ... additional cleaning ...

    # Load to unindexed staging table
    chunk.to_sql('gv_roll_staging', engine, if_exists='append', index=False)

# 3. Transfer to production and create any required links to parcels
with engine.connect() as con:
    con.execute("""
        INSERT INTO valuation_data (erf_nr, market_val, category, gv_year)
        SELECT erf_nr, market_val, category_d, 2024
        FROM gv_roll_staging
        ON CONFLICT (erf_nr) DO UPDATE SET market_val = EXCLUDED.market_val;
    """)
    
    con.execute("DROP TABLE gv_roll_staging;")
```

## 5. Frequency
This ETL process is run manually whenever a new GV Roll or supplementary roll is published by the City of Cape Town (typically every 3-4 years, with supplementary rolls annually).