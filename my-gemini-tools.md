# Gemini CLI Tools & Configuration Audit: Cape Town GIS Platform
**DATE:** Tuesday, March 10, 2026
**AUDIT STATUS:** [✅ COMPLETE]
**METHODOLOGY:** Ralph Wiggum Exhaustive Discovery v4.0

---

## 📊 SYSTEM DASHBOARD
| Category | Total Count | Status |
| :--- | :---: | :--- |
| **Active Agents** | 31 | Synced |
| **MCP Servers** | 22 | Registered |
| **Skills & Tools** | 45+ | Available |
| **Lifecycle Hooks** | 7 | Active |
| **Extensions** | 26 | Active |
| **Governance Policies** | 4 | Enforced |

---

## 🤖 1. AGENTS (Canonical Fleet & Specialized Roles)
| Name | Scope | Origin | Primary Role |
| :--- | :--- | :--- | :--- |
| `@generalist` | Global | Built-in | General purpose task execution |
| `@planner` | Global | Built-in | Task planning and breakdown |
| `@scout` | Global | Built-in | Codebase exploration and mapping |
| `@coder` | Global | Built-in | Implementation and refactoring |
| `@tester` | Global | Built-in | Test generation and execution |
| `@reviewer` | Global | Built-in | Code review and quality checks |
| `@debugger` | Global | Built-in | Root cause analysis and fixing |
| `@git-manager` | Global | Built-in | Version control management |
| `@copywriter` | Global | Built-in | Marketing and content creation |
| `@database-admin` | Global | Built-in | DB schema and query management |
| `@researcher` | Global | Built-in | External research and docs lookup |
| `@ui-designer` | Global | Built-in | UI/UX design and prototyping |
| `@docs-manager` | Global | Built-in | Documentation lifecycle management |
| `@project-manager` | Global | Built-in | Project status and task tracking |
| `@fullstack-developer` | Global | Built-in | End-to-end web development |
| `@backend-specialist` | Global | Built-in | API and infrastructure expert |
| `@devops-engineer` | Global | Built-in | CI/CD and cloud deployment |
| `@frontend-specialist` | Global | Built-in | React/Next.js and UI expert |
| `@huggingface-skills` | Global | Built-in | ML and HF Hub integration |
| `@orchestrator` | Local | Custom | Copilot mission control (`.github/agents/`) |
| `@infra-agent` | Local | Custom | System architecture (`.github/agents/`) |
| `@map-agent` | Local | Custom | MapLibre GL JS expert (`.github/copilot/agents/`) |
| `@data-agent` | Local | Custom | Ingestion pipeline (`.github/copilot/agents/`) |
| `@spatial-agent` | Local | Custom | PostGIS analysis (`.github/copilot/agents/`) |
| `@db-agent` | Local | Custom | DB governance (`.github/copilot/agents/`) |
| `@cesium-agent` | Local | Custom | 3D Visualization (`.github/copilot/agents/`) |
| `@immersive-reconstruction` | Local | Custom | NeRF/3DGS pipeline (`.github/copilot/agents/`) |
| `@flight-tracking-agent` | Local | Custom | OpenSky network feed (`.github/copilot/agents/`) |
| `@test-agent` | Local | Custom | Quality assurance (`.github/copilot/agents/`) |
| `@formats-agent` | Local | Custom | GIS format inventory (`.github/copilot/agents/`) |
| `@bootstrap-agent` | Local | Custom | Initial setup (`.gemini/agents/`) |

---

## 🚀 2. MCP SERVERS
| Name | Scope | Origin | Capability |
| :--- | :--- | :--- | :--- |
| `nano-banana` | Global | Built-in | Image generation API |
| `chrome-devtools` | Global | Built-in | Browser automation & inspection |
| `filesystem` | Global | Built-in | Root-level workspace access |
| `postgres` | Global | Built-in | PostGIS interaction via pg_pool |
| `vercel` | Global | Custom | Vercel deployment & log monitoring |
| `gemini-deep-research`| Global | Custom | Multi-step neural research |
| `context7` | Global | Custom | Library & framework documentation |
| `exa` | Global | Custom | Advanced neural web search |
| `playwright` | Global | Custom | E2E browser testing & automation |
| `docker` | Global | Custom | Local container management |
| `localstack` | Global | Custom | AWS cloud simulation for GIS |
| `sequentialthinking` | Global | Custom | Structural reasoning chain |
| `gis-mcp` | Global | Custom | High-fidelity GIS ops (uvx) |
| `cesium-ion` | Global | Custom | Native 3D asset server (SSE) |
| `opensky` | Global | Custom | Aviation feed wrapper |
| `nerfstudio` | Global | Custom | 3D reconstruction pipeline server |
| `cesium` | Local | Custom | 3D Asset manager (`mcp/cesium/`) |
| `computer-use` | Local | Custom | Desktop interaction (`mcp/computerUse/`) |
| `doc-state` | Local | Custom | Document sync & atomic locking |
| `formats` | Local | Custom | GIS validation (`mcp/formats/`) |
| `openaware` | Local | Custom | Aviation situational awareness |
| `stitch` | Local | Custom | Gaussian Splatting/NeRF pipeline |

