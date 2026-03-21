/**
 * POPIA ANNOTATION
 * Personal data handled: None — queries are tenant-scoped spatial tools
 * Purpose: GIS Copilot natural-language → PostGIS query routing
 * Lawful basis: N/A — Not personal data
 * Retention: Response only (no query logging unless audit is enabled)
 * POPIA risk level: LOW
 * Review date: 2026-06-01
 */

/**
 * @file src/app/api/copilot/spatial/route.ts
 * @description GIS Copilot Phase 1 — Natural language → PostGIS query router.
 *
 * Tools supported:
 *  1. geocode      — "Where is [address]?"
 *  2. proximity    — "What's within [N]m of [address/coords]?"
 *  3. area_search  — "Show me all properties in [Woodstock / suburb]"
 *  4. details      — "Details for ERF [12345]"
 *  5. distance     — "How far is X from Y?"
 *  6. count        — "How many properties in Ward 57?"
 *
 * Intent is classified via simple keyword matching (no LLM required for Phase 1).
 * Phase 2 will use an LLM (Gemini) for more complex intents.
 */

import {NextResponse} from 'next/server';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import {validateBody} from '@/lib/validation';
import {copilotSpatialSchema} from '@/lib/validation/schemas/copilot';

// ─── Bounding Box Enforcement: Western Cape ─────────────────────────────────
// All coordinates extracted from queries must be within this bbox per CLAUDE.md
const WESTERN_CAPE_BBOX = {
    minLng: 17.5, maxLng: 22.5,
    minLat: -35.5, maxLat: -28.5
};

function isInWesternCape(lng: number, lat: number): boolean {
    return lng >= WESTERN_CAPE_BBOX.minLng && lng <= WESTERN_CAPE_BBOX.maxLng &&
        lat >= WESTERN_CAPE_BBOX.minLat && lat <= WESTERN_CAPE_BBOX.maxLat;
}

// ─── Intent Classifier ───────────────────────────────────────────────────────
type ToolName = 'geocode' | 'proximity' | 'area_search' | 'details' | 'distance' | 'count' | 'unknown';

interface ParsedIntent {
    tool: ToolName;
    params: Record<string, unknown>;
}

