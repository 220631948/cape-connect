"""
Spatial analysis service — PostGIS-backed trading bay suitability,
intersection, buffer, and proximity scoring.

All geometry stored as EPSG:4326. All distance queries use geography cast
for metre-based calculations (GOTCHA-DB-003).

Cape Town bounding box enforced on all queries:
  [18.28, -34.36, 19.02, -33.48]
"""

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import quoted_name

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Cape Town bounding box [min_lon, min_lat, max_lon, max_lat]
CT_BBOX = (18.28, -34.36, 19.02, -33.48)

# Watercourse buffer — OQ-NEW-B: default from National Water Act (10 m).
# PENDING VERIFICATION — see docs/OPEN_QUESTIONS.md
# Do NOT change without verifying against CoCT Informal Trading By-law.
WATERCOURSE_BUFFER_M: float = 10.0

# Slope threshold for accessibility (%)
SLOPE_THRESHOLD_PCT: float = 2.0

# Suitability score weights (sum = 100)
WEIGHT_WATERCOURSE: float = 30.0
WEIGHT_FLOOD_RISK: float = 25.0
WEIGHT_SLOPE: float = 15.0
WEIGHT_HERITAGE: float = 20.0
WEIGHT_BAY_SPACING: float = 10.0

# Minimum spacing between existing trading bays (metres)
MIN_BAY_SPACING_M: float = 50.0


def _validate_bbox(geojson: dict) -> None:
    """Raise ValueError if the GeoJSON geometry falls outside Cape Town bbox."""
    coords = _extract_all_coords(geojson)
    min_lon, min_lat, max_lon, max_lat = CT_BBOX
    for lon, lat in coords:
        if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
            raise ValueError(
                f"Coordinate ({lon}, {lat}) is outside the Cape Town "
                f"bounding box [{min_lon}, {min_lat}, {max_lon}, {max_lat}]."
            )


def _extract_all_coords(geojson: dict) -> list[tuple[float, float]]:
    """Recursively extract (lon, lat) pairs from a GeoJSON geometry."""
    geom_type = geojson.get("type", "")
    coordinates = geojson.get("coordinates", [])

    if geom_type == "Point":
        return [(coordinates[0], coordinates[1])]
    elif geom_type in ("MultiPoint", "LineString"):
        return [(c[0], c[1]) for c in coordinates]
    elif geom_type in ("MultiLineString", "Polygon"):
        return [(c[0], c[1]) for ring in coordinates for c in ring]
    elif geom_type == "MultiPolygon":
        return [
            (c[0], c[1]) for polygon in coordinates for ring in polygon for c in ring
        ]
    elif geom_type == "GeometryCollection":
        out: list[tuple[float, float]] = []
        for geom in geojson.get("geometries", []):
            out.extend(_extract_all_coords(geom))
        return out
    return []


def _geojson_to_sql_geom(geojson: dict) -> str:
    """Return a SQL expression that constructs an EPSG:4326 geometry from GeoJSON."""
    import json

    return f"ST_SetSRID(ST_GeomFromGeoJSON('{json.dumps(geojson)}'), 4326)"


# ---------------------------------------------------------------------------
# Trading Bay Suitability
# ---------------------------------------------------------------------------


