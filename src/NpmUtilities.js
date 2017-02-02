import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";
import escapeArgs from "command-join";
import path from "path";
import semver from "semver";

export default class NpmUtilities {
  @logger.logifyAsync()
  static installInDir(directory, dependencies, registry, callback) {
    let args = ["install"];

    if (dependencies) {
      args = args.concat(dependencies);
    }

    const opts = {
      cwd: directory,
      stdio: ["ignore", "pipe", "pipe"],
    };

    if (registry) {
      opts.env = {npm_config_registry: registry};
    }

    ChildProcessUtilities.spawn("npm", args, opts, callback);
  }

  @logger.logifySync()
  static addDistTag(packageName, version, tag, registry) {
    const opts = NpmUtilities.getTagOpts(registry);
    ChildProcessUtilities.execSync(`npm dist-tag add ${packageName}@${version} ${tag}`, opts);
  }

  @logger.logifySync()
  static removeDistTag(packageName, tag, registry) {
    const opts = NpmUtilities.getTagOpts(registry);
    ChildProcessUtilities.execSync(`npm dist-tag rm ${packageName} ${tag}`, opts);
  }

  @logger.logifySync()
  static checkDistTag(packageName, tag, registry) {
    const opts = NpmUtilities.getTagOpts(registry);
    return ChildProcessUtilities.execSync(`npm dist-tag ls ${packageName}`, opts).indexOf(tag) >= 0;
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
  static publishTaggedInDir(tag, directory, registry, callback) {
    const command = ("npm publish --tag " + tag).trim();
    const opts = NpmUtilities.getTagOpts(registry);
    ChildProcessUtilities.exec(`cd ${escapeArgs(directory)} && ${command}`, opts, callback);
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

  static getTagOpts(registry) {
    return registry ? {env: {npm_config_registry: registry}} : null;
  }
}
