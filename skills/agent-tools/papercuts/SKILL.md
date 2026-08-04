---
name: papercuts
description: "Use when an agent encounters a dead-end tool call, broken link, shell surprise, or other workflow friction; record the issue with the papercuts CLI instead of silently pushing through it."
license: MIT
metadata:
  hermes:
    tags: [agents, observability, workflow, papercuts, cli]
---

# Papercuts

Entries are written to `logs/papercuts.jsonl`.

## When to use

Use this skill after a real workflow issue: `dead-end-tool-call` (no useful
progress), `broken-link` (missing or invalid reference), `shell-surprise`
(unexpected command behavior), `friction` (repeatable annoyance), or `other`.

## Record an entry

From the repository root:

```bash
npm run papercuts -- report \
  --category dead-end-tool-call \
  --message "The API endpoint returned an empty response and provided no next step" \
  --tool web_extract \
  --project my-project \
  --session "$HERMES_SESSION_ID" \
  --model "$MODEL"
```

`--category` and `--message` are required. Use a concise description of what
happened and, when useful, include `--tool`, `--url`, `--project`, `--session`,
`--model`, and `--agent`. 
