"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");

const ChildProcessUtilities = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");
const useTemporaryManifest = require("@lerna/use-temporary-manifest");

module.exports = npmInstall;
module.exports.dependencies = npmInstallDependencies;

function npmInstall(
  pkg,
  { registry, npmClient, npmClientArgs, npmGlobalStyle, mutex, stdio = "pipe", subCommand = "install" }
) {
  // build command, arguments, and options
  const opts = getExecOpts(pkg, registry);
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
  return ChildProcessUtilities.exec(cmd, args, opts);
}

function npmInstallDependencies(pkg, dependencies, config) {
  log.silly("npmInstallDependencies", pkg.name, dependencies);

  // Nothing to do if we weren't given any deps.
  if (!(dependencies && dependencies.length)) {
    log.verbose("npmInstallDependencies", "no dependencies to install");

    return Promise.resolve();
  }

  // mutate a clone of the manifest with our new versions
  const tempJson = transformManifest(pkg, dependencies);

  return useTemporaryManifest(pkg, tempJson, () => npmInstall(pkg, config));
}

function transformManifest(pkg, dependencies) {
  const json = pkg.toJSON();

  // a map of depName => depVersion (resolved by npm-package-arg)
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