async def trading_bay_suitability(
    polygon_geojson: dict,
    tenant_id: str,
    session: AsyncSession,
) -> dict[str, Any]:
    """
    Multi-criteria overlay score for a candidate trading bay polygon.

    Returns:
        {
            score: 0-100,
            criteria: { ... },
            verdict: "SUITABLE" | "CONDITIONAL" | "UNSUITABLE",
            blocking_constraints: [str],
        }
    """
    _validate_bbox(polygon_geojson)

    import json

    geojson_str = json.dumps(polygon_geojson)

    # --- 1. Watercourse distance (geography cast for metres — GOTCHA-DB-003) ---
    wc_result = await session.execute(
        text("""
            SELECT COALESCE(
                MIN(ST_Distance(
                    ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                    w.geom::geography
                )),
                999999.0
            ) AS min_distance_m
            FROM watercourses w
            WHERE w.tenant_id = :tenant_id
              AND ST_DWithin(
                  ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                  w.geom::geography,
                  1000
              )
        """),
        {"geojson": geojson_str, "tenant_id": tenant_id},
    )
    watercourse_distance_m = float(wc_result.scalar_one())

    # --- 2. Flood risk class ---
    flood_result = await session.execute(
        text("""
            SELECT COALESCE(f.risk_class, 'Low') AS risk_class
            FROM flood_risk_zones f
            WHERE f.tenant_id = :tenant_id
              AND ST_Intersects(
                  f.geom,
                  ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
              )
            ORDER BY
                CASE f.risk_class
                    WHEN 'Very High' THEN 4
                    WHEN 'High' THEN 3
                    WHEN 'Medium' THEN 2
                    ELSE 1
                END DESC
            LIMIT 1
        """),
        {"geojson": geojson_str, "tenant_id": tenant_id},
    )
    row = flood_result.first()
    flood_risk_class = row[0] if row else "Low"

    # --- 3. Slope (from DEM-derived slope layer) ---
    slope_result = await session.execute(
        text("""
            SELECT COALESCE(AVG(s.slope_pct), 0.0) AS avg_slope
            FROM slope_data s
            WHERE s.tenant_id = :tenant_id
              AND ST_Intersects(
                  s.geom,
                  ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
              )
        """),
        {"geojson": geojson_str, "tenant_id": tenant_id},
    )
    slope_pct = float(slope_result.scalar_one())

    # --- 4. Heritage overlay ---
    heritage_result = await session.execute(
        text("""
            SELECT EXISTS(
                SELECT 1 FROM heritage_sites h
                WHERE h.tenant_id = :tenant_id
                  AND ST_Intersects(
                      h.geom,
                      ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
                  )
            ) AS has_overlap
        """),
        {"geojson": geojson_str, "tenant_id": tenant_id},
    )
    heritage_overlap = bool(heritage_result.scalar_one())

    # --- 5. Existing bay proximity ---
    bay_result = await session.execute(
        text("""
            SELECT COALESCE(
                MIN(ST_Distance(
                    ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                    b.geom::geography
                )),
                999999.0
            ) AS min_distance_m
            FROM trading_bays b
            WHERE b.tenant_id = :tenant_id
              AND ST_DWithin(
                  ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                  b.geom::geography,
                  2000
              )
        """),
        {"geojson": geojson_str, "tenant_id": tenant_id},
    )
    existing_bay_proximity_m = float(bay_result.scalar_one())

    # --- Scoring ---
    gradient_accessible = slope_pct < SLOPE_THRESHOLD_PCT
    blocking: list[str] = []

    # Watercourse score
    if watercourse_distance_m < WATERCOURSE_BUFFER_M:
        wc_score = 0.0
        blocking.append(
            f"Within {WATERCOURSE_BUFFER_M}m watercourse buffer "
            f"(distance: {watercourse_distance_m:.1f}m)"
        )
    else:
        wc_score = min(watercourse_distance_m / 100.0, 1.0) * WEIGHT_WATERCOURSE

    # Flood risk score
    flood_scores = {"Low": 1.0, "Medium": 0.6, "High": 0.2, "Very High": 0.0}
    flood_factor = flood_scores.get(flood_risk_class, 0.5)
    flood_score = flood_factor * WEIGHT_FLOOD_RISK
    if flood_risk_class in ("High", "Very High"):
        blocking.append(f"Flood risk: {flood_risk_class}")

    # Slope score
    if gradient_accessible:
        slope_score = WEIGHT_SLOPE
    else:
        slope_score = max(0.0, (1.0 - slope_pct / 10.0)) * WEIGHT_SLOPE
        blocking.append(
            f"Slope {slope_pct:.1f}% exceeds {SLOPE_THRESHOLD_PCT}% threshold"
        )

    # Heritage score
    if heritage_overlap:
        heritage_score = 0.0
        blocking.append("Overlaps heritage site — disqualifying constraint")
    else:
        heritage_score = WEIGHT_HERITAGE

    # Bay spacing score
    if existing_bay_proximity_m < MIN_BAY_SPACING_M:
        bay_score = 0.0
        blocking.append(
            f"Too close to existing bay ({existing_bay_proximity_m:.1f}m, "
            f"minimum: {MIN_BAY_SPACING_M}m)"
        )
    else:
        bay_score = min(existing_bay_proximity_m / 500.0, 1.0) * WEIGHT_BAY_SPACING

    total_score = round(
        wc_score + flood_score + slope_score + heritage_score + bay_score, 1
    )
    total_score = max(0, min(100, total_score))

    # Verdict
    if blocking:
        verdict = "UNSUITABLE"
    elif total_score >= 70:
        verdict = "SUITABLE"
    else:
        verdict = "CONDITIONAL"

    return {
        "score": total_score,
        "criteria": {
            "watercourse_distance_m": round(watercourse_distance_m, 2),
            "slope_pct": round(slope_pct, 2),
            "flood_risk_class": flood_risk_class,
            "heritage_overlap": heritage_overlap,
            "existing_bay_proximity_m": round(existing_bay_proximity_m, 2),
            "gradient_accessible": gradient_accessible,
        },
        "verdict": verdict,
        "blocking_constraints": blocking,
    }


