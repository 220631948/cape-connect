/**
 * mcp-gateway.js — Zero-dependency MCP stdio-to-SSE Gateway
 * Exposes all registered MCP stdio servers over HTTP/SSE
 * No npm dependencies required — uses only Node.js built-ins
 *
 * Usage:   node mcp-gateway.js
 * Connect: GET  http://localhost:3001/sse?serverId=<name>
 * Send:    POST http://localhost:3001/message?sessionId=<id>  body: JSON
 */

const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.GATEWAY_PORT || 3001;
const CONFIG_PATH = path.join(__dirname, 'mcp.config.json');
const ENV_PATH = path.join(__dirname, '.env');

// Load .env file manually (zero-dependency)
if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            if (key && value && !process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// sessionId -> spawned child process
const sessions = new Map();

function loadConfig() {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
}

function sendSSE(res, event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = reqUrl.pathname;

    setCORSHeaders(res);

    // Handle CORS pre-flight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // Health check endpoint
    if (pathname === '/health') {
        const config = loadConfig();
        const serverList = Object.keys(config.mcpServers);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'ok',
            gateway: 'mcp-gateway',
            activeSessions: sessions.size,
            registeredServers: serverList,
            port: PORT,
        }, null, 2));
    }

    // SSE endpoint — start a stdio server and stream its output
    if (pathname === '/sse' && req.method === 'GET') {
        const serverId = reqUrl.searchParams.get('serverId');

        let config;
        try { config = loadConfig(); } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end(`Config read error: ${e.message}`);
        }

        const serverDef = config.mcpServers[serverId];
        if (!serverDef) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end(`Unknown serverId: "${serverId}". Available: ${Object.keys(config.mcpServers).join(', ')}`);
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        const sessionId = crypto.randomUUID();
        const env = { ...process.env, ...(serverDef.env || {}) };

        // Spawn the stdio server
        const child = spawn(serverDef.command, serverDef.args || [], {
            env,
            cwd: __dirname,
        });

        sessions.set(sessionId, child);
        console.log(`[Gateway] [${serverId}] started — session ${sessionId}`);

        // Tell the MCP client where to post messages
        res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`);

        // Relay stdout as SSE messages
        let buffer = '';
        child.stdout.on('data', chunk => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    JSON.parse(trimmed); // validate it's JSON
                    res.write(`event: message\ndata: ${trimmed}\n\n`);
                } catch {
                    console.warn(`[${serverId}] non-JSON stdout: ${trimmed}`);
                }
            }
        });

        child.stderr.on('data', d => console.error(`[${serverId} ERR] ${d.toString().trim()}`));

        child.on('exit', code => {
            console.log(`[Gateway] [${serverId}] exited with code ${code}`);
            sessions.delete(sessionId);
            res.end();
        });

        req.on('close', () => {
            console.log(`[Gateway] [${serverId}] client disconnected`);
            child.kill();
            sessions.delete(sessionId);
        });

        return;
    }

    // Message endpoint — forward JSON body to the correct session's stdin
    if (pathname === '/message' && req.method === 'POST') {
        const sessionId = reqUrl.searchParams.get('sessionId');
        const child = sessions.get(sessionId);

        if (!child) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end(`Session ${sessionId} not found`);
        }

        let body = '';
        req.on('data', d => body += d.toString());
        req.on('end', () => {
            try {
                JSON.parse(body); // validate before forwarding
                child.stdin.write(body + '\n');
                res.writeHead(202);
                res.end('Accepted');
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(`Invalid JSON: ${e.message}`);
            }
        });

        return;
    }

    // 404 for everything else
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found. Available: GET /sse?serverId=<id>, POST /message?sessionId=<id>, GET /health');
});

server.listen(PORT, '127.0.0.1', () => {
    const config = loadConfig();
    const servers = Object.keys(config.mcpServers);
    console.log(`\n✅ MCP Gateway listening on http://127.0.0.1:${PORT}`);
    console.log(`\n📋 Registered servers (${servers.length}):`);
    servers.forEach(s => console.log(`   • ${s} → GET /sse?serverId=${s}`));
    console.log(`\n🏥 Health: http://127.0.0.1:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gateway...');
    sessions.forEach(child => child.kill());
    server.close(() => process.exit(0));
});
process.on('SIGINT', () => server.close(() => process.exit(0)));
