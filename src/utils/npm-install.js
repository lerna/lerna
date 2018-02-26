"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");
const onExit = require("signal-exit");
const path = require("path");
const readPkg = require("read-pkg");
const writePkg = require("write-pkg");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const FileSystemUtilities = require("../FileSystemUtilities");
const getExecOpts = require("./get-npm-exec-opts");

module.exports = npmInstall;
module.exports.dependencies = installInDir;

function npmInstall(directory, { registry, npmClient, npmClientArgs, npmGlobalStyle, mutex }) {
  // build command, arguments, and options
  const opts = getExecOpts(directory, registry);
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

  log.silly("npmInstall", [cmd, args]);
  return ChildProcessUtilities.exec(cmd, args, opts);
}

function readPackageNameAndVersion(packageJson) {
  return readPkg(packageJson).then(
    ({ name, version }) => ({ name, version }),
    err => (err.code === "ENOENT" ? {} : Promise.reject(err))
  );
}

function installInDir(directory, dependencies, config, callback) {
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

    const tempDependencies = dependencies.reduce((obj, dep) => {
      const { name: pkg, rawSpec: version } = npa(dep);
      obj[pkg] = version || "*";
      return obj;
    }, {});

    log.silly("installInDir", "reading package.json", packageJsonBkp);

    return readPackageNameAndVersion(packageJsonBkp)
      .then(({ name, version }) => {
        // Construct a basic fake package.json with just the deps we need to install.
        // We keep "name" and "version" to because npm will write them to "package-lock.json".
        const tempJson = {
          name,
          version,
          dependencies: tempDependencies,
        };

        log.silly("installInDir", "writing tempJson", tempJson);

        // Write out our temporary cooked up package.json and then install.
        return writePkg(packageJson, tempJson);
      })
      .then(() => npmInstall(directory, config))
      .then(() => done(), done);
  });
}
