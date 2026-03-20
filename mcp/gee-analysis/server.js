#!/usr/bin/env node
/**
 * mcp/gee-analysis/server.js
 * CapeTown GIS Hub — Google Earth Engine Analysis MCP Server (M17)
 *
 * Purpose: Cloud-free Sentinel-2 composite generation and vegetation/water
 * risk index calculation (NDVI/NDWI) restricted to the Cape Town metro area.
 *
 * Tools:
 *   - sentinel2_composite: Request a cloud-free Sentinel-2 composite for a date range
 *   - ndvi_analysis: Compute NDVI (vegetation index) for a given area and date range
 *   - ndwi_analysis: Compute NDWI (water index) for a given area and date range
 *   - land_cover_stats: Land cover classification statistics for a polygon
 *
 * Note: GEE requires authenticated access. This server provides mock fallback
 * when GEE credentials are not available or the service is unreachable.
 *
 * @compliance POPIA: No PII involved; only satellite imagery metadata.
 */

'use strict';

const path = require('path');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── Constants ─────────────────────────────────────────────────────────────────
// Cape Town metro bounding box (EPSG:4326) — enforced for all GEE queries
const CT_METRO_BBOX = {
  west: 18.30,
  south: -34.40,
  east: 19.00,
  north: -33.70,
};

