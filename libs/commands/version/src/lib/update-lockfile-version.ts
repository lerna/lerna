import { Package, log } from "@lerna/core";
import { writeJsonFile } from "@nx/devkit";
import { loadJsonFile } from "load-json-file";
import path from "path";

interface Lockfile {
  version: string;
  packages: {
    [key: string]: {
      version: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };
  };
}

const LOCKFILE_DEPENDENCY_COLLECTIONS = ["dependencies", "devDependencies", "optionalDependencies"] as const;

// Updates npm's package-lock.json only. Bun lockfile updates are handled by running `bun install`
// in the version command after package.json changes are written.
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
    const rootPackage = obj.packages[""];
    rootPackage.version = pkg.version;

    // Only ranges already listed in the lockfile are updated; missing entries are not added.
    for (const collection of LOCKFILE_DEPENDENCY_COLLECTIONS) {
      const lockedRanges = rootPackage[collection];
      if (lockedRanges) {
        rootPackage[collection] = Object.keys(lockedRanges).reduce(
          (prev, next) => ({ ...prev, [next]: pkg[collection]?.[next] }),
          {}
        );
      }
    }
  }

  writeJsonFile(lockfilePath, obj, {
    spaces: 2,
  });

  return lockfilePath;
}
