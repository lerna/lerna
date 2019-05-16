"use strict";

const os = require("os");
const chalk = require("chalk");
const execa = require("execa");
const logTransformer = require("strong-log-transformer");

// bookkeeping for spawned processes
let children = 0;

// when streaming children are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "red"];
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

function exec(command, args, opts) {
  const options = Object.assign({ stdio: "pipe" }, opts);
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

function execSync(command, args, opts) {
  return execa.sync(command, args, opts).stdout;
}

function spawn(command, args, opts) {
  const options = Object.assign({}, opts, { stdio: "inherit" });
  const spawned = spawnProcess(command, args, options);

  return wrapError(spawned);
}

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
  if (children > process.stdout.listenerCount("close")) {
    process.stdout.setMaxListeners(children);
    process.stderr.setMaxListeners(children);
  }

  spawned.stdout.pipe(logTransformer(stdoutOpts)).pipe(process.stdout);
  spawned.stderr.pipe(logTransformer(stderrOpts)).pipe(process.stderr);

  return wrapError(spawned);
}

function getChildProcessCount() {
  return children;
}

function getExitCode(result) {
  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === "number") {
    return result.code;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  // istanbul ignore else
  if (typeof result.code === "string") {
    return os.constants.errno[result.code];
  }

  // istanbul ignore next: extremely weird
  throw new TypeError(`Received unexpected exit code value ${JSON.stringify(result.code)}`);
}

function spawnProcess(command, args, opts) {
  children += 1;

  const child = execa(command, args, opts);
  const drain = (code, signal) => {
    children -= 1;

    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      child.removeListener("exit", drain);
    }
  };

  child.once("exit", drain);
  child.once("error", drain);

  if (opts.pkg) {
    child.pkg = opts.pkg;
  }

  return child;
}

function wrapError(spawned) {
  if (spawned.pkg) {
    return spawned.catch(err => {
      // istanbul ignore else
      if (err.code) {
        // ensure code is always a number
        err.code = getExitCode(err);

        // log non-lerna error cleanly
        err.pkg = spawned.pkg;
      }

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
