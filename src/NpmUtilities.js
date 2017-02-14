import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import onExit from "signal-exit";
import logger from "./logger";
import escapeArgs from "command-join";
import path from "path";
import semver from "semver";

export default class NpmUtilities {
  @logger.logifyAsync()
  static installInDir(directory, dependencies, registry, callback) {

    // Nothing to do if we weren't given any deps.
    if (!(dependencies && dependencies.length)) return callback();

    const args = ["install"];

    const opts = {
      cwd: directory,
      stdio: ["ignore", "pipe", "pipe"],
    };

    if (registry) {
      opts.env = {npm_config_registry: registry};
    }

    ChildProcessUtilities.spawn("npm", args, opts, callback);
    const packageJson = path.join(directory, "package.json");
    const packageJsonBkp = packageJson + ".lerna_backup";

    FileSystemUtilities.rename(packageJson, packageJsonBkp, (err) => {
      if (err) return callback(err);

      const cleanup = () => {

        // Need to do this one synchronously because we might be doing it on exit.
        FileSystemUtilities.renameSync(packageJsonBkp, packageJson);
      };

      // If we die we need to be sure to put things back the way we found them.
      const unregister = onExit(cleanup);

      // Construct a basic fake package.json with just the deps we need to install.
      const tempJson = JSON.stringify({
        dependencies: dependencies.reduce((deps, dep) => {
          const [pkg, version] = NpmUtilities.splitVersion(dep);
          deps[pkg] = version || "*";
          return deps;
        }, {})
      });

      // Write out our temporary cooked up package.json and then install.
      FileSystemUtilities.writeFile(packageJson, tempJson, (err) => {

        // We have a few housekeeping tasks to take care of whether we succeed or fail.
        const done = (err) => {
          cleanup();
          unregister();
          callback(err);
        };

        if (err) {
          return done(err);
        } else {
          ChildProcessUtilities.spawn("npm", args, opts, done);
        }
      });
    });
  }

  // Take a dep like "foo@^1.0.0".
  // Return a tuple like ["foo", "^1.0.0"].
  // Handles scoped packages.
  // Returns undefined for version if none specified.
  static splitVersion(dep) {
    return dep.match(/^(@?[^@]+)(?:@(.+))?/).slice(1, 3);
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