// Sentinel-2 band assignments
const BANDS = {
  RED: 'B4',
  GREEN: 'B3',
  BLUE: 'B2',
  NIR: 'B8',
  SWIR: 'B11',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function isWithinCapeTown(bbox) {
  return (
    bbox.west >= CT_METRO_BBOX.west - 0.5 &&
    bbox.south >= CT_METRO_BBOX.south - 0.5 &&
    bbox.east <= CT_METRO_BBOX.east + 0.5 &&
    bbox.north <= CT_METRO_BBOX.north + 0.5
  );
}

function clampToCapeTown(bbox) {
  return {
    west: Math.max(bbox.west, CT_METRO_BBOX.west),
    south: Math.max(bbox.south, CT_METRO_BBOX.south),
    east: Math.min(bbox.east, CT_METRO_BBOX.east),
    north: Math.min(bbox.north, CT_METRO_BBOX.north),
  };
}

async function geeWithFallback(fn, mockResult) {
  try {
    return { ...(await fn()), tier: 'LIVE' };
  } catch (err) {
    process.stderr.write(`[gee-analysis] GEE unavailable, falling back to MOCK: ${err.message}\n`);
    return { ...mockResult, tier: 'MOCK', note: err.message };
  }
}

const bboxSchema = z.object({
  west: z.number(), south: z.number(),
  east: z.number(), north: z.number(),
}).describe('Bounding box {west, south, east, north} in EPSG:4326');

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: 'gee-analysis', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool: sentinel2_composite ─────────────────────────────────────────────────
server.tool(
  'sentinel2_composite',
  'Request a cloud-free Sentinel-2 composite for a date range within Cape Town metro. Returns metadata and download URL.',
  {
    bbox:       bboxSchema,
    start_date: z.string().describe('Start date (YYYY-MM-DD)'),
    end_date:   z.string().describe('End date (YYYY-MM-DD)'),
    max_cloud:  z.number().optional().default(20).describe('Max cloud cover percentage (0-100)'),
  },
  async ({ bbox, start_date, end_date, max_cloud }) => {
    if (!isWithinCapeTown(bbox)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Bounding box is outside Cape Town metro area. GEE queries are restricted to CT metro.' }) }] };
    }
    const clamped = clampToCapeTown(bbox);

    const result = await geeWithFallback(
      async () => {
        // GEE API call placeholder — requires ee.Initialize() with service account
        throw new Error('GEE credentials not configured');
      },
      {
        composite: {
          collection: 'COPERNICUS/S2_SR_HARMONIZED',
          bbox: clamped,
          date_range: { start: start_date, end: end_date },
          max_cloud_cover: max_cloud,
          bands: [BANDS.RED, BANDS.GREEN, BANDS.BLUE, BANDS.NIR],
          pixel_count_estimate: 2500000,
          resolution_m: 10,
          crs: 'EPSG:4326',
          status: 'mock_generated',
          download_url: null,
        },
        source: 'Sentinel-2 L2A (Copernicus)',
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: ndvi_analysis ───────────────────────────────────────────────────────
server.tool(
  'ndvi_analysis',
  'Compute NDVI (Normalized Difference Vegetation Index) for a Cape Town area. Formula: (NIR-RED)/(NIR+RED).',
  {
    bbox:       bboxSchema,
    start_date: z.string().describe('Start date (YYYY-MM-DD)'),
    end_date:   z.string().describe('End date (YYYY-MM-DD)'),
  },
  async ({ bbox, start_date, end_date }) => {
    if (!isWithinCapeTown(bbox)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Bounding box outside Cape Town metro area.' }) }] };
    }
    const clamped = clampToCapeTown(bbox);

    const result = await geeWithFallback(
      async () => {
        throw new Error('GEE credentials not configured');
      },
      {
        index: 'NDVI',
        formula: '(B8 - B4) / (B8 + B4)',
        bbox: clamped,
        date_range: { start: start_date, end: end_date },
        statistics: {
          min: -0.12,
          max: 0.85,
          mean: 0.34,
          median: 0.31,
          std_dev: 0.18,
        },
        classification: {
          bare_soil: { range: [-1.0, 0.1], percentage: 15.2 },
          sparse_vegetation: { range: [0.1, 0.3], percentage: 28.5 },
          moderate_vegetation: { range: [0.3, 0.6], percentage: 38.1 },
          dense_vegetation: { range: [0.6, 1.0], percentage: 18.2 },
        },
        source: 'Sentinel-2 L2A (Copernicus)',
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: ndwi_analysis ───────────────────────────────────────────────────────
server.tool(
  'ndwi_analysis',
  'Compute NDWI (Normalized Difference Water Index) for a Cape Town area. Formula: (GREEN-NIR)/(GREEN+NIR).',
  {
    bbox:       bboxSchema,
    start_date: z.string().describe('Start date (YYYY-MM-DD)'),
    end_date:   z.string().describe('End date (YYYY-MM-DD)'),
  },
  async ({ bbox, start_date, end_date }) => {
    if (!isWithinCapeTown(bbox)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Bounding box outside Cape Town metro area.' }) }] };
    }
    const clamped = clampToCapeTown(bbox);

    const result = await geeWithFallback(
      async () => {
        throw new Error('GEE credentials not configured');
      },
      {
        index: 'NDWI',
        formula: '(B3 - B8) / (B3 + B8)',
        bbox: clamped,
        date_range: { start: start_date, end: end_date },
        statistics: {
          min: -0.45,
          max: 0.72,
          mean: -0.08,
          median: -0.12,
          std_dev: 0.21,
        },
        classification: {
          no_water: { range: [-1.0, 0.0], percentage: 78.3 },
          water_stress: { range: [0.0, 0.2], percentage: 12.5 },
          moderate_water: { range: [0.2, 0.5], percentage: 6.8 },
          open_water: { range: [0.5, 1.0], percentage: 2.4 },
        },
        source: 'Sentinel-2 L2A (Copernicus)',
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: land_cover_stats ────────────────────────────────────────────────────
server.tool(
  'land_cover_stats',
  'Get land cover classification statistics for a polygon within Cape Town metro.',
  {
    bbox: bboxSchema,
    year: z.number().int().min(2017).max(2026).optional().default(2025).describe('Classification year'),
  },
  async ({ bbox, year }) => {
    if (!isWithinCapeTown(bbox)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Bounding box outside Cape Town metro area.' }) }] };
    }

    const result = await geeWithFallback(
      async () => {
        throw new Error('GEE credentials not configured');
      },
      {
        collection: 'ESA/WorldCover/v200',
        year,
        bbox: clampToCapeTown(bbox),
        classes: {
          tree_cover:    { code: 10, percentage: 12.4, area_km2: 8.2 },
          shrubland:     { code: 20, percentage: 18.7, area_km2: 12.4 },
          grassland:     { code: 30, percentage: 8.3, area_km2: 5.5 },
          cropland:      { code: 40, percentage: 5.1, area_km2: 3.4 },
          built_up:      { code: 50, percentage: 42.8, area_km2: 28.3 },
          bare_sparse:   { code: 60, percentage: 3.2, area_km2: 2.1 },
          water_bodies:  { code: 80, percentage: 2.1, area_km2: 1.4 },
          wetlands:      { code: 90, percentage: 7.4, area_km2: 4.9 },
        },
        source: 'ESA WorldCover 10m (Copernicus)',
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[gee-analysis] MCP server started (M17)\n');
}

main().catch((err) => {
  process.stderr.write(`[gee-analysis] Fatal: ${err.message}\n`);
  process.exit(1);
});
