"use strict";

const os = require("os");
const chalk = require("chalk");
const execa = require("execa");
const logTransformer = require("strong-log-transformer");

// bookkeeping for spawned processes
/** @type {Set<import("execa").ExecaChildProcess<string>>} */
const children = new Set();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "red"];
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

/**
 * Execute a command asynchronously, piping stdio by default.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
function exec(command, args, opts) {
  const options = Object.assign({ stdio: "pipe" }, opts);
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

/**
 * Execute a command synchronously.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").SyncOptions} [opts]
 */
function execSync(command, args, opts) {
  return execa.sync(command, args, opts).stdout;
}

/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
function spawn(command, args, opts) {
  const options = Object.assign({}, opts, { stdio: "inherit" });
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 * @param {string} [prefix]
 */
// istanbul ignore next
function spawnStreaming(command, args, opts, prefix) {
  const options = Object.assign({}, opts);
  options.stdio = ["ignore", "pipe", "pipe"];

  const spawned = spawnProcess(command, args, options);

  const stdoutOpts = {};
  const stderrOpts = {}; // mergeMultiline causes escaped newlines :P

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

  spawned.stdout.pipe(logTransformer(stdoutOpts)).pipe(process.stdout);
  spawned.stderr.pipe(logTransformer(stderrOpts)).pipe(process.stderr);

  return wrapError(spawned);
}

function getChildProcessCount() {
  return children.size;
}

/**
 * @param {import("execa").ExecaError<string>} result
 * @returns {number}
 */
function getExitCode(result) {
  if (result.exitCode) {
    return result.exitCode;
  }

  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === "number") {
    return result.code;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  if (typeof result.code === "string") {
    return os.constants.errno[result.code];
  }

  // we tried
  return process.exitCode;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} opts
 */
function spawnProcess(command, args, opts) {
  const child = execa(command, args, opts);
  const drain = (exitCode, signal) => {
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
    child.pkg = opts.pkg;
  }

  children.add(child);

  return child;
}

/**
 * @param {import("execa").ExecaChildProcess<string> & { pkg?: import("@lerna/package").Package }} spawned
 */
function wrapError(spawned) {
  if (spawned.pkg) {
    return spawned.catch((err) => {
      // ensure exit code is always a number
      err.exitCode = getExitCode(err);

      // log non-lerna error cleanly
      err.pkg = spawned.pkg;

      throw err;
    });
  }

  return spawned;
}

exports.exec = exec;
exports.execSync = execSync;
exports.spawn = spawn;
exports.spawnStreaming = spawnStreaming;
exports.getChildProcessCount = getChildProcessCount;
exports.getExitCode = getExitCode;

/**
 * @typedef {object} ExecOpts Provided to any execa-based call
 * @property {string} cwd
 * @property {number} [maxBuffer]
 */
