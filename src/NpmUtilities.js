import log from "npmlog";
import writePkg from "write-pkg";
import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import onExit from "signal-exit";
import path from "path";

// Take a dep like "foo@^1.0.0".
// Return a tuple like ["foo", "^1.0.0"].
// Handles scoped packages.
// Returns undefined for version if none specified.
function splitVersion(dep) {
  return dep.match(/^(@?[^@]+)(?:@(.+))?/).slice(1, 3);
}

export default class NpmUtilities {
  static installInDir(directory, dependencies, config, npmGlobalStyle, callback) {
    log.silly("installInDir", [directory, dependencies, config, npmGlobalStyle]);

    // npmGlobalStyle is an optional argument
    if (typeof npmGlobalStyle === "function") {
      callback = npmGlobalStyle;
      npmGlobalStyle = false;
    }

    // Nothing to do if we weren't given any deps.
    if (!(dependencies && dependencies.length)) {
      log.verbose("installInDir", "no dependencies to install");
      return callback();
    }

    const packageJson = path.join(directory, "package.json");
    const packageJsonBkp = packageJson + ".lerna_backup";

    log.silly("installInDir", "backup", packageJson);
    FileSystemUtilities.rename(packageJson, packageJsonBkp, (err) => {
      if (err) {
        log.error("installInDir", "problem backing up package.json", err);
        return callback(err);
      }

      const cleanup = () => {
        log.silly("installInDir", "cleanup", packageJson);
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

      log.silly("installInDir", "writing tempJson", tempJson);
      // Write out our temporary cooked up package.json and then install.
      writePkg(packageJson, tempJson).then(() => {
        // build command, arguments, and options
        const opts = NpmUtilities.getExecOpts(directory, config.registry);
        const args = ["install"];
        let cmd = config.npmClient || "npm";

        if (npmGlobalStyle) {
          cmd = "npm";
          args.push("--global-style");
        }

        if (cmd === "yarn" && config.mutex) {
          args.push("--mutex", config.mutex);
        }

        log.silly("installInDir", [cmd, args]);
        ChildProcessUtilities.exec(cmd, args, opts, done);
      }).catch(done);
    });
  }

  static addDistTag(directory, packageName, version, tag, registry) {
    log.silly("addDistTag", [directory, packageName, version, tag, registry]);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.execSync("npm", ["dist-tag", "add", `${packageName}@${version}`, tag], opts);
  }

  static removeDistTag(directory, packageName, tag, registry) {
    log.silly("removeDistTag", [directory, packageName, tag, registry]);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.execSync("npm", ["dist-tag", "rm", packageName, tag], opts);
  }

  static checkDistTag(directory, packageName, tag, registry) {
    log.silly("checkDistTag", [directory, packageName, tag, registry]);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    return ChildProcessUtilities.execSync("npm", ["dist-tag", "ls", packageName], opts).indexOf(tag) >= 0;
  }

  static runScriptInDir(script, args, directory, callback) {
    log.silly("runScriptInDir", [script, args, directory]);

    const opts = NpmUtilities.getExecOpts(directory);
    ChildProcessUtilities.exec("npm", ["run", script, ...args], opts, callback);
  }

  static runScriptInPackageStreaming(script, args, pkg, callback) {
    log.silly("runScriptInPackageStreaming", [script, args, pkg]);

    const opts = NpmUtilities.getExecOpts(pkg.location);
    ChildProcessUtilities.spawnStreaming(
      "npm", ["run", script, ...args], opts, pkg.name, callback
    );
  }

  static publishTaggedInDir(tag, directory, registry, callback) {
    log.silly("publishTaggedInDir", [tag, directory, registry]);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.exec("npm", ["publish", "--tag", tag.trim()], opts, callback);
  }

  static getExecOpts(directory, registry) {
    log.silly("getExecOpts", [directory, registry]);

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
