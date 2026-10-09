import { colorize } from "./colorize";
export { colorize, type StyleFormat } from "./colorize";
import {
  execa,
  execaSync,
  type ExecaError,
  type Options,
  type Result,
  type Subprocess,
  type SyncOptions,
} from "execa";
import os from "node:os";
import strongLogTransformer from "./forked-strong-log-transformer";
import { setExitCode } from "./set-exit-code";

type withPkg<T> = T & { pkg?: unknown };

type LernaExecaOptions = Omit<Options, "encoding" | "cwd"> & { encoding?: string; cwd?: string };
type LernaSyncOptions = Omit<SyncOptions, "encoding"> & { encoding?: string };
type LernaResult = Result & { stdout: string; stderr: string };

export type LernaChildProcess = withPkg<Subprocess>;
export type LernaReturnValue = withPkg<LernaResult>;
export type LernaOptions = withPkg<LernaExecaOptions>;

// bookkeeping for spawned processes
const children = new Set<Subprocess>();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "blueBright"] as const;
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
export function execSync(command: string, args: string[], opts?: LernaSyncOptions): string {
  return execaSync(command, args, opts as SyncOptions).stdout as string;
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
    const color = colorWheel[currentColor % NUM_COLORS];

    currentColor += 1;

    stdoutOpts.tag = `${colorize(["bold", color], prefix)}:`;
    stderrOpts.tag = `${colorize(color, prefix)}:`;
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
export function getExitCode(result: ExecaError & { code?: string | number }): number | undefined {
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
  return typeof process.exitCode === "number" ? process.exitCode : undefined;
}

/**
 * @param command
 * @param args
 * @param opts
 */
function spawnProcess(command: string, args: string[], opts?: LernaOptions): LernaChildProcess {
  const child = execa(command, args, opts as Options) as LernaChildProcess;
  const nodeChildProcess = child.nodeChildProcess;
  const drain = (exitCode: number, signal: number) => {
    children.delete(child);

    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      nodeChildProcess.removeListener("exit", drain);
    }

    // propagate exit code, if any
    if (exitCode) {
      setExitCode(exitCode);
    }
  };

  nodeChildProcess.once("exit", drain);
  nodeChildProcess.once("error", drain);

  if (opts?.pkg) {
    child.pkg = opts.pkg;
  }

  children.add(child);

  return child;
}

/**
 * @param spawned
 */
function wrapError(spawned: LernaChildProcess): Promise<LernaReturnValue> {
  if (spawned.pkg) {
    return spawned.catch((err: any) => {
      // ensure exit code is always a number
      err.exitCode = getExitCode(err);

      // log non-lerna error cleanly
      err.pkg = spawned.pkg;

      throw err;
    }) as Promise<LernaReturnValue>;
  }

  return spawned as Promise<LernaReturnValue>;
}
