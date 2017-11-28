import log from "npmlog";
import onExit from "signal-exit";
import path from "path";
import writePkg from "write-pkg";

import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import splitVersion from "./utils/splitVersion";

function execInstall(directory, {
  registry,
  npmClient,
  npmClientArgs,
  npmGlobalStyle,
  mutex,
}) {
  // build command, arguments, and options
  const opts = NpmUtilities.getExecOpts(directory, registry);
  const args = ["install"];
  let cmd = npmClient || "npm";

  if (npmGlobalStyle) {
    cmd = "npm";
    args.push("--global-style");
  }

  if (cmd === "yarn" && mutex) {
    args.push("--mutex", mutex);
  }

  if (cmd === "yarn") {
    args.push("--non-interactive");
  }

  if (npmClientArgs && npmClientArgs.length) {
    args.push(...npmClientArgs);
  }

  log.silly("installInDir", [cmd, args]);
  return ChildProcessUtilities.exec(cmd, args, opts);
}

export default class NpmUtilities {
  static installInDir(directory, dependencies, config, callback) {
    log.silly("installInDir", path.basename(directory), dependencies);

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
      writePkg(packageJson, tempJson)
        .then(() => execInstall(directory, config))
        .then(() => done(), done);
    });
  }

  static installInDirOriginalPackageJson(directory, config, callback) {
    log.silly("installInDirOriginalPackageJson", directory);

    return execInstall(directory, config)
      .then(() => callback(), callback);
  }


  static addDistTag(directory, packageName, version, tag, npmConfig) {
    log.silly("addDistTag", tag, version, packageName);
    const npmClient = (npmConfig && npmConfig.client) || 'npm';
    const npmRegistry = (npmConfig && npmConfig.registry) || undefined;
    const opts = NpmUtilities.getExecOpts(directory, npmRegistry);
    ChildProcessUtilities.execSync(npmClient, ["dist-tag", "add", `${packageName}@${version}`, tag], opts);
  }

  static removeDistTag(directory, packageName, tag, npmConfig) {
    log.silly("removeDistTag", tag, packageName);
    const npmClient = (npmConfig && npmConfig.client) || 'npm';
    const npmRegistry = (npmConfig && npmConfig.registry) || undefined;
    const opts = NpmUtilities.getExecOpts(directory, npmRegistry);
    ChildProcessUtilities.execSync(npmClient, ["dist-tag", "rm", packageName, tag], opts);
  }

  static checkDistTag(directory, packageName, tag, npmConfig) {
    log.silly("checkDistTag", tag, packageName);
    const npmClient = (npmConfig && npmConfig.client) || 'npm';
    const npmRegistry = (npmConfig && npmConfig.registry) || undefined;
    const opts = NpmUtilities.getExecOpts(directory, npmRegistry);
    return ChildProcessUtilities
      .execSync(npmClient, ["dist-tag", "ls", packageName], opts)
      .indexOf(tag) >= 0;

  }

  static runScriptInDir(script, {args, directory, npmClient}, callback) {
    log.silly("runScriptInDir", script, args, path.basename(directory));

    const opts = NpmUtilities.getExecOpts(directory);
    ChildProcessUtilities.exec(npmClient, ["run", script, ...args], opts, callback);
  }

  static runScriptInDirSync(script, {args, directory, npmClient}, callback) {
    log.silly("runScriptInDirSync", script, args, path.basename(directory));

    const opts = NpmUtilities.getExecOpts(directory);
    ChildProcessUtilities.execSync(npmClient, ["run", script, ...args], opts, callback);
  }

  static runScriptInPackageStreaming(script, {args, pkg, npmClient}, callback) {
    log.silly("runScriptInPackageStreaming", [script, args, pkg.name]);

    const opts = NpmUtilities.getExecOpts(pkg.location);
    ChildProcessUtilities.spawnStreaming(
      npmClient, ["run", script, ...args], opts, pkg.name, callback
    );
  }

  static publishTaggedInDir(tag, directory, npmConfig, callback) {
    log.silly("publishTaggedInDir", tag, path.basename(directory));
    const npmClient = (npmConfig && npmConfig.client) || 'npm';
    const npmRegistry = (npmConfig && npmConfig.registry) || undefined;
    const opts = NpmUtilities.getExecOpts(directory, npmRegistry);
    ChildProcessUtilities.exec(npmClient, ["publish", "--tag", tag.trim()], opts, callback);
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

    log.silly("getExecOpts", opts);
    return opts;
  }
}
