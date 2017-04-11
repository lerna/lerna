import writePkg from "write-pkg";
import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import onExit from "signal-exit";
import logger from "./logger";
import path from "path";

// Take a dep like "foo@^1.0.0".
// Return a tuple like ["foo", "^1.0.0"].
// Handles scoped packages.
// Returns undefined for version if none specified.
function splitVersion(dep) {
  return dep.match(/^(@?[^@]+)(?:@(.+))?/).slice(1, 3);
}

export default class NpmUtilities {
  @logger.logifyAsync()
  static installInDir(directory, dependencies, config, callback) {
    // Nothing to do if we weren't given any deps.
    if (!(dependencies && dependencies.length)) return callback();

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

      // We have a few housekeeping tasks to take care of whether we succeed or fail.
      const done = (err) => {
        cleanup();
        unregister();
        callback(err);
      };

      // Construct a basic fake package.json with just the deps we need to install.
      const tempJson = {
        dependencies: dependencies.reduce((deps, dep) => {
          const [pkg, version] = splitVersion(dep);
          deps[pkg] = version || "*";
          return deps;
        }, {})
      };

      // Write out our temporary cooked up package.json and then install.
      writePkg(packageJson, tempJson).then(() => {
        const opts = NpmUtilities.getExecOpts(directory, config.registry);
        const args = ["install"];
        const client = config.client || "npm";

        ChildProcessUtilities.exec(client, args, opts, done);
      }).catch(done);
    });
  }

  @logger.logifySync()
  static addDistTag(directory, packageName, version, tag, registry) {
    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.execSync("npm", ["dist-tag", "add", `${packageName}@${version}`, tag], opts);
  }

  @logger.logifySync()
  static removeDistTag(directory, packageName, tag, registry) {
    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.execSync("npm", ["dist-tag", "rm", packageName, tag], opts);
  }

  @logger.logifySync()
  static checkDistTag(directory, packageName, tag, registry) {
    const opts = NpmUtilities.getExecOpts(directory, registry);
    return ChildProcessUtilities.execSync("npm", ["dist-tag", "ls", packageName], opts).indexOf(tag) >= 0;
  }

  @logger.logifyAsync()
  static runScriptInDir(script, args, directory, callback) {
    const opts = NpmUtilities.getExecOpts(directory);
    ChildProcessUtilities.exec("npm", ["run", script, ...args], opts, callback);
  }

  @logger.logifyAsync()
  static runScriptInPackageStreaming(script, args, pkg, callback) {
    const opts = NpmUtilities.getExecOpts(pkg.location);
    ChildProcessUtilities.spawnStreaming(
      "npm", ["run", script, ...args], opts, pkg.name, callback
    );
  }

  @logger.logifyAsync()
  static publishTaggedInDir(tag, directory, registry, callback) {
    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.exec("npm", ["publish", "--tag", tag.trim()], opts, callback);
  }

  static getExecOpts(directory, registry) {
    const opts = {
      cwd: directory,
    };

    if (registry) {
      opts.env = Object.assign({}, process.env, {
        npm_config_registry: registry,
      });
    }

    return opts;
  }
}
