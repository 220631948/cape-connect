#!/usr/bin/env node
/**
 * mcp/pmtiles-pipeline/server.js
 * CapeTown GIS Hub — PMTiles Pipeline MCP Server (M17)
 *
 * Purpose: GeoPackage/GeoJSON to PMTiles v3 conversion for offline-first
 * tile resilience. Manages tile archives, metadata inspection, and
 * MapLibre protocol integration.
 *
 * Tools:
 *   - convert_to_pmtiles: Convert GeoPackage/GeoJSON/MBTiles to PMTiles v3
 *   - inspect_pmtiles: Read metadata and stats from a PMTiles archive
 *   - list_archives: List available PMTiles archives in the project
 *   - generate_protocol_config: Generate MapLibre pmtiles:// protocol config
 *
 * @compliance POPIA: No PII in tile archives; only spatial geometry data.
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { execSync, spawnSync } = require('child_process');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── Constants ─────────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PMTILES_DIR  = path.join(PROJECT_ROOT, 'public', 'tiles');
const SUPPORTED_INPUT = ['.gpkg', '.geojson', '.json', '.mbtiles', '.shp'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureTilesDir() {
  if (!fs.existsSync(PMTILES_DIR)) {
    fs.mkdirSync(PMTILES_DIR, { recursive: true });
  }
}

function isTippecanoeAvailable() {
  const r = spawnSync('which', ['tippecanoe'], { timeout: 3000 });
  return r.status === 0;
}

function isPmtilesCliAvailable() {
  const r = spawnSync('which', ['pmtiles'], { timeout: 3000 });
  return r.status === 0;
}

function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return { size_bytes: stats.size, size_mb: (stats.size / (1024 * 1024)).toFixed(2), modified: stats.mtime.toISOString() };
  } catch {
    return null;
  }
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: 'pmtiles-pipeline', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool: convert_to_pmtiles ──────────────────────────────────────────────────
server.tool(
  'convert_to_pmtiles',
  'Convert a GeoPackage, GeoJSON, MBTiles, or Shapefile to PMTiles v3 format for offline tile serving.',
  {
    input_path:  z.string().describe('Path to input file (relative to project root)'),
    output_name: z.string().optional().describe('Output filename (without extension). Defaults to input filename.'),
    min_zoom:    z.number().int().optional().default(0).describe('Minimum zoom level'),
    max_zoom:    z.number().int().optional().default(14).describe('Maximum zoom level'),
    layer_name:  z.string().optional().describe('Layer name in the output tiles'),
  },
  async ({ input_path, output_name, min_zoom, max_zoom, layer_name }) => {
    const absInput = path.resolve(PROJECT_ROOT, input_path);
    const ext = path.extname(absInput).toLowerCase();

    if (!SUPPORTED_INPUT.includes(ext)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: `Unsupported format: ${ext}. Supported: ${SUPPORTED_INPUT.join(', ')}` }) }] };
    }
    if (!fs.existsSync(absInput)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: `File not found: ${input_path}` }) }] };
    }

    ensureTilesDir();
    const baseName = output_name || path.basename(absInput, ext);
    const outputPath = path.join(PMTILES_DIR, `${baseName}.pmtiles`);

    // Attempt conversion via tippecanoe → pmtiles
    if (isTippecanoeAvailable()) {
      try {
        const tempMbtiles = path.join(PMTILES_DIR, `${baseName}.mbtiles`);
        const layerFlag = layer_name ? `-l ${layer_name}` : '';

        if (ext === '.mbtiles') {
          // Direct MBTiles → PMTiles via pmtiles CLI
          if (isPmtilesCliAvailable()) {
            execSync(`pmtiles convert "${absInput}" "${outputPath}"`, { timeout: 120000 });
          } else {
            return { content: [{ type: 'text', text: JSON.stringify({ error: 'pmtiles CLI not found. Install: cargo install pmtiles' }) }] };
          }
        } else {
          // GeoJSON/GeoPackage/Shapefile → MBTiles via tippecanoe, then → PMTiles
          execSync(
            `tippecanoe -o "${tempMbtiles}" -Z${min_zoom} -z${max_zoom} ${layerFlag} --force "${absInput}"`,
            { timeout: 300000 }
          );
          if (isPmtilesCliAvailable()) {
            execSync(`pmtiles convert "${tempMbtiles}" "${outputPath}"`, { timeout: 120000 });
            fs.unlinkSync(tempMbtiles);
          } else {
            // Keep as MBTiles if pmtiles CLI not available
            return { content: [{ type: 'text', text: JSON.stringify({
              status: 'partial',
              mbtiles_path: path.relative(PROJECT_ROOT, tempMbtiles),
              note: 'tippecanoe succeeded but pmtiles CLI not found. MBTiles created instead.',
              tier: 'LIVE',
            }) }] };
          }
        }

        const stats = getFileStats(outputPath);
        return { content: [{ type: 'text', text: JSON.stringify({
          status: 'completed',
          output_path: path.relative(PROJECT_ROOT, outputPath),
          format: 'PMTiles v3',
          zoom_range: { min: min_zoom, max: max_zoom },
          file_stats: stats,
          tier: 'LIVE',
        }) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Conversion failed: ${err.message}`, tier: 'MOCK' }) }] };
      }
    }

    // Mock fallback when tools not installed
    return { content: [{ type: 'text', text: JSON.stringify({
      status: 'queued',
      input_path,
      output_path: path.relative(PROJECT_ROOT, outputPath),
      format: 'PMTiles v3',
      zoom_range: { min: min_zoom, max: max_zoom },
      note: 'tippecanoe not installed. Conversion queued (simulation mode). Install: brew install tippecanoe',
      tier: 'MOCK',
    }) }] };
  }
);

// ── Tool: inspect_pmtiles ─────────────────────────────────────────────────────
server.tool(
  'inspect_pmtiles',
  'Read metadata and statistics from a PMTiles v3 archive.',
  {
    archive_path: z.string().describe('Path to PMTiles file (relative to project root)'),
  },
  async ({ archive_path }) => {
    const absPath = path.resolve(PROJECT_ROOT, archive_path);

    if (!fs.existsSync(absPath)) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: `File not found: ${archive_path}` }) }] };
    }

    const stats = getFileStats(absPath);

    if (isPmtilesCliAvailable()) {
      try {
        const output = execSync(`pmtiles show "${absPath}" --json`, { timeout: 15000, encoding: 'utf8' });
        const metadata = JSON.parse(output);
        return { content: [{ type: 'text', text: JSON.stringify({ metadata, file_stats: stats, tier: 'LIVE' }) }] };
      } catch (err) {
        process.stderr.write(`[pmtiles-pipeline] CLI inspect failed: ${err.message}\n`);
      }
    }

    // Fallback: read PMTiles header manually (first 127 bytes)
    try {
      const fd = fs.openSync(absPath, 'r');
      const header = Buffer.alloc(127);
      fs.readSync(fd, header, 0, 127, 0);
      fs.closeSync(fd);

      const magic = header.toString('ascii', 0, 7);
      const version = header.readUInt8(7);

      return { content: [{ type: 'text', text: JSON.stringify({
        metadata: {
          magic,
          version,
          format: magic === 'PMTiles' ? `PMTiles v${version}` : 'Unknown',
        },
        file_stats: stats,
        tier: 'LIVE',
        note: 'pmtiles CLI not available; showing header-only metadata.',
      }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: `Failed to read archive: ${err.message}`, tier: 'MOCK' }) }] };
    }
  }
);

// ── Tool: list_archives ───────────────────────────────────────────────────────
server.tool(
  'list_archives',
  'List all PMTiles archives available in the project tiles directory.',
  {},
  async () => {
    ensureTilesDir();

    try {
      const files = fs.readdirSync(PMTILES_DIR)
        .filter((f) => f.endsWith('.pmtiles'))
        .map((f) => {
          const stats = getFileStats(path.join(PMTILES_DIR, f));
          return { name: f, ...stats };
        });

      return { content: [{ type: 'text', text: JSON.stringify({
        directory: path.relative(PROJECT_ROOT, PMTILES_DIR),
        archives: files,
        count: files.length,
        tier: 'LIVE',
      }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: err.message, archives: [], count: 0, tier: 'MOCK' }) }] };
    }
  }
);

// ── Tool: generate_protocol_config ────────────────────────────────────────────
server.tool(
  'generate_protocol_config',
  'Generate MapLibre pmtiles:// protocol configuration for a PMTiles archive.',
  {
    archive_name: z.string().describe('PMTiles filename (e.g., "zoning.pmtiles")'),
    source_id:    z.string().optional().describe('MapLibre source ID (defaults to archive name without extension)'),
    layer_type:   z.enum(['fill', 'line', 'circle', 'symbol', 'fill-extrusion']).optional().default('fill').describe('MapLibre layer type'),
  },
  async ({ archive_name, source_id, layer_type }) => {
    const id = source_id || archive_name.replace('.pmtiles', '');
    const archivePath = `tiles/${archive_name}`;

    const config = {
      protocol_setup: `import { Protocol } from 'pmtiles';\nimport maplibregl from 'maplibre-gl';\n\nconst protocol = new Protocol();\nmaplibregl.addProtocol('pmtiles', protocol.tile);`,
      source: {
        [id]: {
          type: 'vector',
          url: `pmtiles://${archivePath}`,
        },
      },
      layer: {
        id: `${id}-layer`,
        type: layer_type,
        source: id,
        'source-layer': id,
      },
      usage: [
        `// 1. Add protocol in map init:`,
        `const protocol = new Protocol();`,
        `maplibregl.addProtocol('pmtiles', protocol.tile);`,
        `// 2. Add source and layer:`,
        `map.addSource('${id}', { type: 'vector', url: 'pmtiles://${archivePath}' });`,
        `map.addLayer({ id: '${id}-layer', type: '${layer_type}', source: '${id}', 'source-layer': '${id}' });`,
      ],
    };

    return { content: [{ type: 'text', text: JSON.stringify({ config, tier: 'LIVE' }) }] };
  }
);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[pmtiles-pipeline] MCP server started (M17)\n');
}

main().catch((err) => {
  process.stderr.write(`[pmtiles-pipeline] Fatal: ${err.message}\n`);
  process.exit(1);
});
