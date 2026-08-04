# Papercuts Skill

A tiny Hermes-compatible skill plus a TypeScript/Node.js CLI for recording the
small workflow failures that agents would otherwise silently push through:
dead-end tool calls, broken links, shell surprises, and other friction.

## Quick start

```bash
npm install
npm run papercuts -- report \
  --category broken-link \
  --message "The documentation link returned 404" \
  --url https://example.test/docs

npm run papercuts -- list
npm run check
```

The CLI writes one JSON object per line to
`skills/agent-tools/papercuts/logs/papercuts.jsonl`. Logs are intentionally
local: the skill folder has its own `.gitignore`, and the log contents are not
included in Git commits.

## Repository layout

```text
skills/agent-tools/papercuts/
├── SKILL.md                    # Hermes skill instructions
├── .gitignore                  # local log exclusion for this skill
├── logs/.gitkeep               # keeps the log directory present
└── scripts/papercuts.ts        # TypeScript CLI and reusable functions
```

## CLI

```text
papercuts report --category <category> --message <text> [options]
papercuts list [--category <category>] [--json]
```

Categories are `dead-end-tool-call`, `broken-link`, `shell-surprise`,
`friction`, and `other`. Optional context can be supplied with `--tool`,
`--url`, `--project`, `--session`, `--model`, and `--agent`. The same values
can be supplied through `PAPERCUTS_*` environment variables.

The default log file can be overridden for tests or integrations with
`PAPERCUTS_LOG_FILE` or `--log-file`.
