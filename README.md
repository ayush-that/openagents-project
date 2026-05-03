<img width="972" height="582" alt="image" src="https://github.com/user-attachments/assets/24586df9-ab0a-487b-a86f-3f65d902dc6c" />

# Tessra

Tessra is a visual workspace for designing portable AI agents. Compose an agent's persona, model config, memory, skills, and runbook on one canvas, then export a runtime-ready package.

## Features

- Visual agent builder with draggable base blocks and skill packs
- One-click templates for research, web automation, founder ops, and engineering agents
- Live export preview for `agent.json`, `manifest.0g.json`, and storage targets
- Downloadable zip with persona, memory, workflow, manifest, and selected skills
- 0G Compute and Storage defaults that can be swapped or wired into a runtime

## How it works

1. Pick a template or start from the default agent.
2. Add the skill packs your agent needs.
3. Tune the persona, memory, provider config, and workflow.
4. Export the agent package.

The exported package is plain files, so it can be inspected, edited, versioned, or adapted for compatible agent runtimes.

## Exported package

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

## Templates

| Template            | Use case                                                   |
| ------------------- | ---------------------------------------------------------- |
| Research Scout      | Market, paper, competitor, and technical-doc research      |
| Secure Web Operator | Browser automation with prompt-injection screening         |
| Founder Autopilot   | Briefs, reminders, async ops, and execution loops          |
| Shipyard Engineer   | Software delivery, PRs, deploys, audits, and release notes |

## Skill packs

Tessra includes curated packs for research, security, browser automation, GitOps, cloud deploys, data analytics, runtime wiring, autonomous ops, UI control, memory, and communication workflows.

## Local development

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

## Environment

These variables are only needed when connecting exported packages to live 0G services:

```bash
OG_API_KEY=
OG_STORAGE_PRIVATE_KEY=
OG_STORAGE_RPC_URL=https://evmrpc-testnet.0g.ai
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
```

## Tech stack

- React
- TypeScript
- Vite
- React Flow
- Three.js
- Bun
