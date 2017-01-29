import child from "child_process";
import spawn from "cross-spawn";
import syncExec from "sync-exec";
import {EventEmitter} from "events";

// Keep track of how many live children we have.
let children = 0;

// maxBuffer value for running exec
const MAX_BUFFER = 500 * 1024;

// This is used to alert listeners when all children have exited.
const emitter = new EventEmitter;

export default class ChildProcessUtilities {
  static exec(command, opts, callback) {
    const mergedOpts = Object.assign({
      maxBuffer: MAX_BUFFER
    }, opts);
    return ChildProcessUtilities.registerChild(
      child.exec(command, mergedOpts, (err, stdout, stderr) => {
        if (err != null) {

          // If the error from `child.exec` is just that the child process
          // emitted too much on stderr, then that stderr output is likely to
          // be useful.
          if (/^stderr maxBuffer exceeded/.test(err.message)) {
            err = `Error: ${err.message}.  Partial output follows:\n\n${stderr}`;
          }

          callback(err || stderr, stdout);
        } else {
          callback(null, stdout);
        }
      })
    );
  }

  static execSync(command, opts) {
    const mergedOpts = Object.assign({
      encoding: "utf8",
      maxBuffer: MAX_BUFFER
    }, opts);
    if (child.execSync) {
      return child.execSync(command, mergedOpts).trim();
    } else {
      return syncExec(command, mergedOpts).stdout.trim();
    }
  }

  static spawn(command, args, opts, callback) {
    let output = "";

    const childProcess = ChildProcessUtilities.registerChild(
      spawn(command, args, Object.assign({
        stdio: "inherit"
      }, opts))
        .on("error", () => {})
        .on("close", (code) => {
          if (code) {
            callback(`Command exited with status ${code}: ${command} ${args.join(" ")}`, output);
          } else {
            callback(null, output);
          }
        })
    );

    // By default stderr, stdout are inherited from us (just sent to _our_ output).
    // If the caller overrode that to "pipe", then we'll gather that up and
    // call back with it in case of failure.
    if (childProcess.stderr) {
      childProcess.stderr.setEncoding("utf8");
      childProcess.stderr.on("data", (chunk) => output += chunk);
    }

    if (childProcess.stdout) {
      childProcess.stdout.setEncoding("utf8");
      childProcess.stdout.on("data", (chunk) => output += chunk);
    }
  }

  static registerChild(child) {
    children++;
    child.on("exit", () => {
      children--;
      if (children === 0) {
        emitter.emit("empty");
      }
    });
    return child;
  }

  static getChildProcessCount() {
    return children;
  }

  static onAllExited(callback) {
    emitter.on("empty", callback);
  }
}
