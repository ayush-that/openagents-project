# Hackathon Plan

## Locked direction

Build **ClawBuilder 0G**, a no-code/low-code framework tool for generating portable OpenClaw/FastClaw-style agents.

## Base decision

FastClaw is the best reference/base because it already has:

- agent factory/dashboard concept
- agent CRUD
- per-agent provider config
- custom OpenAI-compatible `apiBase`
- `SOUL.md` and `MEMORY.md`
- `SKILL.md` compatibility
- provider/model pages

GoClaw is useful as a compatibility reference, but its no-code UI and agent CRUD are less complete.

## MVP feature set

1. Drag/drop builder canvas
2. 0G Compute provider defaults
3. Agent persona + memory editor
4. Skill list editor
5. Workflow editor
6. Live export preview
7. Downloadable agent package
8. 0G Storage manifest

## Demo script

1. Open ClawBuilder 0G.
2. Drag persona/model/memory/skill/workflow blocks into the canvas.
3. Show 0G Compute router preset.
4. Customize `SOUL.md` and `MEMORY.md`.
5. Add or disable a skill.
6. Show live `manifest.0g.json`.
7. Export zip.
8. Show generated `agent.json`, `SOUL.md`, `MEMORY.md`, and `SKILL.md` files.

## Judging story

This is not "just an agent." It is reusable framework tooling that lets other developers build 0G-backed agents faster.
