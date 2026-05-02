# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Tessra** — a Vite + React 19 single-page no-code builder that generates portable OpenClaw/FastClaw-style agent packages targeting 0G Compute (inference) and 0G Storage (package/memory/log layer). Hackathon submission for the **0G — Best Agent Framework, Tooling & Core Extensions** track.

The app has no backend. Everything runs client-side; the "export" produces a downloadable zip.

## Commands

Package manager is **bun** (`packageManager: bun@1.3.13`).

```bash
bun install
bun run dev          # vite dev server
bun run build        # tsc -b && vite build
bun run typecheck    # tsc -b
bun run lint         # oxlint
bun run lint:fix     # oxlint --fix
bun run format       # oxfmt (writes)
bun run format:check # oxfmt --check
bun run preview      # preview built assets
```

There is no test suite. Linting is `oxlint`; formatting is `oxfmt`. Run typecheck separately — it's not part of `lint`.

## Architecture

The whole product is a tiny set of files under `src/`:

- `src/types.ts` — single source of truth for the domain model: `AgentDraft`, `AgentManifest`, `SkillDraft`, `SkillPack`, `WorkflowStep`, `AgentTemplate`, `BlockKind`. Every other file conforms to these types.
- `src/agentPackage.ts` — pure logic for turning an `AgentDraft` into the export artifacts: `createManifest` (manifest.0g.json), `createAgentConfig` (agent.json), `skillMarkdown` (per-skill SKILL.md with frontmatter), `buildAgentZip` (assembles the zip via JSZip), `downloadBlob`. Also exports `starterAgent` and the constant `ZERO_G_ROUTER_URL = "https://router-api.0g.ai/v1"`. The two skills `0g-compute` and `0g-storage-memory` get hardcoded markdown bodies; everything else is generated from `SkillDraft` fields.
- `src/skillPacks.ts` — curated `SkillPack[]` data (sourced from VoltAgent/awesome-openclaw-skills). Adding a pack here makes it appear in the palette and in templates.
- `src/agentTemplates.ts` — one-click `AgentTemplate[]` presets (soul + memory + skill pack ids + workflow steps). Templates reference packs by id from `skillPacks.ts`.
- `src/App.tsx` — the entire UI (~59k, single file). Builds the React Flow (`@xyflow/react`) drag-and-drop canvas, the palette/inspector panels, the live `manifest.0g.json` preview, the Three.js hero animation, and the export trigger. Block kinds on the canvas come from `BlockKind` plus a synthetic `"skillPack"` kind.
- `src/styles.css` — Tailwind v4 entry. Tailwind is wired via the `@tailwindcss/vite` plugin (no `tailwind.config.js`).

Vite config (`vite.config.ts`) splits `three` into its own chunk and raises `chunkSizeWarningLimit` to 650 — keep that in mind if bundle size warnings appear.

### Export contract

Output of `buildAgentZip` (this is the public contract — downstream FastClaw/OpenClaw runtimes consume it):

```
agent.json            # createAgentConfig — provider + model + storage
SOUL.md               # agent.soul
MEMORY.md             # agent.memory
workflow.json         # agent.workflow
manifest.0g.json      # createManifest, schema "tessra.0g.agent.v1"
README.md             # generated minimal run instructions
skills/<slug>/SKILL.md  # one per enabled skill, frontmatter + body
```

Skill path slugs are normalized in `createSkillExportEntries` (lowercase, non-alphanumerics → `-`, max 48 chars, deduped with numeric suffix). When changing skill identity logic, update both `createManifest` and `buildAgentZip` since they share `createSkillExportEntries`.

### 0G integration shape

Generated agents always declare an OpenAI-compatible provider pointed at `https://router-api.0g.ai/v1` with bearer auth keyed off `OG_API_KEY`. Storage URIs follow the `0g://package/{rootHash}`, `0g://memory/{agentId}/MEMORY.md`, `0g://logs/{agentId}/{sessionId}.jsonl` patterns. Don't change these defaults without also updating `starterAgent`, the templates, and the `0g-compute` / `0g-storage-memory` hardcoded SKILL.md bodies.

## Conventions specific to this repo

- React 19 + StrictMode. Functional components only.
- TypeScript strict; the build command runs `tsc -b` against project references (`tsconfig.app.json` for app, `tsconfig.node.json` for build tooling).
- No router, no state library — `App.tsx` owns all state via `useState`.
- Imports use relative paths (no path aliases configured).
- Don't introduce a backend, server-side rendering, or persistence — the product is intentionally client-only and the export _is_ the output.

## Environment

`.env.example` lists placeholders consumed by the _generated_ agent runtime, not by the builder app itself:

- `OG_API_KEY` — 0G Compute router key
- `OG_STORAGE_PRIVATE_KEY` — wallet for 0G Storage uploads
- `OG_STORAGE_RPC_URL` — defaults to `https://evmrpc-testnet.0g.ai`
- `OG_STORAGE_INDEXER` — defaults to `https://indexer-storage-testnet-turbo.0g.ai`

The Vite dev server does not need any of these.

## Scope

The MVP is the visual builder + export. Live agent execution, hosted multi-tenant runtime, and arbitrary graph runtime are **explicitly out of scope** — don't add them unless asked.
