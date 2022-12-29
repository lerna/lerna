import os from "os";
const chalk = require("chalk");
import execa from "execa";
const logTransformer = require("strong-log-transformer");

// TODO: Try and confirm if pkg should be of type `Package` from @lerna/package
type WithLernaPackage<T> = T & { pkg?: any };
type ExecaOptionsWithLernaPackage = WithLernaPackage<execa.Options>;
type ExecaChildProcessWithLernaPackage = WithLernaPackage<execa.ExecaChildProcess>;
type ExecaErrorWithLernaPackage = WithLernaPackage<execa.ExecaError>;

// bookkeeping for spawned processes
const children: Set<execa.ExecaChildProcess<string>> = new Set();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "blueBright"];
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

/**
 * Execute a command asynchronously, piping stdio by default.
 */
export function exec(command: string, args?: string[], opts?: ExecaOptionsWithLernaPackage) {
  const options = Object.assign({ stdio: "pipe" }, opts);
  const spawned = spawnProcess(command, args || [], options);

  return wrapError(spawned);
}

/**
 * Execute a command synchronously.
 */
export function execSync(command: string, args: string[], opts?: execa.SyncOptions) {
  return execa.sync(command, args, opts).stdout;
}

/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 */
export function spawn(command: string, args: string[], opts?: ExecaOptionsWithLernaPackage) {
  const options = Object.assign({}, opts, { stdio: "inherit" });
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 */
// istanbul ignore next
export function spawnStreaming(
  command: string,
  args: string[],
  opts: ExecaOptionsWithLernaPackage,
  prefix: string
) {
  const options = Object.assign({}, opts);
  // TODO: investigate assigning to readonly property
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  options.stdio = ["ignore", "pipe", "pipe"];

  const spawned = spawnProcess(command, args, options);

  const stdoutOpts = {} as any;
  const stderrOpts = {} as any; // mergeMultiline causes escaped newlines :P

  if (prefix) {
    const colorName = colorWheel[currentColor % NUM_COLORS];
    const color = chalk[colorName];

    currentColor += 1;

    stdoutOpts.tag = `${color.bold(prefix)}:`;
    stderrOpts.tag = `${color(prefix)}:`;
  }

  // Avoid "Possible EventEmitter memory leak detected" warning due to piped stdio
  if (children.size > process.stdout.listenerCount("close")) {
    process.stdout.setMaxListeners(children.size);
    process.stderr.setMaxListeners(children.size);
  }

  spawned.stdout?.pipe(logTransformer(stdoutOpts)).pipe(process.stdout);
  spawned.stderr?.pipe(logTransformer(stderrOpts)).pipe(process.stderr);

  return wrapError(spawned);
}

export function getChildProcessCount() {
  return children.size;
}

export function getExitCode(result: any) {
  if (!result) {
    return process.exitCode;
  }

  if (result.exitCode) {
    return result.exitCode;
  }

  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === "number") {
    return result.code;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  if (typeof result.code === "string") {
    return os.constants.errno[result.code as keyof typeof os.constants.errno];
  }

  // we tried
  return process.exitCode;
}

function spawnProcess(
  command: string,
  args: string[],
  opts: ExecaOptionsWithLernaPackage
): execa.ExecaChildProcess | ExecaChildProcessWithLernaPackage {
  const child = execa(command, args, opts);
  const drain = (exitCode: number | undefined, signal: undefined) => {
    children.delete(child);

    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      child.removeListener("exit", drain);
    }

    // propagate exit code, if any
    if (exitCode) {
      process.exitCode = exitCode;
    }
  };

  child.once("exit", drain);
  child.once("error", drain);

  if (opts.pkg) {
    (child as ExecaChildProcessWithLernaPackage).pkg = opts.pkg;
  }

  children.add(child);

  return child;
}

function wrapError(
  spawned: ExecaChildProcessWithLernaPackage
): ExecaChildProcessWithLernaPackage | Promise<execa.ExecaReturnValue<string>> {
  if (spawned.pkg) {
    return spawned.catch((err: ExecaErrorWithLernaPackage) => {
      // ensure exit code is always a number
      err.exitCode = getExitCode(err);

      // log non-lerna error cleanly
      err.pkg = spawned.pkg;

      throw err;
    });
  }

  return spawned;
}
