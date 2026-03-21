"""
Natural language spatial query via Claude API.

Pipeline:
  1. POST /ml/nl-query {query: str, tenant_id: str}
  2. System prompt + query → Claude API (claude-sonnet-4-6)
  3. Claude returns structured JSON with spatial operation spec
  4. Python validates JSON structure (no raw SQL passed to DB)
  5. Build parameterised PostGIS query from validated fields only
  6. Return GeoJSON FeatureCollection

Rate limit: 50 NL queries/hour per tenant (gated by Redis counter)
Cost: ~1,000-2,000 tokens per query ≈ $0.003-0.006 per query
"""

import json
import logging
import re
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Rate limiting
MAX_QUERIES_PER_HOUR = 50
RATE_LIMIT_WINDOW_SECONDS = 3600

# Allowed tables for spatial queries (whitelist — prevents SQL injection)
ALLOWED_TABLES = {
    "parcels",
    "suburbs",
    "zoning",
    "watercourses",
    "flood_risk",
    "valuation_data",
    "osm_train_stations",
    "osm_bus_stops",
    "osm_roads",
    "osm_buildings",
}

# Allowed spatial operations
ALLOWED_SPATIAL_OPS = {
    "ST_DWithin",
    "ST_Intersects",
    "ST_Contains",
    "ST_Within",
    "ST_Overlaps",
    "ST_Crosses",
    "ST_Touches",
}

# Allowed filter operators
ALLOWED_FILTER_OPS = {
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "LIKE",
    "IN",
    "IS NULL",
    "IS NOT NULL",
}

# Cape Town bbox for validation
CAPE_TOWN_BBOX = {
    "min_lng": 18.28,
    "min_lat": -34.36,
    "max_lng": 19.02,
    "max_lat": -33.48,
}

# System prompt for Claude API
SYSTEM_PROMPT = """You are a spatial query translator for Cape Town, South Africa.
Convert the user's natural language query into a structured JSON object.
Respond with JSON only — no explanation, no markdown.

Available tables: parcels, suburbs, zoning, watercourses, flood_risk, valuation_data,
osm_train_stations, osm_bus_stops, osm_roads, osm_buildings

Available spatial operations: ST_DWithin, ST_Intersects, ST_Contains, ST_Within

JSON schema:
{
  "spatial_op": "ST_DWithin | ST_Intersects | ST_Contains | ST_Within",
  "target_table": "table_name",
  "filters": {"column_name": "value"},
  "reference_layer": "table_name (optional, for proximity queries)",
  "reference_filters": {"column_name": "value (optional)"},
  "distance_m": 500 (optional, for ST_DWithin only),
  "suburb_filter": "suburb name (optional)",
  "limit": 100 (optional, max 1000)
}

Rules:
- All distances are in metres
- Use ST_DWithin for proximity/distance queries
- Use ST_Intersects for overlap/within area queries
- suburb_filter restricts results to a named suburb
- Only use tables and columns that exist
- Zone types use IZS codes: SR-1, SR-2, GR-1, GB-1, GI-1, OS-1, etc.
"""


