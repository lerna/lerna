import child from "child_process";
import objectAssign from "object-assign";

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

        callback(err || stderr);
      } else {
        callback(null, stdout);
      }
    });
  }

  static execSync(command) {
    return child.execSync(command, {
      encoding: "utf8"
    }).trim();
  }

  static spawn(command, args, opts, callback) {
    child.spawn(command, args, objectAssign({
      stdio: "inherit"
    }, opts)).on("close", callback).on("error", () => null);
  }
}
