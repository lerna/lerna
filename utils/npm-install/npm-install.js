"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const npa = require("npm-package-arg");
const onExit = require("signal-exit");
const writePkg = require("write-pkg");

const childProcess = require("@lerna/child-process");
const { getNpmExecOpts } = require("@lerna/get-npm-exec-opts");

module.exports.npmInstall = npmInstall;
module.exports.npmInstallDependencies = npmInstallDependencies;

function npmInstall(
  pkg,
  { registry, npmClient, npmClientArgs, npmGlobalStyle, mutex, stdio = "pipe", subCommand = "install" }
) {
  // build command, arguments, and options
  const opts = getNpmExecOpts(pkg, registry);
  const args = [subCommand];
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

  // potential override, e.g. "inherit" in root-only bootstrap
  opts.stdio = stdio;

  // provide env sentinels to avoid recursive execution from scripts
  opts.env.LERNA_EXEC_PATH = pkg.location;
  opts.env.LERNA_ROOT_PATH = pkg.rootPath;

  log.silly("npmInstall", [cmd, args]);
  return childProcess.exec(cmd, args, opts);
}

function npmInstallDependencies(pkg, dependencies, config) {
  log.silly("npmInstallDependencies", pkg.name, dependencies);

  // Nothing to do if we weren't given any deps.
  if (!(dependencies && dependencies.length)) {
    log.verbose("npmInstallDependencies", "no dependencies to install");

    return Promise.resolve();
  }

  const packageJsonBkp = `${pkg.manifestLocation}.lerna_backup`;

  log.silly("npmInstallDependencies", "backup", pkg.manifestLocation);

  return fs.copy(pkg.manifestLocation, packageJsonBkp).then(() => {
    const cleanup = () => {
      log.silly("npmInstallDependencies", "cleanup", pkg.manifestLocation);
      // Need to do this one synchronously because we might be doing it on exit.
      fs.renameSync(packageJsonBkp, pkg.manifestLocation);
    };

    // If we die we need to be sure to put things back the way we found them.
    const unregister = onExit(cleanup);

    // We have a few housekeeping tasks to take care of whether we succeed or fail.
    const done = (finalError) => {
      cleanup();
      unregister();

      if (finalError) {
        throw finalError;
      }
    };

    // mutate a clone of the manifest with our new versions
    const tempJson = transformManifest(pkg, dependencies);

    log.silly("npmInstallDependencies", "writing tempJson", tempJson);

    // Write out our temporary cooked up package.json and then install.
    return writePkg(pkg.manifestLocation, tempJson)
      .then(() => npmInstall(pkg, config))
      .then(() => done(), done);
  });
}

function transformManifest(pkg, dependencies) {
  const json = pkg.toJSON();

  // a map of depName => depVersion (resolved by npm-package-arg)
  const depMap = new Map(
    dependencies.map((dep) => {
      const { name, rawSpec } = npa(dep, pkg.location);

      return [name, rawSpec || "*"];
    })
  );

  // don't run lifecycle scripts
  delete json.scripts;

  // filter all types of dependencies
  ["dependencies", "devDependencies", "optionalDependencies"].forEach((depType) => {
    const collection = json[depType];

    if (collection) {
      Object.keys(collection).forEach((depName) => {
        if (depMap.has(depName)) {
          // overwrite version to ensure it's always present (and accurate)
          collection[depName] = depMap.get(depName);

          // only add to one collection, also keeps track of leftovers
          depMap.delete(depName);
        } else {
          // filter out localDependencies and _duplicate_ external deps
          delete collection[depName];
        }
      });
    }
  });

  ["bundledDependencies", "bundleDependencies"].forEach((depType) => {
    const collection = json[depType];
    if (collection) {
      const newCollection = [];
      for (const depName of collection) {
        if (depMap.has(depName)) {
          newCollection.push(depName);
          depMap.delete(depName);
        }
      }
      json[depType] = newCollection;
    }
  });

  // add all leftovers (root hoisted)
  if (depMap.size) {
    if (!json.dependencies) {
      // TODO: this should definitely be versioned, not blown away after install :/
      json.dependencies = {};
    }

    depMap.forEach((depVersion, depName) => {
      json.dependencies[depName] = depVersion;
    });
  }

  return json;
}
