# Papercuts Skill

A drop-in Hermes skill for recording real workflow papercuts directly from any
agent project. It has no runtime package dependency: Node executes the
TypeScript CLI in place and writes local JSONL telemetry next to the skill.

## Requirements

Use Node.js 22.6 or newer, which supports direct TypeScript execution with
`node`. No `npm install` is needed to use the skill.

## Download and install into a project

From the root of the project that owns the agent configuration:

```bash
mkdir -p ./agents/skills
curl -L https://github.com/LeonMueller-OneAndOnly/papercuts-skill/archive/refs/heads/main.tar.gz \
  -o /tmp/papercuts-skill.tar.gz
tar -xzf /tmp/papercuts-skill.tar.gz -C /tmp
cp -R /tmp/papercuts-skill-main/skills/agent-tools/papercuts ./agents/skills/papercuts
```

The resulting project-local skill is:

```text
./agents/skills/papercuts/
├── SKILL.md
├── .gitignore
├── logs/
└── scripts/papercuts.ts
```

The `SKILL.md` file is the agent-facing instruction file. The `scripts`
directory contains the executable implementation.

## Use directly with Node

From the project root, record a papercut without installing anything:

```bash
node ./agents/skills/papercuts/scripts/papercuts.ts report \
  --category broken-link \
  --message "The documentation link returned 404" \
  --url https://example.test/docs \
  --tool web_extract
```

List recorded entries:

```bash
node ./agents/skills/papercuts/scripts/papercuts.ts list
node ./agents/skills/papercuts/scripts/papercuts.ts list \
  --category broken-link \
  --json
```

`--category` and `--message` are required for reports. Available categories
are `dead-end-tool-call`, `broken-link`, `shell-surprise`, `friction`, and
`other`. Optional context flags are `--tool`, `--url`, `--project`, `--session`,
`--model`, and `--agent`.

## Logs

Entries are written to:

```text
./agents/skills/papercuts/logs/papercuts.jsonl
```

The skill-local `.gitignore` excludes log contents from version control while
keeping the directory available. Do not record secrets, access tokens, or
private user content in papercut messages.

## Development in this repository

The repository includes tests and build tooling for contributors. To work on
the implementation itself:

```bash
npm install
npm run check
npm run build
```
