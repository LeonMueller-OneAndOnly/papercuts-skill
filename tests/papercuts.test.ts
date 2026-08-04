import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendPaperCut, createPaperCut, readPaperCuts, runCli } from "../skills/agent-tools/papercuts/scripts/papercuts.js";

describe("papercuts", () => {
  it("creates a normalized structured entry", () => {
    expect(createPaperCut({
      timestamp: "2026-08-04T12:00:00.000Z",
      category: "broken-link",
      message: "  Docs link returned 404  ",
      tool: " web_extract ",
      project: "demo",
    })).toEqual({
      timestamp: "2026-08-04T12:00:00.000Z",
      category: "broken-link",
      message: "Docs link returned 404",
      tool: "web_extract",
      project: "demo",
    });
  });

  it("appends JSONL and reads it back as real data", async () => {
    const directory = await mkdtemp(join(tmpdir(), "papercuts-test-"));
    const logFile = join(directory, "nested", "papercuts.jsonl");
    const entry = createPaperCut({ category: "friction", message: "A useful command was missing" });
    await appendPaperCut(entry, logFile);
    await appendPaperCut({ ...entry, message: "A second problem" }, logFile);

    expect((await readFile(logFile, "utf8")).trim().split("\n")).toHaveLength(2);
    expect(await readPaperCuts(logFile)).toEqual([entry, { ...entry, message: "A second problem" }]);
  });

  it("records through the CLI and filters list output", async () => {
    const directory = await mkdtemp(join(tmpdir(), "papercuts-cli-"));
    const logFile = join(directory, "logs", "events.jsonl");
    await expect(runCli([
      "report",
      "--category", "shell-surprise",
      "--message", "Unquoted glob expanded before the search tool ran",
      "--tool", "terminal",
      "--log-file", logFile,
    ])).resolves.toContain("Recorded [shell-surprise]");

    await runCli(["report", "--category", "other", "--message", "A different issue", "--log-file", logFile]);
    await expect(runCli(["list", "--category", "shell-surprise", "--json", "--log-file", logFile]))
      .resolves.toMatch(/Unquoted glob expanded/);
    expect(await readPaperCuts(logFile)).toHaveLength(2);
  });

  it("rejects empty messages", () => {
    expect(() => createPaperCut({ category: "other", message: "  " })).toThrow("must not be empty");
  });
});
