-- ==========================================
-- 20260310000000_seed_data.sql
-- Multi-tenant Seed Data for Testing RLS and RBAC
-- ==========================================

BEGIN;

-- 1. Create Tenants
INSERT INTO tenants (id, slug, name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'alpha', 'Alpha GIS Solutions'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'bravo', 'Bravo Spatial Intelligence');

-- 2. Mock Auth Users (Simulating Supabase Auth)
-- Note: In a live environment, these are created via Supabase Auth API
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'admin@alpha.com', '{"full_name": "Alpha Admin"}'),
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'viewer@alpha.com', '{"full_name": "Alpha Viewer"}'),
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'admin@bravo.com', '{"full_name": "Bravo Admin"}')
ON CONFLICT (id) DO NOTHING;

-- 3. Profiles (Link Users to Tenants and Roles)
INSERT INTO profiles (id, tenant_id, email, full_name, role, popia_consent) VALUES
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@alpha.com', 'Alpha Admin', 'TENANT_ADMIN', TRUE),
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'viewer@alpha.com', 'Alpha Viewer', 'VIEWER', TRUE),
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'admin@bravo.com', 'Bravo Admin', 'TENANT_ADMIN', TRUE);

-- 4. Sample Properties (Tenant-Isolated)
INSERT INTO properties (tenant_id, address, geometry, valuation_data) VALUES
-- Alpha Properties (Cape Town CBD)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '123 Bree Street, Cape Town', ST_SetSRID(ST_Point(18.418, -33.922), 4326), '{"valuation": 5000000}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '45 Long Street, Cape Town', ST_SetSRID(ST_Point(18.420, -33.924), 4326), '{"valuation": 3500000}'),
-- Bravo Properties (Stellenbosch)
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '10 Dorp Street, Stellenbosch', ST_SetSRID(ST_Point(18.864, -33.937), 4326), '{"valuation": 8000000}');

-- 5. Sample Zones
INSERT INTO zones (tenant_id, code, description, geometry) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MU2', 'Mixed Use 2', ST_GeomFromText('MULTIPOLYGON(((18.41 -33.92, 18.42 -33.92, 18.42 -33.93, 18.41 -33.93, 18.41 -33.92)))', 4326)),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SR1', 'Single Residential 1', ST_GeomFromText('MULTIPOLYGON(((18.86 -33.93, 18.87 -33.93, 18.87 -33.94, 18.86 -33.94, 18.86 -33.93)))', 4326));

COMMIT;
