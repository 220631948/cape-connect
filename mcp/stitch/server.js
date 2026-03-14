#!/usr/bin/env node
/**
 * mcp/stitch/server.js
 * CapeTown GIS Hub — NeRF/3DGS Pipeline Orchestration MCP Server
 *
 * Purpose: NeRF and Gaussian Splatting pipeline orchestration — scene
 * reconstruction, training job management, output format validation (OGC 3D Tiles 1.1).
 *
 * Env: NERFSTUDIO_PATH=/usr/local/bin/ns-train
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const { spawn, spawnSync } = require('child_process');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

const NERFSTUDIO_PATH = process.env.NERFSTUDIO_PATH || '/usr/local/bin/ns-train';
const SUPPORTED_METHODS = ['nerfacto', '3dgs', 'instant-ngp', 'splatfacto'];

const jobs = new Map();
function generateJobId() { return `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }
function isNerfstudioAvailable() {
  const r = spawnSync('which', ['ns-train'], { timeout: 3000 });
  return r.status === 0 || fs.existsSync(NERFSTUDIO_PATH);
}

function startTraining(scenePath, method) {
  if (!SUPPORTED_METHODS.includes(method)) return { error: `Unsupported method: ${method}. Supported: ${SUPPORTED_METHODS.join(', ')}` };
  if (!fs.existsSync(scenePath)) return { error: `Scene path not found: ${scenePath}` };
  const job_id = generateJobId();
  if (!isNerfstudioAvailable()) {
    jobs.set(job_id, { job_id, status: 'queued', method, scene_path: scenePath, started_at: new Date().toISOString(), pid: null, output_path: null, progress: 0, note: `NERFSTUDIO_UNAVAILABLE — ${NERFSTUDIO_PATH} not found.` });
    return { job_id, status: 'queued', pid: null, note: 'nerfstudio not installed; job queued (simulation mode)' };
  }
  const outputDir = path.join(path.dirname(scenePath), 'outputs', path.basename(scenePath));
  const proc = spawn(NERFSTUDIO_PATH, [method, '--data', scenePath, '--output-dir', outputDir], { detached: true, stdio: 'ignore', env: { ...process.env } });
  proc.unref();
  jobs.set(job_id, { job_id, status: 'running', method, scene_path: scenePath, output_path: outputDir, started_at: new Date().toISOString(), pid: proc.pid, progress: 0 });
  return { job_id, status: 'running', pid: proc.pid, output_path: outputDir };
}

function trainingStatus(jobId) {
  const job = jobs.get(jobId);
  if (!job) return { error: `Job not found: ${jobId}` };
  if (job.output_path && fs.existsSync(job.output_path)) {
    const files = fs.readdirSync(job.output_path).filter((f) => f.endsWith('.json'));
    if (files.length > 0) { jobs.get(jobId).status = 'completed'; jobs.get(jobId).progress = 100; }
  }
  return { job_id: jobId, status: job.status, progress: job.progress, method: job.method, scene_path: job.scene_path, output_path: job.output_path, started_at: job.started_at, pid: job.pid, note: job.note || null };
}

function validateOutput(tilesetPath) {
  if (!fs.existsSync(tilesetPath)) return { valid: false, errors: [`File not found: ${tilesetPath}`] };
  let data;
  try { data = JSON.parse(fs.readFileSync(tilesetPath, 'utf8')); }
  catch (e) { return { valid: false, errors: [`JSON parse error: ${e.message}`] }; }
  const errors = [];
  const version = data.asset?.version;
  if (!data.asset) errors.push('Missing "asset" block');
  if (!['1.0','1.1'].includes(version)) errors.push(`Expected 3D Tiles 1.0 or 1.1, got: ${version}`);
  if (!data.root) errors.push('Missing "root" tile');
  if (!data.root?.boundingVolume) errors.push('Root tile missing boundingVolume');
  if (data.geometricError === undefined) errors.push('Missing root geometricError');
  return { valid: errors.length === 0, version: version || null, path: tilesetPath, errors };
}

const server = new McpServer({ name: 'stitch', version: '1.0.0' }, { capabilities: { tools: {} } });

server.tool('start_training', 'Start a NeRF or 3DGS training job using nerfstudio.',
  { scene_path: z.string().describe('Path to scene data directory'), method: z.enum(['nerfacto','3dgs','instant-ngp','splatfacto']).describe('Training method') },
  async ({ scene_path, method }) => ({ content: [{ type: 'text', text: JSON.stringify(startTraining(scene_path, method)) }] }));

server.tool('training_status', 'Check the status and progress of a training job.',
  { job_id: z.string().describe('Job ID returned by start_training') },
  async ({ job_id }) => ({ content: [{ type: 'text', text: JSON.stringify(trainingStatus(job_id)) }] }));

server.tool('validate_output', 'Validate a nerfstudio-generated tileset.json against 3D Tiles 1.0/1.1 schema.',
  { tileset_path: z.string().describe('Path to output tileset.json') },
  async ({ tileset_path }) => ({ content: [{ type: 'text', text: JSON.stringify(validateOutput(tileset_path)) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[stitch] MCP server started\n');
}
main().catch((err) => { process.stderr.write(`[stitch] Fatal: ${err.message}\n`); process.exit(1); });
