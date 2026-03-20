-- ==========================================
-- 20260310020000_property_search.sql
-- Full-Text Search for Properties (M7)
-- Supports high-fidelity address/ERF lookup.
-- ==========================================

-- 1. Add tsvector column for address search
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS tsv_address tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(address, ''))) STORED;

-- 2. Create GIN index for search performance
CREATE INDEX IF NOT EXISTS idx_properties_tsv_address ON public.properties USING GIN (tsv_address);

-- 3. Search RPC Function
-- Supports address and parcel_id (ERF) lookup within tenant scope.
CREATE OR REPLACE FUNCTION public.search_properties(query_text TEXT)
RETURNS TABLE (
    id UUID,
    address TEXT,
    parcel_id TEXT,
    geometry GEOMETRY,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.address, 
        (p.valuation_data->>'parcel_id')::text as parcel_id,
        p.geometry,
        ts_rank(p.tsv_address, plainto_tsquery('english', query_text)) as rank
    FROM public.properties p
    WHERE 
        (
            p.tsv_address @@ plainto_tsquery('english', query_text)
            OR (p.valuation_data->>'parcel_id') ILIKE '%' || query_text || '%'
        )
        AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    ORDER BY rank DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POPIA ANNOTATION (Rule 5)
COMMENT ON FUNCTION public.search_properties IS 'PII: Search queries are tenant-scoped. Purpose: Property discovery navigation.';
