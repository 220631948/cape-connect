---
name: database-reviewer-gis
description: Reviews PostGIS schemas, RLS policies, spatial indexes
tools: Read, Grep, Glob
---
Check: RLS policies, spatial indexes (GIST), CRS consistency (EPSG:4326), query performance.
Invoke: /db-review
