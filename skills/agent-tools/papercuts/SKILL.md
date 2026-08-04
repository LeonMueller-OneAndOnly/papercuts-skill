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

Use this skill immediately after encountering one of these:

- `dead-end-tool-call`: a tool invocation cannot produce useful progress;
- `broken-link`: a URL, documentation page, or reference is missing or invalid;
- `shell-surprise`: quoting, globbing, cwd, or command behavior differs from
  what was expected;
- `friction`: another repeatable workflow annoyance;
- `other`: a real issue that does not fit the categories above.

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

Entries are written to `logs/papercuts.jsonl` beside this skill. The log
folder is intentionally ignored by `skills/agent-tools/papercuts/.gitignore`.
Do not put secrets, access tokens, or private user content in the message or
context fields. The log is local operational telemetry, not a replacement for
an issue tracker.

## Inspect local entries

```bash
npm run papercuts -- list
npm run papercuts -- list --category broken-link --json
```

Review recurring entries periodically and turn useful patterns into fixes,
tests, or documentation. A papercut report is not itself a reason to stop the
main task unless the issue blocks safe progress.
