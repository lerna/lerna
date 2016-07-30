import child from "child_process";
import spawn from "cross-spawn";
import objectAssign from "object-assign";
import syncExec from "sync-exec";

export default class ChildProcessUtilities {
  static exec(command, opts, callback) {
    return child.exec(command, opts, (err, stdout, stderr) => {
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
    });
  }

  static execSync(command, opts) {
    const mergedOpts = objectAssign({
      encoding: "utf8"
    }, opts);
    if (child.execSync) {
      return child.execSync(command, mergedOpts).trim();
    } else {
      return syncExec(command, mergedOpts).stdout.trim();
    }
  }

  static spawn(command, args, opts, callback) {
    let stderr = "";

    const childProcess = spawn(command, args, objectAssign({
      stdio: "inherit"
    }, opts))
      .on("error", () => {})
      .on("exit", (code) => {
        callback(code && (stderr || `Command failed: ${command} ${args.join(" ")}`));
      });

    // By default stderr is inherited from us (just sent to _our_ output).
    // If the caller overrode that to "pipe", then we'll gather that up and
    // call back with it in case of failure.
    if (childProcess.stderr) {
      childProcess.stderr.setEncoding("utf8").on("data", (chunk) => stderr += chunk);
    }
  }
}
