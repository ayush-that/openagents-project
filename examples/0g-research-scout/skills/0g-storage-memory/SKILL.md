---
name: 0g-storage-memory
description: Publish agent packages, MEMORY.md snapshots, and run logs to 0G Storage.
env:
  - OG_STORAGE_PRIVATE_KEY
  - OG_STORAGE_RPC_URL
  - OG_STORAGE_INDEXER
---

# 0G Storage Memory

Package these files before upload:

- agent.json
- SOUL.md
- MEMORY.md
- workflow.json
- skills/**/SKILL.md

Upload flow:

1. Create a file/blob package.
2. Generate its 0G Storage Merkle root.
3. Upload through the 0G Storage indexer.
4. Store the returned root in `manifest.0g.json`.
