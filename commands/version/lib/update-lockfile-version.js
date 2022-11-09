"use strict";

const log = require("npmlog");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");

module.exports.updateLockfileVersion = updateLockfileVersion;

function updateLockfileVersion(pkg) {
  const lockfilePath = path.join(pkg.location, "package-lock.json");

  let chain = Promise.resolve();

  chain = chain.then(() =>
    loadJsonFile(lockfilePath).catch(() => {
      log.verbose("version", `${pkg.name} has no lockfile. Skipping lockfile update.`);
    })
  );
  chain = chain.then((obj) => {
    if (obj) {
      obj.version = pkg.version;

      if (obj.packages && obj.packages[""]) {
        obj.packages[""].version = pkg.version;

        if (obj.packages[""].dependencies) {
          const updatedPkgDependencies = Object.keys(obj.packages[""].dependencies).reduce(
            (prev, next) => ({ ...prev, [next]: pkg.dependencies[next] }),
            {}
          );
          obj.packages[""].dependencies = updatedPkgDependencies;
        }
        if (obj.packages[""].devDependencies) {
          const updatedPkgDevDependencies = Object.keys(obj.packages[""].devDependencies).reduce(
            (prev, next) => ({ ...prev, [next]: pkg.devDependencies[next] }),
            {}
          );
          obj.packages[""].devDependencies = updatedPkgDevDependencies;
        }
      }

      return writeJsonFile(lockfilePath, obj, {
        detectIndent: true,
        indent: 2,
      }).then(() => lockfilePath);
    }
  });

  return chain;
}
