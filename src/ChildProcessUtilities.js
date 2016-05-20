import child from "child_process";
import objectAssign from "object-assign";

export default class ChildProcessUtilities {
  static exec(command, opts, callback) {
    return child.exec(command, opts, (err, stdout, stderr) => {
      if (err != null) {
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
    }, opts)).on("close", callback);
  }
}