function classifyIntent(query: string): ParsedIntent {
    const q = query.toLowerCase().trim();

    // Tool 6: count
    if (/how many|count\s+(of\s+)?(all\s+)?propert/i.test(q)) {
        const areaMatch = q.match(/in\s+([\w\s]+?)(?:\s*\?|$)/i);
        return {tool: 'count', params: {area_name: areaMatch?.[1]?.trim() ?? ''}};
    }

    // Tool 5: distance
    if (/how far|distance (from|between)|km between/i.test(q)) {
        const fromMatch = q.match(/from\s+["']?([^"']+?)["']?\s+to\s+/i);
        const toMatch = q.match(/to\s+["']?([^"']+?)["']?\s*(?:\?|$)/i);
        return {
            tool: 'distance',
            params: {address_a: fromMatch?.[1]?.trim() ?? '', address_b: toMatch?.[1]?.trim() ?? ''}
        };
    }

    // Tool 2: proximity
    if (/within\s+\d+\s*(m|meter|km)|near(by)?|closest|radius/i.test(q)) {
        const radiusMatch = q.match(/(\d+)\s*(m|km)/i);
        const radiusM = radiusMatch
            ? (radiusMatch[2]?.toLowerCase() === 'km' ? +radiusMatch[1] * 1000 : +radiusMatch[1])
            : 500;
        // Try to extract coords or a location name
        const coordMatch = q.match(/([-−]?\d+\.?\d*)[,\s]+([-−]?\d+\.?\d*)/);
        if (coordMatch) {
            const lng = parseFloat(coordMatch[1]);
            const lat = parseFloat(coordMatch[2]);
            if (isInWesternCape(lng, lat)) {
                return {tool: 'proximity', params: {lng, lat, radius_m: radiusM}};
            }
        }
        // Fallback: use Cape Town CBD as default center
        return {tool: 'proximity', params: {lng: 18.4241, lat: -33.9249, radius_m: radiusM}};
    }

    // Tool 4: details / ERF lookup
    if (/erf|parcel|details? for|tell me about|more about/i.test(q)) {
        const erfMatch = q.match(/erf\s+(\w+)/i) || q.match(/parcel[_ ]id[:\s]+(\w+)/i);
        const addressMatch = q.match(/(?:details? for|about)\s+["']?(.+?)["']?\s*(?:\?|$)/i);
        return {
            tool: 'details',
            params: {erf_or_address: erfMatch?.[1] ?? addressMatch?.[1]?.trim() ?? ''}
        };
    }

    // Tool 3: area search — "properties in Woodstock"
    if (/(?:in|inside|within|across)\s+([\w\s]+?)(?:\?|$)/i.test(q) &&
        /propert|plot|parcel|land|building/i.test(q)) {
        const areaMatch = q.match(/(?:in|inside|within|across)\s+([\w\s]+?)(?:\?|$)/i);
        return {tool: 'area_search', params: {area_name: areaMatch?.[1]?.trim() ?? ''}};
    }

    // Tool 1: geocode — "where is [X]?" / "find [X]"
    if (/where (is|can i find)|find|locate|show me/i.test(q)) {
        const queryMatch = q.match(/(?:where is|find|locate|show me)\s+(.+?)(?:\?|$)/i);
        return {tool: 'geocode', params: {query_text: queryMatch?.[1]?.trim() ?? q}};
    }

    return {tool: 'unknown', params: {}};
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
    try {
        const validation = await validateBody(request, copilotSpatialSchema);
        if (!validation.success) {
            return validation.response;
        }
        const {query, context} = validation.data;

        const intent = classifyIntent(query);
        const supabase = await createServerSupabaseClient();
        let data: unknown = null;
        let error: string | null = null;
        let explanation = '';

        switch (intent.tool) {
            case 'geocode': {
                const {data: rows, error: err} = await supabase.rpc('search_properties', {
                    query_text: intent.params.query_text as string
                });
                data = rows;
                error = err?.message ?? null;
                explanation = `Found ${rows?.length ?? 0} properties matching "${intent.params.query_text}".`;
                break;
            }

            case 'proximity': {
                const {data: rows, error: err} = await supabase.rpc('copilot_proximity', {
                    lng: (context?.lng ?? intent.params.lng) as number,
                    lat: (context?.lat ?? intent.params.lat) as number,
                    radius_m: intent.params.radius_m as number,
                    limit_n: 10
                });
                data = rows;
                error = err?.message ?? null;
                explanation = `Found ${rows?.length ?? 0} properties within ${intent.params.radius_m}m.`;
                break;
            }

            case 'area_search': {
                const {data: rows, error: err} = await supabase.rpc('copilot_area_search', {
                    area_name: intent.params.area_name as string,
                    limit_n: 20
                });
                data = rows;
                error = err?.message ?? null;
                explanation = `Found ${rows?.length ?? 0} properties in "${intent.params.area_name}".`;
                break;
            }

            case 'details': {
                const {data: rows, error: err} = await supabase.rpc('copilot_property_details', {
                    erf_or_address: intent.params.erf_or_address as string
                });
                data = rows?.[0] ?? null;
                error = err?.message ?? null;
                explanation = data
                    ? `Details for "${(data as any).address}".`
                    : `No property found for "${intent.params.erf_or_address}".`;
                break;
            }

            case 'distance': {
                const {data: rows, error: err} = await supabase.rpc('copilot_distance', {
                    address_a: intent.params.address_a as string,
                    address_b: intent.params.address_b as string
                });
                data = rows?.[0] ?? null;
                error = err?.message ?? null;
                explanation = data
                    ? `Distance: ${((data as any).distance_km ?? 0).toFixed(2)} km.`
                    : 'Could not find one or both addresses.';
                break;
            }

            case 'count': {
                const {data: rows, error: err} = await supabase.rpc('copilot_count', {
                    area_name: intent.params.area_name as string
                });
                data = rows?.[0] ?? null;
                error = err?.message ?? null;
                explanation = data
                    ? `There are ${(data as any).property_count ?? 0} properties in "${intent.params.area_name}".`
                    : 'Could not find that area.';
                break;
            }

            default:
                error = "I didn't understand that query. Try: 'What's near City Hall?', 'Properties in Woodstock', or 'Distance from X to Y'.";
                break;
        }

        return NextResponse.json({
            query,
            tool: intent.tool,
            params: intent.params,
            explanation,
            data: error ? null : data,
            error,
            source: 'GIS Copilot Phase 1 (PostGIS)',
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('[GIS Copilot] Internal Error:', err);
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
    }
}
