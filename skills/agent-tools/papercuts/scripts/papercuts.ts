#!/usr/bin/env node

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CATEGORIES = [
  "dead-end-tool-call",
  "broken-link",
  "shell-surprise",
  "friction",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface PaperCut {
  timestamp: string;
  category: Category;
  message: string;
  tool?: string;
  url?: string;
  project?: string;
  session?: string;
  model?: string;
  agent?: string;
}

const skillDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const defaultLogFile = join(skillDirectory, "logs", "papercuts.jsonl");

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function createPaperCut(
  input: Omit<PaperCut, "timestamp"> & { timestamp?: string },
): PaperCut {
  const message = input.message.trim();
  if (!message) throw new Error("--message must not be empty");
  if (!CATEGORIES.includes(input.category)) {
    throw new Error(`Invalid category: ${input.category}`);
  }
  const tool = nonEmpty(input.tool);
  const url = nonEmpty(input.url);
  const project = nonEmpty(input.project);
  const session = nonEmpty(input.session);
  const model = nonEmpty(input.model);
  const agent = nonEmpty(input.agent);

  return {
    timestamp: input.timestamp ?? new Date().toISOString(),
    category: input.category,
    message,
    ...(tool && { tool }),
    ...(url && { url }),
    ...(project && { project }),
    ...(session && { session }),
    ...(model && { model }),
    ...(agent && { agent }),
  };
}

export async function appendPaperCut(
  paperCut: PaperCut,
  logFile = process.env.PAPERCUTS_LOG_FILE || defaultLogFile,
): Promise<void> {
  await mkdir(dirname(logFile), { recursive: true });
  await appendFile(logFile, `${JSON.stringify(paperCut)}\n`, "utf8");
}

export async function readPaperCuts(logFile = process.env.PAPERCUTS_LOG_FILE || defaultLogFile): Promise<PaperCut[]> {
  if (!existsSync(logFile)) return [];
  const content = await readFile(logFile, "utf8");
  const entries: PaperCut[] = [];
  for (const [index, line] of content.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as PaperCut);
    } catch {
      throw new Error(`Invalid JSONL at ${logFile}:${index + 1}`);
    }
  }
  return entries;
}

type ParsedArgs = {
  command: "report" | "list" | "help";
  values: Record<string, string>;
  flags: Set<string>;
  positional: string[];
};

function parseArgs(args: string[]): ParsedArgs {
  const [first, ...rest] = args;
  const command = first === "list" || first === "help" ? first : "report";
  const tokens = first === "list" || first === "help" ? rest : args;
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  const positional: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replaceAll("-", "_");
    if (inlineValue !== undefined) {
      values[key] = inlineValue;
    } else if (tokens[i + 1] && !tokens[i + 1].startsWith("--")) {
      values[key] = tokens[++i];
    } else {
      flags.add(key);
    }
  }
  return { command, values, flags, positional };
}

function usage(): string {
  return `Usage:
  papercuts report --category <category> --message <text> [options]
  papercuts list [--category <category>] [--json]

Categories: ${CATEGORIES.join(", ")}
Report options: --tool --url --project --session --model --agent --log-file`;
}

function category(value: string | undefined): Category {
  if (value && CATEGORIES.includes(value as Category)) return value as Category;
  throw new Error(`--category must be one of: ${CATEGORIES.join(", ")}`);
}

async function messageFromInput(value: string | undefined, positional: string[]): Promise<string> {
  const direct = nonEmpty(value) ?? nonEmpty(positional.join(" "));
  if (direct) return direct;
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    const stdinMessage = Buffer.concat(chunks).toString("utf8").trim();
    if (stdinMessage) return stdinMessage;
  }
  throw new Error("A message is required via --message or stdin");
}

export async function runCli(args: string[]): Promise<string> {
  const parsed = parseArgs(args);
  if (parsed.command === "help") return usage();

  const logFile = parsed.values.log_file || process.env.PAPERCUTS_LOG_FILE || defaultLogFile;
  if (parsed.command === "list") {
    let entries = await readPaperCuts(logFile);
    if (parsed.values.category) entries = entries.filter((entry) => entry.category === parsed.values.category);
    return parsed.flags.has("json")
      ? JSON.stringify(entries, null, 2)
      : entries.map((entry) => `${entry.timestamp} [${entry.category}] ${entry.message}`).join("\n") || "No papercuts recorded.";
  }

  const paperCut = createPaperCut({
    category: category(parsed.values.category),
    message: await messageFromInput(parsed.values.message, parsed.positional),
    tool: parsed.values.tool,
    url: parsed.values.url,
    project: parsed.values.project || process.env.PAPERCUTS_PROJECT,
    session: parsed.values.session || process.env.PAPERCUTS_SESSION,
    model: parsed.values.model || process.env.PAPERCUTS_MODEL,
    agent: parsed.values.agent || process.env.PAPERCUTS_AGENT,
  });
  await appendPaperCut(paperCut, logFile);
  return `Recorded [${paperCut.category}] ${paperCut.message}`;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli(process.argv.slice(2))
    .then((output) => {
      if (output) console.log(output);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
