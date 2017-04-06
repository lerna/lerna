import child from "child_process";
import spawn from "cross-spawn";
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

  static execStreaming(command, opts, prefix, callback) {
    opts = this.getStreamingOpts(opts);
    const childProcess = this.exec(command, opts, callback);
    this.streaming(childProcess, prefix);
  }

  static execSync(command, opts) {
    const mergedOpts = Object.assign({
      encoding: "utf8",
      maxBuffer: MAX_BUFFER
    }, opts);

    let stdout = child.execSync(command, mergedOpts);
    if (stdout) {
      // stdout is undefined when stdio[1] is anything other than "pipe"
      // and there's no point trimming an empty string (no piped stdout)
      stdout = stdout.trim();
    }

    return stdout;
  }

  static spawn(command, args, opts, callback) {
    let output = "";

    const childProcess = _spawn(command, args, opts, (err) => callback(err, output));

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

  static spawnStreaming(command, args, opts, prefix, callback) {
    opts = this.getStreamingOpts(opts);
    const childProcess = _spawn(command, args, opts, callback);
    this.streaming(childProcess, prefix);
  }

  static getStreamingOpts(opts) {
    return Object.assign({}, opts, {
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  static streaming(childProcess, prefix) {
    ["stdout", "stderr"].forEach((stream) => {
      let partialLine = "";
      childProcess[stream].setEncoding("utf8")
        .on("data", (chunk) => {
          const lines = chunk.split("\n");
          lines[0] = partialLine + lines[0];
          partialLine = lines.pop();
          lines.forEach((line) => process[stream].write(prefix + line + "\n"));
        })
        .on("end", () => {
          if (partialLine) {

            // If the child process ended its output with no final newline we
            // need to flush that out.  We'll add a newline ourselves so we
            // don't end up with output from multiple children on the same
            // line.
            process[stream].write(prefix + partialLine + "\n");
          }
        });
    });
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

function _spawn(command, args, opts, callback) {
  return ChildProcessUtilities.registerChild(
    spawn(command, args, Object.assign({
      stdio: "inherit"
    }, opts))
      .on("error", () => {})
      .on("close", (code) => {
        if (code) {
          callback(`Command exited with status ${code}: ${command} ${args.join(" ")}`);
        } else {
          callback(null);
        }
      })
  );
}
