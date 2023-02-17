// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { writeJsonFile } from "@nrwl/devkit";
import loadJsonFile from "load-json-file";
import log from "npmlog";
import path from "path";

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
            (prev, next) => ({ ...prev, [next]: pkg.dependencies?.[next] }),
            {}
          );
          obj.packages[""].dependencies = updatedPkgDependencies;
        }
        if (obj.packages[""].devDependencies) {
          const updatedPkgDevDependencies = Object.keys(obj.packages[""].devDependencies).reduce(
            (prev, next) => ({ ...prev, [next]: pkg.devDependencies?.[next] }),
            {}
          );
          obj.packages[""].devDependencies = updatedPkgDevDependencies;
        }
      }

      writeJsonFile(lockfilePath, obj, {
        spaces: 2,
      });

      return lockfilePath;
    }
  });

  return chain;
}
