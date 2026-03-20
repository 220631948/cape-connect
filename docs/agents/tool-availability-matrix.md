# Tool Availability Matrix

Below is the availability matrix of target MCP servers across all supported agents.
Tool counts remain strictly within the 25-50 threshold by standardizing on this core set combined with default platform tools.

| MCP Server | Antigravity (Gemini) | Claude Code | GitHub Copilot | Target Usage |
| :--- | :--- | :--- | :--- | :--- |
| **computerUse** | ✅ | ✅ | ✅ | UI Automation / OS simulation |
| **chrome-devtools** | ✅ | ✅ | ✅ | Network inspection / DOM querying |
| **stitch** | ✅ | ✅ | ✅ | Workflow orchestration |
| **openaware** | ✅ | ✅ | ✅ | Qodo intelligence & repo index |
| **vercel** | ⚠️ | ⚠️ | ⚠️ | Vercel ops (Pending package fix) |

*⚠️ Vercel is configured correctly in all environments but currently returns a 404 from the npm package registry.*
