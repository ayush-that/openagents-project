# Hackathon Transparency

This document is included for ETHGlobal-style review requirements: show what was built during the event, what was reused, and where AI assistance was involved.

## Fresh work during the event

Axiom was built in this repository during the hackathon window. The git history shows incremental work rather than one large final commit, including:

- initial Vite/React/Bun app scaffold
- 0G agent package documentation
- drag-and-drop builder canvas
- React Flow canvas migration
- curated OpenClaw skill packs and one-click templates
- Nucleo glass icon UI pass
- responsive builder polish, export fixes, and final runtime testing

## Reused/open-source libraries and assets

- React, Vite, TypeScript, Tailwind CSS, React Flow, Three.js, and JSZip are open-source dependencies installed through `package.json`.
- Bundled fonts come from `@fontsource/geist`, `@fontsource/geist-mono`, and `@fontsource/instrument-serif`.
- Visible UI icons come from Nucleo SVG Glass Icons. Attribution and license reference are in `public/nucleo-glass/NOTICE.txt`.
- Prebuilt skill-pack ideas and source metadata are curated from the public `VoltAgent/awesome-openclaw-skills` repository. Exported skills include source metadata so users can inspect upstream pages before wiring real credentials.
- The footer/layout, dot-matrix styling, and ASCII/terminal references were used as design inspiration only; no third-party UI template code was copied into the app.

## AI tool usage

AI tools were used as development assistance for implementation, debugging, UI polish, documentation, and testing. Human direction specified the product concept, 0G/OpenClaw focus, visual direction, icon/font preferences, responsive requirements, and review feedback.

AI-assisted areas include:

- React/Tailwind UI implementation in `src/App.tsx` and `src/styles.css`
- agent export/package generation in `src/agentPackage.ts`
- curated template and skill-pack structure in `src/agentTemplates.ts` and `src/skillPacks.ts`
- README/product documentation updates
- runtime test plans, preview testing, and PR review iteration

No plaintext API keys or wallet secrets are committed. `.env` files are ignored, and `.env.example` contains placeholders only.

## Current product scope

The app currently builds and exports portable OpenClaw/FastClaw-style agent packages with 0G Compute and 0G Storage defaults. It does not yet host a production multi-tenant runtime or execute arbitrary live agent graphs by itself.

## Partner prize positioning

Target track: **0G — Best Agent Framework, Tooling & Core Extensions**.

Axiom is a framework/tooling submission: a visual assembly layer for generating portable OpenClaw/FastClaw-style agent packages with 0G Compute provider config, 0G Storage URI manifests, curated skill packs, and runbook export. This aligns with the track's no-code/low-code visual agent builder prompt and avoids presenting the project as a single agent with 0G added afterward.

## Demo video checklist

For ETHGlobal submission, the demo video should:

- be 2 to 4 minutes long
- be at least 720p
- use a real spoken walkthrough, not AI voiceover or text-to-speech
- show the builder in action, template configuration, skill-pack editing, export, and generated 0G manifest/package files
- keep intro under 20 seconds and avoid long waits