# ---------------------------------------------------------------------------
# Intersection Query
# ---------------------------------------------------------------------------


async def intersection_query(
    polygon_geojson: dict,
    layer_name: str,
    tenant_id: str,
    session: AsyncSession,
) -> dict[str, Any]:
    """Return features from `layer_name` that intersect the given polygon as GeoJSON."""
    _validate_bbox(polygon_geojson)

    import json

    geojson_str = json.dumps(polygon_geojson)

    # Parameterised layer name via allowlist to prevent SQL injection
    allowed_layers = {
        "parcels",
        "suburbs",
        "watercourses",
        "flood_risk_zones",
        "heritage_sites",
        "trading_bays",
        "slope_data",
        "zoning",
    }
    if layer_name not in allowed_layers:
        raise ValueError(f"Layer '{layer_name}' is not in the allowed layer list.")

    # Map external layer names to fixed, hard-coded table identifiers.
    # This ensures that only known-safe identifiers are ever interpolated
    # into the SQL text, breaking the taint flow from user input.
    layer_to_table = {
        "parcels": "parcels",
        "suburbs": "suburbs",
        "watercourses": "watercourses",
        "flood_risk_zones": "flood_risk_zones",
        "heritage_sites": "heritage_sites",
        "trading_bays": "trading_bays",
        "slope_data": "slope_data",
        "zoning": "zoning",
    }
    table_name = layer_to_table[layer_name]

    result = await session.execute(
        text(
            f"""
            SELECT
                ST_AsGeoJSON(t.geom)::json AS geometry,
                t.id,
                t.properties
            FROM {table_name} t
            WHERE t.tenant_id = :tenant_id
              AND ST_Intersects(
                  t.geom,
                  ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
              )
            LIMIT 1000
        """
        ),
        {"geojson": geojson_str, "tenant_id": tenant_id},
    )
    rows = result.fetchall()

    features = []
    for row in rows:
        features.append(
            {
                "type": "Feature",
                "geometry": row[0]
                if isinstance(row[0], dict)
                else __import__("json").loads(row[0]),
                "properties": {
                    "id": str(row[1]),
                    **(row[2] if isinstance(row[2], dict) else {}),
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "layer": layer_name,
            "count": len(features),
            "tenant_id": tenant_id,
        },
    }


# ---------------------------------------------------------------------------
# Buffer Query
# ---------------------------------------------------------------------------


async def buffer_query(
    point_geojson: dict,
    radius_m: float,
    layer_name: str,
    tenant_id: str,
    session: AsyncSession,
) -> dict[str, Any]:
    """
    Return features from `layer_name` within `radius_m` metres of a point/polygon.
    Uses geography cast for metre-based distance (GOTCHA-DB-003).
    """
    _validate_bbox(point_geojson)

    import json

    geojson_str = json.dumps(point_geojson)

    allowed_layers = {
        "parcels",
        "suburbs",
        "watercourses",
        "flood_risk_zones",
        "heritage_sites",
        "trading_bays",
        "slope_data",
        "zoning",
    }
    if layer_name not in allowed_layers:
        raise ValueError(f"Layer '{layer_name}' is not in the allowed layer list.")

    if radius_m <= 0 or radius_m > 50000:
        raise ValueError("radius_m must be between 0 and 50,000 metres.")

    # Safely quote the table name to ensure it is treated strictly as an identifier.
    from_clause = f"FROM {quoted_name(layer_name, quote=True)} t"

    result = await session.execute(
        text(
            f"""
            SELECT
                ST_AsGeoJSON(t.geom)::json AS geometry,
                t.id,
                t.properties,
                ST_Distance(
                    ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                    t.geom::geography
                ) AS distance_m
            {from_clause}
            WHERE t.tenant_id = :tenant_id
              AND ST_DWithin(
                  ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                  t.geom::geography,
                  :radius_m
              )
            ORDER BY distance_m ASC
            LIMIT 1000
            """
        ),
        {"geojson": geojson_str, "tenant_id": tenant_id, "radius_m": radius_m},
    )
    rows = result.fetchall()

    features = []
    for row in rows:
        features.append(
            {
                "type": "Feature",
                "geometry": row[0]
                if isinstance(row[0], dict)
                else __import__("json").loads(row[0]),
                "properties": {
                    "id": str(row[1]),
                    "distance_m": round(float(row[3]), 2),
                    **(row[2] if isinstance(row[2], dict) else {}),
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "layer": layer_name,
            "radius_m": radius_m,
            "count": len(features),
            "tenant_id": tenant_id,
        },
    }


# ---------------------------------------------------------------------------
# Proximity Score
# ---------------------------------------------------------------------------


async def proximity_score(
    polygon_geojson: dict,
    scoring_criteria: list[dict[str, Any]],
    tenant_id: str,
    session: AsyncSession,
) -> dict[str, Any]:
    """
    Weighted proximity scoring against multiple layers.

    scoring_criteria example:
    [
        {"layer": "schools", "weight": 0.3, "ideal_distance_m": 500, "max_distance_m": 2000},
        {"layer": "clinics", "weight": 0.2, "ideal_distance_m": 300, "max_distance_m": 1500},
    ]
    """
    _validate_bbox(polygon_geojson)

    import json

    geojson_str = json.dumps(polygon_geojson)

    allowed_layers = {
        "parcels",
        "suburbs",
        "watercourses",
        "flood_risk_zones",
        "heritage_sites",
        "trading_bays",
        "slope_data",
        "zoning",
        "schools",
        "clinics",
        "transport_stops",
        "police_stations",
    }

    layer_scores: list[dict[str, Any]] = []
    weighted_total = 0.0
    weight_sum = 0.0

    for criterion in scoring_criteria:
        layer = criterion["layer"]
        weight = float(criterion.get("weight", 1.0))
        ideal_m = float(criterion.get("ideal_distance_m", 500))
        max_m = float(criterion.get("max_distance_m", 5000))

        if layer not in allowed_layers:
            raise ValueError(f"Layer '{layer}' is not in the allowed layer list.")

        result = await session.execute(
            text(f"""
                SELECT COALESCE(
                    MIN(ST_Distance(
                        ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                        t.geom::geography
                    )),
                    :max_m
                ) AS min_distance_m
                FROM {layer} t
                WHERE t.tenant_id = :tenant_id
                  AND ST_DWithin(
                      ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)::geography,
                      t.geom::geography,
                      :max_m
                  )
            """),
            {"geojson": geojson_str, "tenant_id": tenant_id, "max_m": max_m},
        )
        min_dist = float(result.scalar_one())

        # Score: 1.0 at ideal distance, tapering to 0 at max distance
        if min_dist <= ideal_m:
            score = 1.0
        elif min_dist >= max_m:
            score = 0.0
        else:
            score = 1.0 - (min_dist - ideal_m) / (max_m - ideal_m)

        layer_scores.append(
            {
                "layer": layer,
                "min_distance_m": round(min_dist, 2),
                "score": round(score, 3),
                "weight": weight,
            }
        )
        weighted_total += score * weight
        weight_sum += weight

    overall = round((weighted_total / weight_sum * 100) if weight_sum > 0 else 0, 1)

    return {
        "overall_score": overall,
        "layer_scores": layer_scores,
        "tenant_id": tenant_id,
    }


# ---------------------------------------------------------------------------
# Suburb Stats
# ---------------------------------------------------------------------------


async def suburb_stats(
    suburb_name: str,
    tenant_id: str,
    session: AsyncSession,
) -> dict[str, Any]:
    """Aggregate spatial statistics for a named suburb."""
    result = await session.execute(
        text("""
            SELECT
                s.name,
                ST_Area(s.geom::geography) AS area_sqm,
                ST_AsGeoJSON(ST_Envelope(s.geom))::json AS bbox_geojson,
                (SELECT COUNT(*) FROM parcels p
                 WHERE p.tenant_id = :tenant_id
                   AND ST_Within(p.geom, s.geom)) AS parcel_count,
                (SELECT COUNT(*) FROM trading_bays b
                 WHERE b.tenant_id = :tenant_id
                   AND ST_Within(b.geom, s.geom)) AS trading_bay_count,
                (SELECT COUNT(*) FROM watercourses w
                 WHERE w.tenant_id = :tenant_id
                   AND ST_Intersects(w.geom, s.geom)) AS watercourse_count
            FROM suburbs s
            WHERE s.tenant_id = :tenant_id
              AND LOWER(s.name) = LOWER(:suburb_name)
            LIMIT 1
        """),
        {"tenant_id": tenant_id, "suburb_name": suburb_name},
    )
    row = result.first()
    if not row:
        return {"error": f"Suburb '{suburb_name}' not found.", "found": False}

    return {
        "found": True,
        "suburb": row[0],
        "area_sqm": round(float(row[1]), 2),
        "area_ha": round(float(row[1]) / 10000, 2),
        "bbox": row[2],
        "parcel_count": int(row[3]),
        "trading_bay_count": int(row[4]),
        "watercourse_count": int(row[5]),
        "tenant_id": tenant_id,
    }