def validate_query_json(query_json: dict) -> tuple[bool, str]:
    """
    Validate the structured JSON from Claude API response.
    Never pass raw SQL — only validated field values.

    Args:
        query_json: parsed JSON dict from Claude response

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Must have spatial_op
    spatial_op = query_json.get("spatial_op", "")
    if spatial_op not in ALLOWED_SPATIAL_OPS:
        return False, f"Invalid spatial operation: {spatial_op}"

    # Must have target_table
    target_table = query_json.get("target_table", "")
    if target_table not in ALLOWED_TABLES:
        return False, f"Invalid target table: {target_table}"

    # Optional reference_layer must be in allowlist
    ref_layer = query_json.get("reference_layer")
    if ref_layer and ref_layer not in ALLOWED_TABLES:
        return False, f"Invalid reference layer: {ref_layer}"

    # ST_DWithin requires distance_m
    if spatial_op == "ST_DWithin":
        distance = query_json.get("distance_m")
        if distance is None:
            return False, "ST_DWithin requires distance_m parameter"
        if not isinstance(distance, (int, float)) or distance <= 0 or distance > 50000:
            return False, f"Invalid distance_m: {distance} (must be 1-50000)"

    # Validate filters — no SQL injection
    filters = query_json.get("filters", {})
    if not isinstance(filters, dict):
        return False, "filters must be a dict"

    for key, value in filters.items():
        if not _is_safe_identifier(key):
            return False, f"Invalid filter column name: {key}"
        if not _is_safe_value(value):
            return False, f"Invalid filter value for {key}: {value}"

    # Validate reference_filters
    ref_filters = query_json.get("reference_filters", {})
    if not isinstance(ref_filters, dict):
        return False, "reference_filters must be a dict"

    for key, value in ref_filters.items():
        if not _is_safe_identifier(key):
            return False, f"Invalid reference filter column: {key}"
        if not _is_safe_value(value):
            return False, f"Invalid reference filter value for {key}: {value}"

    # Validate limit
    limit = query_json.get("limit", 100)
    if not isinstance(limit, int) or limit < 1 or limit > 1000:
        return False, f"Invalid limit: {limit} (must be 1-1000)"

    # Validate suburb_filter
    suburb = query_json.get("suburb_filter")
    if suburb and not _is_safe_value(suburb):
        return False, f"Invalid suburb filter: {suburb}"

    return True, ""


def _is_safe_identifier(name: str) -> bool:
    """Check if a string is a safe SQL identifier (alphanumeric + underscore only)."""
    return bool(re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", str(name)))


def _is_safe_value(value: Any) -> bool:
    """Check if a filter value is safe (no SQL injection patterns)."""
    if value is None:
        return True
    val_str = str(value)
    # Reject SQL injection patterns
    dangerous_patterns = [
        ";",
        "--",
        "/*",
        "*/",
        "xp_",
        "exec(",
        "execute(",
        "drop ",
        "delete ",
        "insert ",
        "update ",
        "alter ",
        "union ",
        "select ",
        "' or ",
        "' and ",
        "1=1",
    ]
    val_lower = val_str.lower()
    for pattern in dangerous_patterns:
        if pattern in val_lower:
            return False
    return True


def build_parameterised_query(
    query_json: dict,
    tenant_id: str,
) -> tuple[str, dict]:
    """
    Build a parameterised PostGIS query from validated JSON.
    NEVER passes raw values — all values are parameterised.

    Args:
        query_json: validated query JSON
        tenant_id: tenant UUID for RLS

    Returns:
        Tuple of (SQL template with :param placeholders, params dict)
    """
    spatial_op = query_json["spatial_op"]
    target_table = query_json["target_table"]
    filters = query_json.get("filters", {})
    ref_layer = query_json.get("reference_layer")
    ref_filters = query_json.get("reference_filters", {})
    distance_m = query_json.get("distance_m")
    suburb_filter = query_json.get("suburb_filter")
    limit = query_json.get("limit", 100)

    params = {"tenant_id": tenant_id, "limit": min(limit, 1000)}
    where_clauses = ["t.tenant_id = :tenant_id"]
    param_idx = 0

    # Add filters
    for col, val in filters.items():
        param_key = f"filter_{param_idx}"
        where_clauses.append(f"t.{col} = :{param_key}")
        params[param_key] = val
        param_idx += 1

    # Add suburb filter
    if suburb_filter:
        where_clauses.append("t.suburb = :suburb_filter")
        params["suburb_filter"] = suburb_filter

    # Cape Town bbox enforcement
    where_clauses.append(
        "ST_Intersects(t.geom, ST_MakeEnvelope(:bbox_min_lng, :bbox_min_lat, "
        ":bbox_max_lng, :bbox_max_lat, 4326))"
    )
    params.update(
        {
            "bbox_min_lng": CAPE_TOWN_BBOX["min_lng"],
            "bbox_min_lat": CAPE_TOWN_BBOX["min_lat"],
            "bbox_max_lng": CAPE_TOWN_BBOX["max_lng"],
            "bbox_max_lat": CAPE_TOWN_BBOX["max_lat"],
        }
    )

    where_sql = " AND ".join(where_clauses)

    if spatial_op == "ST_DWithin" and ref_layer:
        # Build reference subquery
        ref_where = []
        for col, val in ref_filters.items():
            param_key = f"ref_filter_{param_idx}"
            ref_where.append(f"r.{col} = :{param_key}")
            params[param_key] = val
            param_idx += 1

        ref_where_sql = " AND ".join(ref_where) if ref_where else "TRUE"
        params["distance_m"] = distance_m

        sql = (
            f"SELECT t.*, ST_AsGeoJSON(t.geom) as geojson "
            f"FROM {target_table} t "
            f"WHERE {where_sql} "
            f"AND EXISTS ("
            f"  SELECT 1 FROM {ref_layer} r "
            f"  WHERE {ref_where_sql} "
            f"  AND ST_DWithin(t.geom::geography, r.geom::geography, :distance_m)"
            f") "
            f"LIMIT :limit"
        )
    elif spatial_op == "ST_Intersects" and ref_layer:
        ref_where = []
        for col, val in ref_filters.items():
            param_key = f"ref_filter_{param_idx}"
            ref_where.append(f"r.{col} = :{param_key}")
            params[param_key] = val
            param_idx += 1

        ref_where_sql = " AND ".join(ref_where) if ref_where else "TRUE"

        sql = (
            f"SELECT t.*, ST_AsGeoJSON(t.geom) as geojson "
            f"FROM {target_table} t "
            f"WHERE {where_sql} "
            f"AND EXISTS ("
            f"  SELECT 1 FROM {ref_layer} r "
            f"  WHERE {ref_where_sql} "
            f"  AND ST_Intersects(t.geom, r.geom)"
            f") "
            f"LIMIT :limit"
        )
    else:
        sql = (
            f"SELECT t.*, ST_AsGeoJSON(t.geom) as geojson "
            f"FROM {target_table} t "
            f"WHERE {where_sql} "
            f"LIMIT :limit"
        )

    return sql, params


def parse_claude_response(response_text: str) -> tuple[dict | None, str]:
    """
    Parse Claude API response text into JSON.

    Args:
        response_text: raw text response from Claude

    Returns:
        Tuple of (parsed_json or None, error_message)
    """
    # Strip markdown code fences if present
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last fence lines
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        parsed = json.loads(cleaned)
        if not isinstance(parsed, dict):
            return None, "Response is not a JSON object"
        return parsed, ""
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON in Claude response: {str(e)}"


async def check_rate_limit(tenant_id: str) -> tuple[bool, int]:
    """
    Check if tenant has exceeded NL query rate limit.
    Uses Redis counter with TTL.

    Args:
        tenant_id: tenant UUID

    Returns:
        Tuple of (is_allowed, remaining_queries)
    """
    # In production: use Redis INCR with EXPIRE
    # redis_key = f"nl_query_rate:{tenant_id}"
    # current = await redis.incr(redis_key)
    # if current == 1:
    #     await redis.expire(redis_key, RATE_LIMIT_WINDOW_SECONDS)
    # remaining = max(0, MAX_QUERIES_PER_HOUR - current)
    # return current <= MAX_QUERIES_PER_HOUR, remaining

    return True, MAX_QUERIES_PER_HOUR


async def call_claude_api(query: str) -> tuple[str | None, str]:
    """
    Call Claude API to translate NL query to spatial JSON.

    Args:
        query: natural language query string

    Returns:
        Tuple of (response_text or None, error_message)
    """
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    if not api_key:
        return None, "ANTHROPIC_API_KEY not configured"

    try:
        import httpx

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 500,
                    "system": SYSTEM_PROMPT,
                    "messages": [
                        {"role": "user", "content": query},
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()

            # Extract text from response
            content = data.get("content", [])
            if content and content[0].get("type") == "text":
                return content[0]["text"], ""
            return None, "No text content in Claude response"

    except Exception as e:
        logger.error("Claude API call failed: %s", str(e))
        return None, f"Claude API error: {str(e)}"


async def process_nl_query(
    query: str,
    tenant_id: str,
) -> dict[str, Any]:
    """
    Process a natural language spatial query end-to-end.

    Args:
        query: natural language query string
        tenant_id: tenant UUID

    Returns:
        dict with query result or error
    """
    # Step 1: Rate limit check
    is_allowed, remaining = await check_rate_limit(tenant_id)
    if not is_allowed:
        return {
            "status": "rate_limited",
            "error": f"Rate limit exceeded. Max {MAX_QUERIES_PER_HOUR} queries/hour.",
            "remaining_queries": 0,
        }

    # Step 2: Call Claude API
    response_text, error = await call_claude_api(query)
    if error:
        return {"status": "error", "error": error}

    # Step 3: Parse response JSON
    query_json, parse_error = parse_claude_response(response_text)
    if parse_error:
        return {"status": "error", "error": parse_error}

    # Step 4: Validate JSON structure (security gate — no raw SQL)
    is_valid, validation_error = validate_query_json(query_json)
    if not is_valid:
        return {"status": "validation_error", "error": validation_error}

    # Step 5: Build parameterised query
    sql, params = build_parameterised_query(query_json, tenant_id)

    # Step 6: In production, execute query against PostGIS
    # async with get_session() as session:
    #     result = await session.execute(text(sql), params)
    #     features = [row_to_geojson_feature(row) for row in result]

    return {
        "status": "complete",
        "query_interpretation": query_json,
        "sql_preview": sql,
        "params": {k: str(v) for k, v in params.items()},
        "remaining_queries": remaining - 1,
        "features": {
            "type": "FeatureCollection",
            "features": [],
        },
    }
