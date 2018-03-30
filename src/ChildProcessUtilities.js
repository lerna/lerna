import chalk from "chalk";
import EventEmitter from "events";
import execa from "execa";
import logTransformer from "strong-log-transformer";
import pFinally from "p-finally";

// Keep track of how many live children we have.
let children = 0;

// This is used to alert listeners when all children have exited.
const emitter = new EventEmitter();

// when streaming children are spawned, use this color for prefix
const colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "red"];
const NUM_COLORS = colorWheel.length;

export default class ChildProcessUtilities {
  static exec(command, args, opts, callback) {
    const options = Object.assign({}, opts);
    options.stdio = "pipe"; // node default

    return _spawn(command, args, options, callback);
  }

  static execSync(command, args, opts) {
    return execa.sync(command, args, opts).stdout;
  }

  static spawn(command, args, opts, callback) {
    const options = Object.assign({}, opts);
    options.stdio = "inherit";

    return _spawn(command, args, options, callback);
  }

  static spawnStreaming(command, args, opts, prefix, callback) {
    const options = Object.assign({}, opts);
    options.stdio = ["ignore", "pipe", "pipe"];

    const colorName = colorWheel[children % NUM_COLORS];
    const color = chalk[colorName];
    const spawned = _spawn(command, args, options, callback);

    const stdoutTag = prefix ? `${color.bold(prefix)}:` : "";
    const stderrTag = prefix ? `${color(prefix)}:` : "";

    const prefixedStdout = logTransformer({ tag: stdoutTag });
    const prefixedStderr = logTransformer({ tag: stderrTag, mergeMultiline: true });

    // Avoid "Possible EventEmitter memory leak detected" warning due to piped stdio
    if (children > process.stdout.listenerCount("close")) {
      process.stdout.setMaxListeners(children);
      process.stderr.setMaxListeners(children);
    }

    spawned.stdout.pipe(prefixedStdout).pipe(process.stdout);
    spawned.stderr.pipe(prefixedStderr).pipe(process.stderr);

    return spawned;
  }

  static getChildProcessCount() {
    return children;
  }

  static onAllExited(callback) {
    emitter.on("empty", callback);
  }
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
