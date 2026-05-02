# ClawBuilder 0G

Drag-and-drop no-code builder for portable OpenClaw/FastClaw-style agents that use **0G Compute** as the OpenAI-compatible inference layer and **0G Storage** as the package, memory, and run-log layer.

Built for [ETHGlobal OpenAgents](https://ethglobal.com/events/openagents/) and focused on the 0G framework/tooling track.

## Why this wins the track

0G's track rewards framework-level work, not just one-off agents. ClawBuilder 0G is a reusable builder that other hackers can use to generate 0G-native agent packages:

- drag/drop builder canvas for persona, model, memory, skills, and workflows
- 0G Compute provider preset at `https://router-api.0g.ai/v1`
- OpenClaw/FastClaw-style exports: `SOUL.md`, `MEMORY.md`, `SKILL.md`, `agent.json`
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

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
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

This MVP intentionally optimizes for hackathon feasibility:

- yes: no-code drag/drop builder
- yes: 0G provider preset and export manifest
- yes: portable FastClaw/OpenClaw-style files
- not yet: full arbitrary graph runtime
- not yet: hosted production multi-tenant agent execution