module.exports = {
  apps : [
    {
      name: "filesystem",
      script: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/mr/Desktop/Geographical Informations Systems (GIS)"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "postgres",
      script: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres:postgres@localhost:5432/capegis"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "doc-state",
      script: "mcp/doc-state/server.js",
      args: [],
      interpreter: "node",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "formats",
      script: "mcp/formats/server.js",
      args: [],
      interpreter: "node",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "cesium",
      script: "mcp/cesium/server.js",
      args: [],
      interpreter: "node",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "openaware",
      script: "mcp/openaware/server.js",
      args: [],
      interpreter: "node",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "stitch",
      script: "mcp/stitch/server.js",
      args: [],
      interpreter: "node",
      env: {"NERFSTUDIO_PATH": "/usr/local/bin/ns-train"},
      autorestart: true,
      watch: false
    },
    {
      name: "computerUse",
      script: "mcp/computerUse/server.js",
      args: [],
      interpreter: "node",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "opensky",
      script: "scripts/opensky-mcp-wrapper.js",
      args: [],
      interpreter: "node",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "gis-mcp",
      script: "uvx",
      args: ["gis-mcp"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "gemini-deep-research",
      script: ".gemini/extensions/gemini-deep-research/scripts/start.cjs",
      args: [],
      interpreter: "node",
      env: {"GEMINI_API_KEY": "YOUR_GEMINI_API_KEY"},
      autorestart: true,
      watch: false
    },
    {
      name: "context7",
      script: "npx",
      args: ["-y", "@upstash/context7-mcp"],
      interpreter: "none",
      env: {"CONTEXT7_API_KEY": "ctx7sk-845d7617-bec2-4013-a930-1369661c9c30"},
      autorestart: true,
      watch: false
    },
    {
      name: "exa",
      script: "npx",
      args: ["-y", "exa-mcp-server"],
      interpreter: "none",
      env: {"EXA_API_KEY": "b9ad4b15-1cc9-42bd-9a9b-55cec7a86edc"},
      autorestart: true,
      watch: false
    },
    {
      name: "playwright",
      script: "npx",
      args: ["-y", "@playwright/mcp@latest"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "chrome-devtools",
      script: "npx",
      args: ["-y", "chrome-devtools-mcp"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "docker",
      script: "npx",
      args: ["-y", "docker-mcp"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "localstack",
      script: "npx",
      args: ["-y", "@localstack/localstack-mcp-server"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "vercel",
      script: "npx",
      args: ["-y", "--package", "@vercel/sdk", "--", "mcp", "start"],
      interpreter: "none",
      env: {"VERCEL_TOKEN": "YOUR_VERCEL_TOKEN"},
      autorestart: true,
      watch: false
    },
    {
      name: "sequentialthinking",
      script: "docker",
      args: ["run", "--rm", "-i", "danielapatin/sequentialthinking:latest", "-transport", "stdio"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "notebooklm",
      script: "npx",
      args: ["notebooklm-mcp@latest"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    },
    {
      name: "azure-mcp",
      script: "uvx",
      args: ["--from", "msmcp-azure", "azmcp", "server", "start"],
      interpreter: "none",
      env: {},
      autorestart: true,
      watch: false
    }
  ]
};
