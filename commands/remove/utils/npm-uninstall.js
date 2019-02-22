"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const npa = require("npm-package-arg");

const ChildProcessUtilities = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");

const useTemporaryManifest = require("@lerna/use-temporary-manifest");

module.exports = npmUninstallWithDeps;

function npmUninstall(
  pkg,
  toRemove,
  { registry, npmClient, npmClientArgs, npmGlobalStyle, mutex, stdio = "pipe" }
) {
  // build command, arguments, and options
  const opts = getExecOpts(pkg, registry);
  let cmd = npmClient || "npm";
  const args = [];

  // uninstall command
  switch (npmClient) {
    case "yarn":
      args.push("remove", toRemove);
      break;
    case "npm":
    default:
      args.push("uninstall", toRemove);
      break;
  }

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

  log.silly("npmUninstall", [cmd, args]);

  return ChildProcessUtilities.exec(cmd, args, opts);
}

function npmUninstallWithDeps(pkg, nonHoistedDependencies, toRemove, config) {
  log.silly("npmUninstallWithDeps", pkg.name, nonHoistedDependencies, toRemove);

  // Nothing to do if we weren't given any deps.
  if (!(nonHoistedDependencies && nonHoistedDependencies.length)) {
    log.verbose("npmUninstallWithDeps", "no dependencies to remove from");

    return Promise.resolve();
  }

  const tempJson = transformManifest(pkg, nonHoistedDependencies);
  return useTemporaryManifest(pkg, tempJson, () => npmUninstall(pkg, toRemove, config));
}

function transformManifest(pkg, dependencies) {
  const json = pkg.toJSON();

  // a map of depName => depVersion (resolved by libnpm/parse-arg)
  const depMap = new Map(
    dependencies.map(dep => {
      const { name, rawSpec } = npa(dep, pkg.location);

      return [name, rawSpec || "*"];
    })
  );

  // don't run lifecycle scripts
  delete json.scripts;

  // filter all types of dependencies
  ["dependencies", "devDependencies", "optionalDependencies"].forEach(depType => {
    const collection = json[depType];

    if (collection) {
      Object.keys(collection).forEach(depName => {
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

  ["bundledDependencies", "bundleDependencies"].forEach(depType => {
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
