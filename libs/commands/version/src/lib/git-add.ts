import { readJsonFile, workspaceRoot } from "@nx/devkit";
import { ExecOptions } from "child_process";
import fs from "fs";
import log from "npmlog";
import path from "path";
import slash from "slash";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

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
      const prettierPath = path.join(workspaceRoot, "node_modules", "prettier");
      // eslint-disable-next-line import/no-dynamic-require, global-require
      resolvedPrettier = require(prettierPath);
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
      resolvedPrettier.format(input, { ...config, filepath: fullFilePath }),
      "utf8"
    );
    log.silly("version", `Successfully applied prettier to updated file: ${filePath}`);
  } catch {
    log.silly("version", `Failed to apply prettier to updated file: ${filePath}`);
  }
}

export async function gitAdd(
  changedFiles: string[],
  gitOpts: { granularPathspec?: boolean },
  execOpts: ExecOptions
) {
  let files: string | string[] = [];
  for (const file of changedFiles) {
    const filePath = slash(path.relative(execOpts.cwd as string, path.resolve(execOpts.cwd as string, file)));
    await maybeFormatFile(filePath);
    if (gitOpts.granularPathspec) {
      files.push(filePath);
    }
  }

  // granular pathspecs should be relative to the git root, but that isn't necessarily where lerna lives
  if (!gitOpts.granularPathspec) {
    files = ".";
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("gitAdd", files);

  return childProcess.exec("git", ["add", "--", ...files], execOpts);
}
