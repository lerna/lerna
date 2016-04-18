import child from "child_process";

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

  static spawn(command, args, callback) {
    child.spawn(command, args, {
      stdio: "inherit"
    }).on("close", callback);
  }
}
