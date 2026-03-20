#!/usr/bin/env node
/**
 * mcp/postgis-pipeline/server.js
 * CapeTown GIS Hub — PostGIS Pipeline MCP Server (M17)
 *
 * Purpose: Geometry validity checking, CRS transformation, and
 * tenant-scoped spatial statistics via PostGIS.
 *
 * Tools:
 *   - validate_geometry: Check geometry validity and auto-repair with ST_MakeValid
 *   - transform_crs: Reproject geometry between EPSG codes (SA focus: 4326, 2046, 2048, 4148)
 *   - spatial_stats: Tenant-scoped aggregate statistics (count, area, centroid)
 *   - bbox_clip: Clip geometry to a bounding box (Western Cape enforcement)
 *
 * @compliance POPIA: All queries are tenant-scoped via app.current_tenant setting.
 */

'use strict';

const path = require('path');
const { Client } = require('pg');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── Constants ─────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/capegis';

// Supported South African EPSG codes
const SUPPORTED_SRID = [4326, 2046, 2048, 4148, 22234, 32734, 32735];

// Western Cape bounding box (EPSG:4326)
const WESTERN_CAPE_BBOX = {
  xmin: 17.8,
  ymin: -34.9,
  xmax: 20.9,
  ymax: -32.0,
};

// ── Database helper ───────────────────────────────────────────────────────────
async function withClient(fn) {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Attempt a live PostGIS query; on failure return a mock/diagnostic result.
 */
async function queryWithFallback(fn, mockResult) {
  try {
    return { ...(await fn()), tier: 'LIVE' };
  } catch (err) {
    process.stderr.write(`[postgis-pipeline] DB error, falling back to MOCK: ${err.message}\n`);
    return { ...mockResult, tier: 'MOCK', note: err.message };
  }
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: 'postgis-pipeline', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool: validate_geometry ───────────────────────────────────────────────────
server.tool(
  'validate_geometry',
  'Check whether a GeoJSON geometry is valid (ST_IsValid) and optionally repair it (ST_MakeValid).',
  {
    geojson: z.string().describe('GeoJSON geometry string'),
    repair:  z.boolean().optional().default(false).describe('Auto-repair with ST_MakeValid if invalid'),
  },
  async ({ geojson, repair }) => {
    const result = await queryWithFallback(
      async () => {
        return await withClient(async (client) => {
          const { rows } = await client.query(
            `SELECT
               ST_IsValid(ST_GeomFromGeoJSON($1))            AS is_valid,
               ST_IsValidReason(ST_GeomFromGeoJSON($1))      AS reason,
               ST_GeometryType(ST_GeomFromGeoJSON($1))       AS geom_type,
               ST_NPoints(ST_GeomFromGeoJSON($1))            AS num_points,
               ST_SRID(ST_GeomFromGeoJSON($1))               AS srid
             ${repair ? `, ST_AsGeoJSON(ST_MakeValid(ST_GeomFromGeoJSON($1))) AS repaired` : ''}`,
            [geojson]
          );
          return rows[0];
        });
      },
      { is_valid: null, reason: 'Database unavailable', geom_type: null, num_points: null, srid: null }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: transform_crs ──────────────────────────────────────────────────────
server.tool(
  'transform_crs',
  'Reproject a GeoJSON geometry between coordinate reference systems. Supports SA EPSG codes (4326, 2046, 2048, 4148, 22234, 32734, 32735).',
  {
    geojson:    z.string().describe('GeoJSON geometry string'),
    from_srid:  z.number().int().describe('Source EPSG code'),
    to_srid:    z.number().int().describe('Target EPSG code'),
  },
  async ({ geojson, from_srid, to_srid }) => {
    if (!SUPPORTED_SRID.includes(from_srid) || !SUPPORTED_SRID.includes(to_srid)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: `Unsupported SRID. Supported: ${SUPPORTED_SRID.join(', ')}` }) }] };
    }

    const result = await queryWithFallback(
      async () => {
        return await withClient(async (client) => {
          const { rows } = await client.query(
            `SELECT ST_AsGeoJSON(
               ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), $2), $3)
             ) AS transformed`,
            [geojson, from_srid, to_srid]
          );
          return { transformed: JSON.parse(rows[0].transformed), from_srid, to_srid };
        });
      },
      { transformed: null, from_srid, to_srid, error: 'Database unavailable' }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: spatial_stats ──────────────────────────────────────────────────────
server.tool(
  'spatial_stats',
  'Compute tenant-scoped spatial aggregate statistics for a given table (count, total area, centroid).',
  {
    table_name: z.enum(['properties', 'valuation_data', 'user_features', 'izs_zones']).describe('Target spatial table'),
    tenant_id:  z.string().uuid().describe('Tenant UUID for RLS scoping'),
  },
  async ({ table_name, tenant_id }) => {
    const result = await queryWithFallback(
      async () => {
        return await withClient(async (client) => {
          // Set tenant context for RLS
          await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [tenant_id]);

          const { rows } = await client.query(
            `SELECT
               COUNT(*)::int                                           AS feature_count,
               COALESCE(SUM(ST_Area(geometry::geography)), 0)         AS total_area_m2,
               ST_AsGeoJSON(ST_Centroid(ST_Collect(geometry)))         AS centroid,
               ST_AsGeoJSON(ST_Extent(geometry))                       AS bbox
             FROM ${table_name}
             WHERE tenant_id = $1`,
            [tenant_id]
          );
          const row = rows[0];
          return {
            table: table_name,
            feature_count: row.feature_count,
            total_area_m2: parseFloat(row.total_area_m2),
            centroid: row.centroid ? JSON.parse(row.centroid) : null,
            bbox: row.bbox ? JSON.parse(row.bbox) : null,
          };
        });
      },
      { table: table_name, feature_count: 0, total_area_m2: 0, centroid: null, bbox: null }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: bbox_clip ──────────────────────────────────────────────────────────
server.tool(
  'bbox_clip',
  'Clip a GeoJSON geometry to the Western Cape bounding box. Enforces geographic scope.',
  {
    geojson:   z.string().describe('GeoJSON geometry string'),
    custom_bbox: z.object({
      xmin: z.number(), ymin: z.number(),
      xmax: z.number(), ymax: z.number(),
    }).optional().describe('Optional custom bounding box (defaults to Western Cape)'),
  },
  async ({ geojson, custom_bbox }) => {
    const bbox = custom_bbox || WESTERN_CAPE_BBOX;

    const result = await queryWithFallback(
      async () => {
        return await withClient(async (client) => {
          const { rows } = await client.query(
            `SELECT
               ST_AsGeoJSON(
                 ST_Intersection(
                   ST_GeomFromGeoJSON($1),
                   ST_MakeEnvelope($2, $3, $4, $5, 4326)
                 )
               ) AS clipped,
               ST_Contains(
                 ST_MakeEnvelope($2, $3, $4, $5, 4326),
                 ST_GeomFromGeoJSON($1)
               ) AS fully_within`,
            [geojson, bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax]
          );
          return {
            clipped: rows[0].clipped ? JSON.parse(rows[0].clipped) : null,
            fully_within: rows[0].fully_within,
            bbox_used: bbox,
          };
        });
      },
      { clipped: null, fully_within: null, bbox_used: bbox }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[postgis-pipeline] MCP server started (M17)\n');
}

main().catch((err) => {
  process.stderr.write(`[postgis-pipeline] Fatal: ${err.message}\n`);
  process.exit(1);
});
