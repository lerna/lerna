import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };

const packageRoot = resolve(import.meta.dirname, "..");
const workspaceRoot = resolve(packageRoot, "../..");

function runNode(args: string[]) {
  return execFileSync(process.execPath, args, {
    cwd: workspaceRoot,
    encoding: "utf8",
  }).trim();
}

describe("published ESM package", () => {
  it("emits native ESM without an esbuild CommonJS wrapper", () => {
    const distRoot = resolve(packageRoot, "dist");
    const cliOutput = readFileSync(resolve(distRoot, "cli.js"), "utf8");
    const commonJsWrapperOutputs = readdirSync(distRoot, { recursive: true })
      .filter((filePath) => filePath.endsWith(".js"))
      .filter((filePath) => readFileSync(resolve(distRoot, filePath), "utf8").includes("var __commonJS"));

    expect(pkg.type).toBe("module");
    expect(readFileSync(resolve(distRoot, "index.js"), "utf8")).toContain('main as "module.exports"');
    expect(cliOutput).toContain('"./index.js"');
    expect(cliOutput).not.toContain('from "./chunk-');
    expect(commonJsWrapperOutputs).toEqual([]);
  });

  it("supports ESM imports", () => {
    const result = runNode([
      "--input-type=module",
      "--eval",
      `
        import lerna, { main } from "lerna";
        import clean, { CleanCommand } from "lerna/commands/clean";
        console.log(JSON.stringify({
          lerna: typeof lerna,
          main: lerna === main,
          clean: typeof clean,
          cleanCommand: clean.CleanCommand === CleanCommand,
        }));
      `,
    ]);

    expect(JSON.parse(result)).toEqual({
      lerna: "function",
      main: true,
      clean: "function",
      cleanCommand: true,
    });
  });

  it("preserves synchronous CommonJS require compatibility", () => {
    const result = runNode([
      "--eval",
      `
        const lerna = require("lerna");
        const clean = require("lerna/commands/clean");
        const commandNames = [
          "add-caching", "changed", "clean", "create", "diff", "exec", "import", "info",
          "init", "list", "publish", "repair", "run", "version", "watch"
        ];
        const callableCommandNames = ["add-caching", "clean", "create", "publish", "repair", "version", "watch"];
        console.log(JSON.stringify({
          lerna: typeof lerna,
          clean: typeof clean,
          cleanCommand: typeof clean.CleanCommand,
          commandModules: commandNames.map((name) =>
            require(\`lerna/commands/\${name}/command\`).command
          ),
          callableCommands: callableCommandNames.map((name) =>
            typeof require(\`lerna/commands/\${name}\`)
          ),
        }));
      `,
    ]);

    expect(JSON.parse(result)).toEqual({
      lerna: "function",
      clean: "function",
      cleanCommand: "function",
      commandModules: [
        "add-caching",
        "changed",
        "clean",
        "create <name> [loc]",
        "diff [pkgName]",
        "exec [cmd] [args..]",
        "import <dir>",
        "info",
        "init",
        "list",
        "publish [bump]",
        "repair",
        "run <script>",
        "version [bump]",
        "watch",
      ],
      callableCommands: Array(7).fill("function"),
    });
  });

  it("runs the ESM CLI", () => {
    expect(runNode([resolve(packageRoot, "dist/cli.js"), "--version"])).toBe(pkg.version);
  });
});
