import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";
import escapeArgs from "command-join";
import path from "path";
import semver from "semver";

export default class NpmUtilities {
  @logger.logifyAsync()
  static installInDir(directory, dependencies, callback) {
    let args = ["install"];

    if (dependencies) {
      args = args.concat(dependencies);
    }

    const opts = {
      cwd: directory,
      stdio: ["ignore", "pipe", "pipe"],
    };

    ChildProcessUtilities.spawn("npm", args, opts, callback);
  }

  @logger.logifySync()
  static addOwner(owner, packageName) {
    ChildProcessUtilities.execSync(`npm owner add ${owner} ${packageName}`);
  }

  @logger.logifySync()
  static removeOwner(owner, packageName) {
    ChildProcessUtilities.execSync(`npm owner rm ${owner} ${packageName}`);
  }

  @logger.logifySync()
  static addDistTag(packageName, version, tag) {
    ChildProcessUtilities.execSync(`npm dist-tag add ${packageName}@${version} ${tag}`);
  }

  @logger.logifySync()
  static removeDistTag(packageName, tag) {
    ChildProcessUtilities.execSync(`npm dist-tag rm ${packageName} ${tag}`);
  }

  @logger.logifySync()
  static checkDistTag(packageName, tag) {
    return ChildProcessUtilities.execSync(`npm dist-tag ls ${packageName}`).indexOf(tag) >= 0;
  }

  @logger.logifyAsync()
  static execInDir(command, args, directory, callback) {
    ChildProcessUtilities.exec(`npm ${command} ${escapeArgs(args)}`, { cwd: directory, env: process.env }, callback);
  }

  @logger.logifyAsync()
  static runScriptInDir(script, args, directory, callback) {
    NpmUtilities.execInDir(`run ${script}`, args, directory, callback);
  }

  @logger.logifyAsync()
  static publishTaggedInDir(tag, directory, callback) {
    ChildProcessUtilities.exec("cd " + escapeArgs(directory) + " && npm publish --tag " + tag, null, callback);
  }

  @logger.logifySync
  static dependencyIsSatisfied(dir, dependency, needVersion) {
    const packageJson = path.join(dir, dependency, "package.json");
    try {
      return semver.satisfies(require(packageJson).version, needVersion);
    } catch (e) {
      return false;
    }
  }
}
