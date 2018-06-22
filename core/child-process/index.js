"use strict";

const chalk = require("chalk");
const execa = require("execa");
const logTransformer = require("strong-log-transformer");

// bookkeeping for spawned processes
let children = 0;

// when streaming children are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "red"];
const NUM_COLORS = colorWheel.length;

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

  const colorName = colorWheel[children % NUM_COLORS];
  const color = chalk[colorName];
  const spawned = spawnProcess(command, args, options);

  const stdoutOpts = {};
  const stderrOpts = {}; // mergeMultiline causes escaped newlines :P

  if (prefix) {
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
