/**
 * Provided to any execa-based call
 */
export type ExecOpts = {
  cwd: string;
  maxBuffer?: number;
};
/**
 * Execute a command asynchronously, piping stdio by default.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
export function exec(
  command: string,
  args: string[],
  opts?: import("execa").Options
): Promise<execa.ExecaReturnValue<string>>;
/**
 * Execute a command synchronously.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").SyncOptions} [opts]
 */
export function execSync(command: string, args: string[], opts?: import("execa").SyncOptions): string;
/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
export function spawn(
  command: string,
  args: string[],
  opts?: import("execa").Options
): Promise<execa.ExecaReturnValue<string>>;
/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 * @param {string} [prefix]
 */
export function spawnStreaming(
  command: string,
  args: string[],
  opts?: import("execa").Options,
  prefix?: string
): Promise<execa.ExecaReturnValue<string>>;
export function getChildProcessCount(): number;
/**
 * @param {import("execa").ExecaError<string>} result
 * @returns {number}
 */
export function getExitCode(result: import("execa").ExecaError<string>): number;
import execa = require("execa");
