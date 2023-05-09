import { Package } from "@lerna/core";
import { writeJsonFile } from "@nx/devkit";
import loadJsonFile from "load-json-file";
import log from "npmlog";
import path from "path";

interface Lockfile {
  version: string;
  packages: {
    [key: string]: {
      version: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
  };
}

export async function updateLockfileVersion(pkg: Package): Promise<string | void> {
  const lockfilePath = path.join(pkg.location, "package-lock.json");

  const obj = await loadJsonFile<Lockfile>(lockfilePath).catch(() => {
    log.verbose("version", `${pkg.name} has no lockfile. Skipping lockfile update.`);
  });

  if (!obj) {
    return;
  }

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
