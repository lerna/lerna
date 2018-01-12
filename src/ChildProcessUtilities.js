"use strict";

const chalk = require("chalk");
const EventEmitter = require("events");
const execa = require("execa");
const logTransformer = require("strong-log-transformer");
const pFinally = require("p-finally");

// Keep track of how many live children we have.
let children = 0;

// This is used to alert listeners when all children have exited.
const emitter = new EventEmitter();

// when streaming children are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "red"];
const NUM_COLORS = colorWheel.length;

function exec(command, args, opts, callback) {
  const options = Object.assign({}, opts);
  options.stdio = "pipe"; // node default

  return _spawn(command, args, options, callback);
}

function execSync(command, args, opts) {
  return execa.sync(command, args, opts).stdout;
}

function spawn(command, args, opts, callback) {
  const options = Object.assign({}, opts);
  options.stdio = "inherit";

  return _spawn(command, args, options, callback);
}

function spawnStreaming(command, args, opts, prefix, callback) {
  const options = Object.assign({}, opts);
  options.stdio = ["ignore", "pipe", "pipe"];

  const colorName = colorWheel[children % NUM_COLORS];
  const color = chalk[colorName];
  const spawned = _spawn(command, args, options, callback);

  const prefixedStdout = logTransformer({ tag: `${color.bold(prefix)}:` });
  const prefixedStderr = logTransformer({ tag: `${color(prefix)}:`, mergeMultiline: true });

  // Avoid "Possible EventEmitter memory leak detected" warning due to piped stdio
  if (children > process.stdout.listenerCount("close")) {
    process.stdout.setMaxListeners(children);
    process.stderr.setMaxListeners(children);
  }

  spawned.stdout.pipe(prefixedStdout).pipe(process.stdout);
  spawned.stderr.pipe(prefixedStderr).pipe(process.stderr);

  return spawned;
}

function getChildProcessCount() {
  return children;
}

function onAllExited(callback) {
  emitter.on("empty", callback);
}

function registerChild(child) {
  children += 1;

  pFinally(child, () => {
    children -= 1;

    if (children === 0) {
      emitter.emit("empty");
    }
  }).catch(() => {});
}

// eslint-disable-next-line no-underscore-dangle
function _spawn(command, args, opts, callback) {
  const child = execa(command, args, opts);

  registerChild(child);

  if (callback) {
    child.then(result => callback(null, result.stdout), err => callback(err));
  }

  return child;
}

exports.exec = exec;
exports.execSync = execSync;
exports.spawn = spawn;
exports.spawnStreaming = spawnStreaming;
exports.getChildProcessCount = getChildProcessCount;
exports.onAllExited = onAllExited;
