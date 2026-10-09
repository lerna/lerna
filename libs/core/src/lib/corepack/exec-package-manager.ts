import { ExecOptions } from "child_process";
import { ExecaReturnValue } from "execa";
import { getPnpmInstallEnv } from "../get-npm-exec-opts";
import { isCorepackEnabled } from "./is-corepack-enabled";

import * as childProcess from "@lerna/child-process";

function withPackageManagerExecEnv(npmClient: string, opts: ExecOptions): ExecOptions {
  if (npmClient !== "pnpm") {
    return opts;
  }

  return {
    ...opts,
    env: {
      ...process.env,
      ...(opts.env || {}),
      ...getPnpmInstallEnv(),
    },
  };
}

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
  return childProcess.exec(command, commandArgs, withPackageManagerExecEnv(npmClient, opts) as any);
}

export function execPackageManagerSync(npmClient: string, args: string[], opts: ExecOptions): string {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return childProcess.execSync(command, commandArgs, withPackageManagerExecEnv(npmClient, opts) as any);
}
