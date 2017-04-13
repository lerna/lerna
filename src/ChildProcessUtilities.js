import { EventEmitter } from "events";
import execa from "execa";
import pFinally from "p-finally";
import logTransformer from "strong-log-transformer";

// Keep track of how many live children we have.
let children = 0;

// This is used to alert listeners when all children have exited.
const emitter = new EventEmitter();

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

    const spawned = _spawn(command, args, options, callback);

    const prefixedStdout = logTransformer({ tag: `${prefix}:` });
    const prefixedStderr = logTransformer({ tag: `${prefix} ERROR`, mergeMultiline: true });

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
  children++;

  pFinally(child, () => {
    children--;

    if (children === 0) {
      emitter.emit("empty");
    }
  });
}

function _spawn(command, args, opts, callback) {
  const child = execa(command, args, opts);

  registerChild(child);

  if (callback) {
    child.then(
      (result) => callback(null, result.stdout),
      (err) => callback(err)
    );
  }

  return child;
}
