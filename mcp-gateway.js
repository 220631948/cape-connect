const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;
const mcpConfigPath = './.mcp.json';

// Keep track of child processes
const servers = {};

// Parse config and spawn
const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
const mcpServers = config.mcpServers || {};

Object.keys(mcpServers).forEach(name => {
    const srv = mcpServers[name];
    if (srv.type === 'stdio') {
        servers[name] = srv;
        console.log(`[Gateway] Configured route for ${name}`);
    }
});

app.get('/mcp', (req, res) => {
    res.json({
        message: 'CapeTown GIS MCP Gateway',
        available_servers: Object.keys(servers),
        usage: 'Connect via POST /mcp/:server_name for JSON-RPC, or GET /mcp/:server_name/sse for SSE transport.'
    });
});

// A very basic multiplexer placeholder indicating the gateway is active.
// Full SSE routing requires @modelcontextprotocol/sdk SSEServerTransport
app.get('/mcp/:name/sse', (req, res) => {
    const name = req.params.name;
    if (!servers[name]) return res.status(404).send('Server not found');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: {"message": "SSE connection for ${name} established. Note: Native binary multiplexing requires sdk integration."}\n\n`);
});

app.listen(PORT, () => {
    console.log(`[Gateway] MCP Multiplexer listening on http://localhost:${PORT}`);
    console.log(`[Gateway] Exposed ${Object.keys(servers).length} stdio servers.`);
});
