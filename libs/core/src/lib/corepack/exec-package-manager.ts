import { ExecOptions } from "child_process";
import { ExecaReturnValue } from "execa";
import { isCorepackEnabled } from "./is-corepack-enabled";

import * as childProcess from "@lerna/child-process";

function createCommandAndArgs(npmClient: string, args: string[]) {
  let command = npmClient;
  const commandArgs = [...args];

  // Corepack does not support bun, so bypass the corepack wrapper for bun
  // even when corepack is enabled; fall through to invoking bun directly.
  if (isCorepackEnabled() && npmClient !== "bun") {
    commandArgs.unshift(command);
    command = "corepack";
  }

  return { command, commandArgs };
}

export function execPackageManager(
  npmClient: string,
  args: string[],
  opts: ExecOptions
): Promise<ExecaReturnValue<string>> {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return childProcess.exec(command, commandArgs, opts as any);
}

export function execPackageManagerSync(npmClient: string, args: string[], opts: ExecOptions): string {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return childProcess.execSync(command, commandArgs, opts as any);
}
