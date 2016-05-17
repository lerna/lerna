import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";

export default class NpmUtilities {
  @logger.logifyAsync
  static installInDir(directory, dependencies, callback, cacheFolder) {
    let command = "npm install --cache=/" + cacheFolder;

    if (dependencies) {
      command += " " + dependencies.join(" ");
    }

    ChildProcessUtilities.exec(command, { cwd: directory }, callback);
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

  @logger.logifyAsync
  static runScriptInDir(script, args, directory, callback) {
    ChildProcessUtilities.exec(`npm run ${script} ${args.join(" ")}`, { cwd: directory }, callback);
  }

  @logger.logifyAsync
  static publishTaggedInDir(tag, directory, callback) {
    ChildProcessUtilities.exec("cd " + directory + " && npm publish --tag " + tag, null, callback);
  }
}
