import * as childProcess from "@lerna/child-process";
import { log } from "@lerna/core";
import { readJsonFile, workspaceRoot } from "@nx/devkit";
import type { SyncOptions } from "execa";
import fs from "node:fs";
import path from "node:path";
import slash from "slash";

let resolvedPrettier;
function resolvePrettier() {
  if (!resolvedPrettier) {
    try {
      // If the workspace has prettier (explicitly) installed, apply it to the updated files
      const packageJson = readJsonFile(path.join(workspaceRoot, "package.json"));
      const hasPrettier = packageJson.devDependencies?.prettier || packageJson.dependencies?.prettier;
      if (!hasPrettier) {
        return;
      }

      resolvedPrettier = require("prettier");
    } catch {
      return;
    }
  }
  return resolvedPrettier;
}

async function maybeFormatFile(filePath) {
  const prettier = resolvePrettier();
  if (!prettier) {
    return;
  }
  const config = await resolvedPrettier.resolveConfig(filePath);
  const ignorePath = path.join(workspaceRoot, ".prettierignore");
  const fullFilePath = path.join(workspaceRoot, filePath);

  const fileInfo = await resolvedPrettier.getFileInfo(fullFilePath, { ignorePath });

  if (fileInfo.ignored) {
    log.silly("version", `Skipped applying prettier to ignored file: ${filePath}`);
    return;
  }
  try {
    const input = fs.readFileSync(fullFilePath, "utf8");
    fs.writeFileSync(
      fullFilePath,
      await resolvedPrettier.format(input, { ...config, filepath: fullFilePath }),
      "utf8"
    );
    log.silly("version", `Successfully applied prettier to updated file: ${filePath}`);
  } catch {
    log.silly("version", `Failed to apply prettier to updated file: ${filePath}`);
  }
}

/**
 * Adds files to git staging area, with optional dry-run support.
 *
 * @param changedFiles - Array of file paths to add
 * @param gitOpts - Git options including granular pathspec setting
 * @param execOpts - Execution options for child process
 * @param dryRun - If true, only logs what would be done without executing
 * @returns Promise that resolves when operation completes
 */
export async function gitAdd(
  changedFiles: string[],
  gitOpts: { granularPathspec?: boolean },
  execOpts: SyncOptions,
  dryRun = false
) {
  let files: string | string[] = [];
  for (const file of changedFiles) {
    const filePath = slash(path.relative(execOpts.cwd, path.resolve(execOpts.cwd, file)));
    await maybeFormatFile(filePath);
    if (gitOpts.granularPathspec) {
      files.push(filePath);
    }
  }

  // granular pathspecs should be relative to the git root, but that isn't necessarily where lerna lives
  if (!gitOpts.granularPathspec) {
    files = ".";
  }

  const args = ["add", "--", ...files];

  if (dryRun) {
    log.info("dry-run", `Would execute: git ${args.join(" ")}`);
    return Promise.resolve();
  }

  log.silly("gitAdd", Array.isArray(files) ? files.join(" ") : files);

  return childProcess.exec("git", args, execOpts);
}