---

## 🛠️ 3. SKILLS & TOOLS
| Name | Scope | Origin | Description |
| :--- | :--- | :--- | :--- |
| `skill-creator` | Global | Built-in | Create/Update CLI skills |
| `debug-optimize-lcp` | Global | Built-in | Frontend performance auditing |
| `chrome-devtools` | Global | Built-in | Live browser inspection |
| `a11y-debugging` | Global | Built-in | Accessibility (WCAG) auditing |
| `web-search-*` | Global | Built-in | Specialized neural search suite |
| `get-code-context-exa`| Global | Built-in | GitHub/StackOverflow snippet retrieval |
| `testing` | Global | Built-in | Unit/Integration test patterns |
| `session-resume` | Global | Built-in | Context persistence |
| `file-todos` | Global | Built-in | Markdown-based work tracking |
| `code-review` | Global | Built-in | High-fidelity architectural review |
| `gradio` | Global | Built-in | ML UI prototyping |
| `hugging-face-*` | Global | Built-in | ML Hub & training suite (9 skills) |
| `conductor-setup` | Global | Built-in | Project/Track initialization |
| `git-commit` | Global | Built-in | Semantic commit automation |
| `documentation` | Global | Built-in | Multi-format doc generation |
| `white-label-theming` | Local | Custom | Theme generation from config |
| `popia_compliance_check`| Local | Custom | SA Privacy Law auditing |
| `multitenancy-rls` | Local | Custom | Spatial data isolation policies |
| `mock_to_live_validation`| Local | Custom | Data transition validation |
| `gis-data-importer` | Local | Custom | Cape Town specific data ingestion |
| `documentation_first_design`| Local | Custom | Workflow enforcement rules |
| `docker-gis-stack` | Local | Custom | Local dev environment mgmt |
| `cape_town_gis_research`| Local | Custom | GIS source verification protocol |
| `assumption_verification`| Local | Custom | Fact-checking workflow |

---

## 🪝 4. LIFECYCLE HOOKS
| Hook Name | Scope | Origin | Command / Script |
| :--- | :--- | :--- | :--- |
| `SessionStart` | Local | Custom | `gis-context-init` |
| `BeforeAgent` | Local | Custom | `gis-context-injection` |
| `BeforeTool` | Local | Custom | `gis-safety-guard` |
| `AfterAgent` | Local | Custom | `gis-output-validator` |
| `AfterTool` | Local | Custom | `gis-doc-index-sync` |
| `AfterTool` | Local | Custom | `gis-tool-observer` |
| `SessionEnd` | Local | Custom | `gis-session-memory` |

---

## 🧩 5. EXTENSIONS
| Name | Scope | Origin | Status |
| :--- | :--- | :--- | :--- |
| `google-workspace` | Global | Built-in | Enabled |
| `gemini-deep-research`| Global | Built-in | Enabled |
| `exa-mcp-server` | Global | Built-in | Enabled |
| `chrome-devtools-mcp` | Global | Built-in | Enabled |
| `mcp-computer-use` | Global | Built-in | Enabled |
| `gemini-kit` | Global | Built-in | Enabled |
| `git-expert` | Global | Built-in | Enabled |
| `google-maps-platform`| Global | Built-in | Enabled |
| `vercel-mcp` | Global | Built-in | Enabled |
| `open-aware` | Global | Built-in | Enabled |
| `sonarqube-mcp-server`| Global | Built-in | Enabled |
| `oh-my-gemini` | Global | Built-in | Enabled |

---

## ⚖️ 6. POLICIES & GOVERNANCE
| Name | Scope | Origin | Description |
| :--- | :--- | :--- | :--- |
| `CLAUDE.md Rules` | Local | Custom | Non-negotiable project constraints |
| `Escalation Protocol` | Local | Custom | Conflict and dependency resolution |
| `Ralph Wiggum Mode` | Local | Custom | High-fidelity technical mandates |
| `Auto Doc Rules` | Local | Custom | Recursive index synchronization rules |

---
*"I counted every one! Even the shy ones hiding in the sub-folders!"* — Ralph Wiggum 🐢✨
