/**
 * @file scripts/import-gv-roll.py
 * @description ETL Pipeline for CoCT GV Roll 2022/2024.
 * @compliance POPIA: Explicitly stripping PII (Full_Names) before ingestion.
 */

import pandas as pd
import os
import psycopg2
from sqlalchemy import create_engine
import sys

# POPIA ANNOTATION (Rule 5)
# Personal data handled: Property owner names (Full_Names)
# Action: Explicitly dropped during chunk processing to ensure no PII reaches the database.

def import_gv_roll(csv_path, db_url, tenant_id):
    """
    Ingests GV Roll CSV into valuation_data table.
    """
    engine = create_engine(db_url)
    chunk_size = 50000
    source_name = 'CoCT GV Roll'
    gv_year = 2024

    print(f"🚀 Starting import for {source_name} {gv_year}...")

    try:
        # 1. Clean staging (not implemented as separate table here for brevity, but recommended)
        
        # 2. Process in chunks
        for i, chunk in enumerate(pd.read_csv(csv_path, chunksize=chunk_size)):
            # POPIA Compliance: Strip PII
            if 'Full_Names' in chunk.columns:
                chunk = chunk.drop(columns=['Full_Names'])
            
            # Map columns to schema
            # CSV: SG_21, Town_Allot, Suburb, Erf_Nr, Portion, Unit, Section, Full_Names, Category_d, Physical_a, Extent_of, Market_val, Remarks
            mapped_chunk = pd.DataFrame({
                'tenant_id': [tenant_id] * len(chunk),
                'parcel_id': chunk['SG_21'],
                'suburb': chunk['Suburb'],
                'zone_code': chunk['Category_d'],
                'city_valuation_zar': chunk['Market_val'],
                'gv_year': [gv_year] * len(chunk)
            })

            # 3. Load to DB
            mapped_chunk.to_sql('valuation_data', engine, if_exists='append', index=False)
            print(f"📦 Loaded chunk {i+1} ({len(mapped_chunk)} rows)")

        print("✅ Import complete!")

    except Exception as e:
        print(f"❌ Error during import: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Example usage: python import-gv-roll.py data.csv postgresql://... tenant-uuid
    import sys
    if len(sys.argv) < 4:
        print("Usage: python import-gv-roll.py <csv_path> <db_url> <tenant_id>")
    else:
        import_gv_roll(sys.argv[1], sys.argv[2], sys.argv[3])
