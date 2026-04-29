# ClawBuilder 0G

Drag-and-drop no-code builder for portable OpenClaw/FastClaw-style agents that use **0G Compute** as the OpenAI-compatible inference layer and **0G Storage** as the package, memory, and run-log layer.

## Why this exists

0G-backed agents should be easy to design, inspect, and move between runtimes. ClawBuilder 0G is reusable product tooling for generating 0G-native agent packages:

- drag/drop builder canvas for persona, model, memory, skills, and workflows
- 0G Compute provider preset at `https://router-api.0g.ai/v1`
- OpenClaw/FastClaw-style exports: `SOUL.md`, `MEMORY.md`, `SKILL.md`, `agent.json`
- prebuilt skill packs curated from [`VoltAgent/awesome-openclaw-skills`](https://github.com/VoltAgent/awesome-openclaw-skills)
- `manifest.0g.json` that maps packages, memory snapshots, and run logs to 0G Storage
- downloadable agent zip that can be adapted by FastClaw, GoClaw, or OpenClaw-style runtimes

## 0G integration points

### 0G Compute

Generated agents include an OpenAI-compatible provider config:

```json
{
  "0g": {
    "apiBase": "https://router-api.0g.ai/v1",
    "apiKey": "env:OG_API_KEY",
    "apiType": "openai-chat",
    "authType": "bearer-token"
  }
}
```

This follows the FastClaw/GoClaw provider pattern: the agent runtime stays portable, while model calls route through 0G.

### 0G Storage

The exported `manifest.0g.json` declares:

- package URI: `0g://package/{rootHash}`
- memory URI: `0g://memory/{agentId}/MEMORY.md`
- log URI: `0g://logs/{agentId}/{sessionId}.jsonl`

The included `0g-storage-memory` skill describes how to package files and upload via `@0gfoundation/0g-ts-sdk`.

## Prebuilt skill packs

The builder ships curated packs that can be added before export:

| Pack | Source category | Includes |
| --- | --- | --- |
| Research Intel | Search & Research | `academic-deep-research`, `arxiv-search-collector`, `airadar` |
| Agent Security | Security & Skill Trust | `aegis-shield`, `arc-trust-verifier`, `agentic-security-audit` |
| Web Operator | Browser & Automation | `actionbook`, `agentic-browser`, `agent-analytics` |
| GitOps Builder | Git & GitHub | `agent-team-orchestration`, `arc-skill-gitops`, `azure-devops` |
| Cloud Deploy | DevOps & Cloud | `agentscale`, `arc-agent-lifecycle`, `gotify` |
| Data Analytics | Data & Analytics | `biz-reporter`, `amazon-product-api-skill`, `aeo-analytics-free` |
| 0G Native Runtime | Coding Agents & IDEs | `0g-compute`, `agent-config`, `agent-context`, `agent-cost-monitor`, `agent-audit-trail` |
| Autonomous Ops | Productivity & Tasks | `adaptive-reasoning`, `agent-autopilot`, `agent-task-manager`, `async-task`, `autonomous-execution` |
| Agent UI Control | Coding Agents & IDEs | `agent-chat-ux-v1-4-0`, `agent-dashboard`, `agent-topology-visualizer`, `figma` |
| Memory Knowledge | Notes & PKM | `2nd-brain`, `airweave`, `markdown-converter`, `markdown-formatter` |
| Comms Scheduler | Communication | `calendar-scheduling`, `clippy`, `gmail-last5`, `ai-daily-briefing` |

Each exported `SKILL.md` includes source metadata so users can inspect the upstream ClawHub page before wiring real credentials or tool permissions.

## One-click templates

Templates load a complete agent profile, workflow, storage URI pattern, and bundled skill packs:

| Template | Purpose | Packs |
| --- | --- | --- |
| 0G Research Scout | market, paper, competitor, and technical-doc research | Research Intel, Memory Knowledge, 0G Native Runtime |
| Secure Web Operator | browser automation with prompt-injection screening | Web Operator, Agent Security, 0G Native Runtime |
| Founder Autopilot | async personal ops, briefs, reminders, and execution loops | Autonomous Ops, Comms Scheduler, Memory Knowledge, 0G Native Runtime |
| Shipyard Engineer | software delivery, PRs, deploys, audits, and release notes | GitOps Builder, Cloud Deploy, Agent Security, Agent UI Control, 0G Native Runtime |

## Run locally

```bash
bun install
bun run dev
```

Build:

```bash
bun run build
```

## Environment

Copy `.env.example` if you wire the generated package into a runtime:

```bash
cp .env.example .env
```

Required placeholders:

- `OG_API_KEY` — 0G Compute router API key
- `OG_STORAGE_PRIVATE_KEY` — wallet key for 0G Storage upload flows
- `OG_STORAGE_RPC_URL` — default `https://evmrpc-testnet.0g.ai`
- `OG_STORAGE_INDEXER` — default `https://indexer-storage-testnet-turbo.0g.ai`

## Hackathon transparency

See [HACKATHON_TRANSPARENCY.md](./HACKATHON_TRANSPARENCY.md) for fresh-work notes, reused libraries/assets, AI-assistance attribution, and the demo video checklist.

## Exported agent package

Click **Export agent package** in the UI. The zip contains:

```text
agent.json
SOUL.md
MEMORY.md
workflow.json
manifest.0g.json
skills/
  0g-compute/SKILL.md
  0g-storage-memory/SKILL.md
  evidence-summarizer/SKILL.md
  ...selected skill-pack SKILL.md files
```

## Architecture

```text
No-code UI
  ├─ drag/drop blocks
  ├─ provider form
  ├─ skill editor
  └─ workflow editor
        ↓
Agent package generator
        ↓
OpenClaw/FastClaw-compatible files
        ↓
0G Compute router + 0G Storage package/memory/logs
```

## Scope

This MVP intentionally focuses on the product core:

- yes: no-code drag/drop builder
- yes: 0G provider preset and export manifest
- yes: portable FastClaw/OpenClaw-style files
- not yet: full arbitrary graph runtime
- not yet: hosted production multi-tenant agent execution