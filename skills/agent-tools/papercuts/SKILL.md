---
name: papercuts
description: "Use when an agent encounters a dead-end tool call, broken link, shell surprise, or other workflow friction; record the issue with the papercuts CLI instead of silently pushing through it."
license: MIT
metadata:
  hermes:
    tags: [agents, observability, workflow, papercuts, cli]
---

# Papercuts

Record small, actionable workflow failures that would otherwise disappear from
an agent run. This is deliberately lightweight: append one structured JSONL
entry and continue the task. Do not invent a papercut; record only a problem
that actually occurred.

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
`--model`, and `--agent`. The CLI also reads `PAPERCUTS_PROJECT`,
`PAPERCUTS_SESSION`, `PAPERCUTS_MODEL`, and `PAPERCUTS_AGENT` from the
environment. If no message is supplied, a non-interactive stdin message is
accepted.

## Storage and privacy

Entries are written to `logs/papercuts.jsonl`. That folder is ignored by
`skills/agent-tools/papercuts/.gitignore`; never record secrets, tokens, or
private user content. Logs are local telemetry, not an issue tracker.

## Inspect local entries

```bash
npm run papercuts -- list
npm run papercuts -- list --category broken-link --json
```

Turn recurring patterns into fixes, tests, or documentation. Logging alone
should not stop the task unless the issue blocks progress.
