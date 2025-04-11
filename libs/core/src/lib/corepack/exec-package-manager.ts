import { ExecOptions } from "child_process";
import { ExecaReturnValue } from "execa";
import { isCorepackEnabled } from "./is-corepack-enabled";

const childProcess = require("@lerna/child-process");

function createCommandAndArgs(npmClient: string, args: string[]) {
  let command = npmClient;
  const commandArgs = [...args];

  if (isCorepackEnabled()) {
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
  return childProcess.exec(command, commandArgs, opts);
}

export function execPackageManagerSync(npmClient: string, args: string[], opts: ExecOptions): string {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return childProcess.execSync(command, commandArgs, opts);
}
