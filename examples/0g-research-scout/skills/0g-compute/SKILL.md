---
name: 0g-compute
description: Route agent inference through 0G Compute's OpenAI-compatible router.
env:
  - OG_API_KEY
---

# 0G Compute

Use the configured OpenAI-compatible provider:

- Base URL: `https://router-api.0g.ai/v1`
- API key: `env:OG_API_KEY`
- Auth: bearer token

Generated agents should call the normal chat-completions interface so they remain portable across FastClaw, GoClaw, and OpenClaw-style runtimes.
