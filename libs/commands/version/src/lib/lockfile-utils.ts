import { log } from "@lerna/core";
import fs from "fs";
import path from "path";

/**
 * Information about a lockfile in the project.
 */
export interface LockfileInfo {
  /** The absolute path to the lockfile */
  path: string;
  /** Whether the lockfile exists on the filesystem */
  exists: boolean;
  /** The type of package manager the lockfile belongs to */
  type: "npm" | "yarn" | "pnpm";
}

/**
 * Detects available lockfiles in the project root and returns information about them.
 * Supports npm (package-lock.json), yarn (yarn.lock), pnpm (pnpm-lock.yaml).
 *
 * This function checks for the existence of all known lockfile types and logs verbose
 * information about discovered lockfiles. If file system errors occur during checks,
 * they are logged but do not prevent the function from completing.
 *
 * @param rootPath - The root path of the project to search for lockfiles
 * @returns Array of lockfile information objects, including both existing and non-existing files
 * @example
 * ```typescript
 * const lockfiles = detectLockfiles('/path/to/project');
 * const existingLockfiles = lockfiles.filter(lf => lf.exists);
 * console.log(`Found ${existingLockfiles.length} lockfiles`);
 * ```
 */
export function detectLockfiles(rootPath: string): LockfileInfo[] {
  const lockfiles: LockfileInfo[] = [
    {
      path: path.join(rootPath, "package-lock.json"),
      exists: false,
      type: "npm",
    },
    {
      path: path.join(rootPath, "yarn.lock"),
      exists: false,
      type: "yarn",
    },
    {
      path: path.join(rootPath, "pnpm-lock.yaml"),
      exists: false,
      type: "pnpm",
    },
  ];

  // Check which lockfiles exist
  lockfiles.forEach((lockfile) => {
    try {
      lockfile.exists = fs.existsSync(lockfile.path);
      if (lockfile.exists) {
        log.verbose("lockfile", `Found ${lockfile.type} lockfile at ${lockfile.path}`);
      }
    } catch (error) {
      log.verbose("lockfile", `Error checking ${lockfile.type} lockfile: ${error.message}`);
      lockfile.exists = false;
    }
  });

  return lockfiles;
}

/**
 * Gets the primary lockfile for the given npm client, falling back to detected lockfiles.
 *
 * This function uses a priority-based selection system:
 * 1. If an npmClient is specified and its lockfile exists, return it
 * 2. Otherwise, fallback to priority order: npm > yarn > pnpm
 * 3. If no lockfiles exist, return null
 *
 * @param rootPath - The root path of the project
 * @param npmClient - The npm client being used (optional)
 * @returns The primary lockfile info, or null if none found
 * @example
 * ```typescript
 * // Get lockfile for specific client
 * const pnpmLockfile = getPrimaryLockfile('/project', 'pnpm');
 *
 * // Get any available lockfile with priority
 * const anyLockfile = getPrimaryLockfile('/project');
 * ```
 */
export function getPrimaryLockfile(rootPath: string, npmClient?: string): LockfileInfo | null {
  const lockfiles = detectLockfiles(rootPath);

  // If npmClient is specified, prefer its lockfile
  if (npmClient) {
    const clientLockfile = lockfiles.find((lf) => lf.type === npmClient && lf.exists);
    if (clientLockfile) {
      return clientLockfile;
    }
  }

  // Fallback to any existing lockfile, preferring npm > yarn > pnpm
  const existingLockfiles = lockfiles.filter((lf) => lf.exists);
  if (existingLockfiles.length === 0) {
    return null;
  }

  const priority = ["npm", "yarn", "pnpm"];
  for (const type of priority) {
    const lockfile = existingLockfiles.find((lf) => lf.type === type);
    if (lockfile) {
      return lockfile;
    }
  }

  return existingLockfiles[0];
}

/**
 * Formats lockfile paths for display in dry-run mode.
 *
 * This function determines which lockfile paths would be modified based on the
 * npm client being used. For npm, it only includes the path if the lockfile exists.
 * For other package managers, it includes the path regardless of existence since
 * the lockfile might be created during the operation.
 *
 * @param rootPath - The root path of the project
 * @param npmClient - The npm client being used (defaults to npm behavior)
 * @returns Array of lockfile paths that would be modified during versioning
 * @example
 * ```typescript
 * // Get paths for pnpm
 * const paths = getModifiedLockfilePaths('/project', 'pnpm');
 * console.log(paths); // ['/project/pnpm-lock.yaml']
 *
 * // Get paths for default (npm) behavior
 * const npmPaths = getModifiedLockfilePaths('/project');
 * console.log(npmPaths); // ['/project/package-lock.json'] (if exists)
 * ```
 */
export function getModifiedLockfilePaths(rootPath: string, npmClient?: string): string[] {
  const lockfiles = detectLockfiles(rootPath);
  const modifiedPaths: string[] = [];

  if (npmClient === "pnpm") {
    const pnpmLockfile = lockfiles.find((lf) => lf.type === "pnpm");
    if (pnpmLockfile?.exists || npmClient === "pnpm") {
      modifiedPaths.push(pnpmLockfile.path);
    }
  } else if (npmClient === "yarn") {
    const yarnLockfile = lockfiles.find((lf) => lf.type === "yarn");
    if (yarnLockfile?.exists || npmClient === "yarn") {
      modifiedPaths.push(yarnLockfile.path);
    }
  } else {
    // npm or default
    const npmLockfile = lockfiles.find((lf) => lf.type === "npm");
    if (npmLockfile?.exists) {
      modifiedPaths.push(npmLockfile.path);
    }
  }

  return modifiedPaths;
}
