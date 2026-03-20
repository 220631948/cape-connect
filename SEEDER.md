# CapeTown GIS Hub — Seeding Strategy & Data

This document provides the SQL seeding commands to populate the CapeTown GIS Hub with multi-tenant data, specialized roles, and initial spatial entities.

## 1. Core Tenants
```sql
-- Insert primary tenants
INSERT INTO tenants (id, name, slug, settings)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'City of Cape Town', 'capetown', '{"primary_color": "#00ABFF", "logo_url": "/assets/logos/coct.png"}'),
  ('661f9511-f30c-52e5-b827-557766551111', 'Western Cape Government', 'wcg', '{"primary_color": "#FF3B30", "logo_url": "/assets/logos/wcg.png"}')
ON CONFLICT (id) DO NOTHING;
```

## 2. User Roles & Profiles
Below are the seeds for the 4 priority domains (Emergency, Environmental, Public, Farmer) plus administrative roles.

```sql
-- Role: Emergency Responder (D2)
-- Email: emergency@capegis.gov.za
INSERT INTO profiles (id, tenant_id, full_name, role, domain_mode, metadata)
VALUES (
  'd2d2d2d2-d2d2-4d2d-8d2d-d2d2d2d2d2d2', 
  '550e8400-e29b-41d4-a716-446655440000', 
  'Chief Fire Warden', 
  'emergency_responder', 
  'emergency',
  '{"department": "Fire & Rescue", "clearance": "Top Secret"}'
);

-- Role: Environmental Scientist (D4)
-- Email: eco@capegis.gov.za
INSERT INTO profiles (id, tenant_id, full_name, role, domain_mode, metadata)
VALUES (
  'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', 
  '550e8400-e29b-41d4-a716-446655440000', 
  'Dr. Green Earth', 
  'env_scientist', 
  'environmental',
  '{"focus": "NDVI / Water Quality", "lab": "WCG Ecology Hub"}'
);

-- Role: Public Citizen (D10)
-- Email: citizen@capegis.gov.za
INSERT INTO profiles (id, tenant_id, full_name, role, domain_mode, metadata)
VALUES (
  'd10d10d10-d10d-4d10-8d10-d10d10d10d10', 
  '550e8400-e29b-41d4-a716-446655440000', 
  'Rando User', 
  'citizen', 
  'citizens',
  '{"suburb": "Woodstock", "interests": ["zoning", "parks"]}'
);

-- Role: Farmer (D11)
-- Email: farmer@capegis.gov.za
INSERT INTO profiles (id, tenant_id, full_name, role, domain_mode, metadata)
VALUES (
  'd11d11d11-d11d-4d11-8d11-d11d11d11d11', 
  '661f9511-f30c-52e5-b827-557766551111', 
  'Oom Piet', 
  'farmer', 
  'farmers',
  '{"farm_id": "FARM-STELLIES-01", "crop": "Wine Grapes"}'
);
```

## 3. Spatial Entities (PostGIS)
Example data for FIRMS hotspots and NDVI zones.

```sql
-- Insert simulated fire hotspots (Emergency Domain)
INSERT INTO spatial_entities (name, type, geom, properties)
VALUES 
  ('Table Mountain Fire 2026', 'fire_hotspot', ST_SetSRID(ST_Point(18.4241, -33.9249), 4326), '{"severity": "high", "wind_dir": "SE"}'::jsonb),
  ('Signal Hill Smoke Trace', 'fire_hotspot', ST_SetSRID(ST_Point(18.4021, -33.9189), 4326), '{"severity": "low", "wind_dir": "NW"}'::jsonb);

-- Insert NDVI baseline records (Environmental Domain)
INSERT INTO sensor_data (entity_id, type, value, recorded_at, geom)
SELECT 
  gen_random_uuid(), 
  'ndvi', 
  0.65, 
  NOW(), 
  ST_SetSRID(ST_Buffer(ST_Point(18.8652, -33.9321), 0.01), 4326) -- Stellenbosch Farm Area
;
```

## 4. How to Apply
1. Connect to your Supabase PostgreSQL instance: `psql -h db.[PROJECT_ID].supabase.co -U postgres`
2. Execute the blocks above in sequence.
3. Ensure RLS (Row Level Security) is active so users only see their tenant data.
