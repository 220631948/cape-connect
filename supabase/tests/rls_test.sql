-- ==========================================
-- rls_test.sql
-- RLS Isolation Verification Suite
-- ==========================================

-- Test 1: Alpha Admin can see Alpha data but NOT Bravo data
BEGIN;
    -- Simulate Alpha Tenant Session
    SET LOCAL app.current_tenant = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    SET LOCAL app.current_role = 'TENANT_ADMIN';

    -- Should be 2 properties for Alpha
    DO $$ 
    BEGIN 
        IF (SELECT count(*) FROM properties) != 2 THEN
            RAISE EXCEPTION 'RLS Failure: Alpha Admin saw % properties, expected 2', (SELECT count(*) FROM properties);
        END IF;
    END $$;

    -- Should NOT see Bravo property (10 Dorp Street)
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM properties WHERE address LIKE '%Dorp Street%') THEN
            RAISE EXCEPTION 'RLS Failure: Alpha Admin saw Bravo data';
        END IF;
    END $$;
ROLLBACK;

-- Test 2: Bravo Admin can see Bravo data but NOT Alpha data
BEGIN;
    -- Simulate Bravo Tenant Session
    SET LOCAL app.current_tenant = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    SET LOCAL app.current_role = 'TENANT_ADMIN';

    -- Should be 1 property for Bravo
    DO $$ 
    BEGIN 
        IF (SELECT count(*) FROM properties) != 1 THEN
            RAISE EXCEPTION 'RLS Failure: Bravo Admin saw % properties, expected 1', (SELECT count(*) FROM properties);
        END IF;
    END $$;
ROLLBACK;

-- Test 3: Guest/Null tenant sees NOTHING
BEGIN;
    SET LOCAL app.current_tenant = '00000000-0000-0000-0000-000000000000';
    
    DO $$
    BEGIN
        IF (SELECT count(*) FROM properties) != 0 THEN
            RAISE EXCEPTION 'RLS Failure: Unauthenticated user saw data';
        END IF;
    END $$;
ROLLBACK;

SELECT '✅ All RLS Tests Passed' as result;
