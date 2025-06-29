import chalk from "chalk";
import execa from "execa";
import os from "node:os";
import strongLogTransformer from "./forked-strong-log-transformer";
import { setExitCode } from "./set-exit-code";

type withPkg<T> = T & { pkg?: unknown };

export type LernaChildProcess = withPkg<execa.ExecaChildProcess<string>>;
export type LernaReturnValue = withPkg<execa.ExecaReturnValue<string>>;
export type LernaOptions = withPkg<execa.Options>;

// bookkeeping for spawned processes
const children = new Set<execa.ExecaChildProcess<string>>();

// when streaming processes are spawned, use this color for prefix
const colorWheel = [chalk.cyan, chalk.magenta, chalk.blue, chalk.yellow, chalk.green, chalk.blueBright];
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

/**
 * Execute a command asynchronously, piping stdio by default.
 * @param command
 * @param args
 * @param opts
 * @returns
 */
export function exec(command: string, args: string[], opts?: LernaOptions): Promise<LernaReturnValue> {
  const options = Object.assign({ stdio: "pipe" }, opts);
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

/**
 * Execute a command synchronously.
 * @param command
 * @param args
 * @param opts
 */
export function execSync(command: string, args: string[], opts?: import("execa").SyncOptions): string {
  return execa.sync(command, args, opts).stdout;
}

/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param command
 * @param args
 * @param opts
 */
export function spawn(command: string, args: string[], opts?: LernaOptions): Promise<LernaReturnValue> {
  const options = Object.assign({}, opts, { stdio: "inherit" });
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 * @param command
 * @param args
 * @param opts
 * @param prefix
 */
// istanbul ignore next
export function spawnStreaming(
  command: string,
  args: string[],
  opts?: LernaOptions,
  prefix?: string
): Promise<LernaReturnValue> {
  const options: any = Object.assign({}, opts);
  options.stdio = ["ignore", "pipe", "pipe"];

  const spawned = spawnProcess(command, args, options);

  const stdoutOpts: { tag?: string } = {};
  const stderrOpts: { tag?: string } = {}; // mergeMultiline causes escaped newlines :P

  if (prefix) {
    const colorName = colorWheel[currentColor % NUM_COLORS];
    const color = colorName;

    currentColor += 1;

    stdoutOpts.tag = `${color.bold(prefix)}:`;
    stderrOpts.tag = `${color(prefix)}:`;
  }

  // Avoid "Possible EventEmitter memory leak detected" warning due to piped stdio
  if (children.size > process.stdout.listenerCount("close")) {
    process.stdout.setMaxListeners(children.size);
    process.stderr.setMaxListeners(children.size);
  }

  spawned.stdout?.pipe(strongLogTransformer(stdoutOpts)).pipe(process.stdout);
  spawned.stderr?.pipe(strongLogTransformer(stderrOpts)).pipe(process.stderr);

  return wrapError(spawned);
}

export function getChildProcessCount() {
  return children.size;
}

/**
 * @param result
 * @returns
 */
export function getExitCode(
  result: execa.ExecaError<string> & { code?: string | number }
): number | undefined {
  if (result.exitCode) {
    return result.exitCode;
  }

  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === "number") {
    return result.code;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  if (typeof result.code === "string") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return os.constants.errno[result.code as typeof os.constants.errno];
  }

  // we tried
  return process.exitCode;
}

/**
 * @param command
 * @param args
 * @param opts
 */
function spawnProcess(command: string, args: string[], opts?: LernaOptions): LernaChildProcess {
  const child: LernaChildProcess = execa(command, args, opts);
  const drain = (exitCode: number, signal: number) => {
    children.delete(child);

    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      child.removeListener("exit", drain);
    }

    // propagate exit code, if any
    if (exitCode) {
      setExitCode(exitCode);
    }
  };

  child.once("exit", drain);
  child.once("error", drain);

  if (opts?.pkg) {
    child.pkg = opts.pkg;
  }

  children.add(child);

  return child;
}

/**
 * @param spawned
 */
function wrapError(spawned: LernaChildProcess) {
  if (spawned.pkg) {
    return spawned.catch((err: any) => {
      // ensure exit code is always a number
      err.exitCode = getExitCode(err);

      // log non-lerna error cleanly
      err.pkg = spawned.pkg;

      throw err;
    });
  }

  return spawned;
}
