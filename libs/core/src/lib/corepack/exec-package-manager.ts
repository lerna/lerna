import { ExecaReturnValue } from "execa";
import { isCorepackEnabled } from "./is-corepack-enabled";

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
  opts: Record<string, unknown>
): Promise<ExecaReturnValue<string>> {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return childProcess.exec(command, commandArgs, opts);
}

export function execPackageManagerSync(
  npmClient: string,
  args: string[],
  opts: Record<string, unknown>
): string {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return childProcess.execSync(command, commandArgs, opts);
}
