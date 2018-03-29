import log from "npmlog";
import onExit from "signal-exit";
import path from "path";
import writePkg from "write-pkg";

import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import splitVersion from "./utils/splitVersion";

function execInstall(directory, { registry, npmClient, npmClientArgs, npmGlobalStyle, mutex }) {
  // build command, arguments, and options
  // eslint-disable-next-line no-use-before-define
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
    const packageJsonBkp = `${packageJson}.lerna_backup`;

    log.silly("installInDir", "backup", packageJson);
    FileSystemUtilities.rename(packageJson, packageJsonBkp, err => {
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
      const done = finalError => {
        cleanup();
        unregister();
        callback(finalError);
      };

      // Construct a basic fake package.json with just the deps we need to install.
      const tempJson = {
        dependencies: dependencies.reduce((deps, dep) => {
          const [pkg, version] = splitVersion(dep);
          deps[pkg] = version || "*";
          return deps;
        }, {}),
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

    return execInstall(directory, config).then(() => callback(), callback);
  }

  static addDistTag(directory, packageName, version, tag, registry) {
    log.silly("addDistTag", tag, version, packageName);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.execSync("npm", ["dist-tag", "add", `${packageName}@${version}`, tag], opts);
  }

  static removeDistTag(directory, packageName, tag, registry) {
    log.silly("removeDistTag", tag, packageName);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    ChildProcessUtilities.execSync("npm", ["dist-tag", "rm", packageName, tag], opts);
  }

  static checkDistTag(directory, packageName, tag, registry) {
    log.silly("checkDistTag", tag, packageName);

    const opts = NpmUtilities.getExecOpts(directory, registry);
    return ChildProcessUtilities.execSync("npm", ["dist-tag", "ls", packageName], opts).indexOf(tag) >= 0;
  }

  static runScriptInDir(script, { args, directory, npmClient }, callback) {
    log.silly("runScriptInDir", script, args, path.basename(directory));

    const opts = NpmUtilities.getExecOpts(directory);
    ChildProcessUtilities.exec(npmClient, ["run", script, ...args], opts, callback);
  }

  static runScriptInDirSync(script, { args, directory, npmClient }, callback) {
    log.silly("runScriptInDirSync", script, args, path.basename(directory));

    const opts = NpmUtilities.getExecOpts(directory);
    ChildProcessUtilities.execSync(npmClient, ["run", script, ...args], opts, callback);
  }

  static runScriptInPackageStreaming(script, { args, pkg, npmClient, prefix }, callback) {
    log.silly("runScriptInPackageStreaming", [script, args, pkg.name]);

    const opts = NpmUtilities.getExecOpts(pkg.location);
    // prefix is default to `true` if it's undefined
    const prefixStr = prefix === false ? "" : pkg.name;
    ChildProcessUtilities.spawnStreaming(npmClient, ["run", script, ...args], opts, prefixStr, callback);
  }

  static publishTaggedInDir(tag, pkg, { npmClient, registry }, callback) {
    const directory = pkg.location;

    log.silly("publishTaggedInDir", tag, path.basename(directory));

    const opts = NpmUtilities.getExecOpts(directory, registry);
    const args = ["publish", "--tag", tag.trim()];

    if (npmClient === "yarn") {
      // skip prompt for new version, use existing instead
      // https://yarnpkg.com/en/docs/cli/publish#toc-yarn-publish-new-version
      args.push("--new-version", pkg.version);
    }

    ChildProcessUtilities.exec(npmClient, args, opts, callback);
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
