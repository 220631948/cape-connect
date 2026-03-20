---
description: Scaffold a new Supabase migration file with RLS and POPIA annotations.
name: new-migration
tools: ['editFiles']
---

Create a new Supabase migration file following the project conventions:

1. **File name:** `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. **Include:**
   - `CREATE TABLE` with all columns, types, and constraints
   - `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`
   - RLS policies for tenant isolation using `current_setting('app.current_tenant')`
   - GiST indexes on any geometry columns
   - POPIA SQL comment if the table stores personal data
3. **Coordinate system:** All geometry columns must use EPSG:4326

Ask the user for: table name, columns, and whether it stores personal data.
