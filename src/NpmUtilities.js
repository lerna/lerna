import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";

export default class NpmUtilities {
  @logger.logifyAsync
  static installInDir(directory, dependencies, callback) {
    let args = ["install"];

    if (dependencies) {
      args = args.concat(dependencies);
    }

    const opts = {
      cwd: directory,
      stdio: ["ignore", "ignore", "pipe"],
    };

    ChildProcessUtilities.spawn("npm", args, opts, callback);
  }

  @logger.logifySync
  static addDistTag(packageName, version, tag) {
    ChildProcessUtilities.execSync(`npm dist-tag add ${packageName}@${version} ${tag}`);
  }

  @logger.logifySync
  static removeDistTag(packageName, tag) {
    ChildProcessUtilities.execSync(`npm dist-tag rm ${packageName} ${tag}`);
  }

  @logger.logifySync
  static checkDistTag(packageName, tag) {
    return ChildProcessUtilities.execSync(`npm dist-tag ls ${packageName}`).indexOf(tag) >= 0;
  }

  @logger.logifySync
  static execInDir(command, args, directory, callback) {
    ChildProcessUtilities.exec(`npm ${command} ${args.join(" ")}`, { cwd: directory, env: process.env }, callback);
  }

  @logger.logifyAsync
  static runScriptInDir(script, args, directory, callback) {
    NpmUtilities.execInDir(`run ${script}`, args, directory, callback);
  }

  @logger.logifyAsync
  static publishTaggedInDir(tag, directory, callback) {
    ChildProcessUtilities.exec("cd " + directory + " && npm publish --tag " + tag, null, callback);
  }
}
