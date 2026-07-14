import { execPackageManager, log } from "@lerna/core";
import { ExecOptions } from "child_process";
import fs from "fs";
import path from "path";

const LOCKFILE_NAMES = ["bun.lockb", "bun.lock"];
const BACKUP_SUFFIX = ".lerna-backup";

export interface UpdateBunLockfileOptions {
  rootPath: string;
  npmClientArgs: string[];
  runScriptsOnLockfileUpdate?: boolean;
  execOpts: ExecOptions;
}

/**
 * Regenerates the root bun lockfile(s) after package.json versions have been bumped and
 * returns the paths that should be staged.
 *
 * Bun caches workspace package versions from the existing lockfile and does not re-read
 * them from package.json, so the stale lockfile(s) must be moved out of the way before
 * `bun install --lockfile-only` regenerates them. Depending on the bun version this can
 * migrate a legacy binary bun.lockb to the text bun.lock format, so both the removal and
 * the regenerated file are returned for staging.
 *
 * The stale lockfiles are kept as on-disk backups (not just in memory) while bun runs, so
 * an interrupted or killed process never destroys the only copy.
 */
export async function updateBunLockfile({
  rootPath,
  npmClientArgs,
  runScriptsOnLockfileUpdate,
  execOpts,
}: UpdateBunLockfileOptions): Promise<string[]> {
  const candidates = LOCKFILE_NAMES.map((name) => path.join(rootPath, name));
  const staleLockfiles = candidates.filter((candidate) => fs.existsSync(candidate));

  if (staleLockfiles.length === 0) {
    log.verbose(
      "version",
      `No bun lockfile (${LOCKFILE_NAMES.join(", ")}) found at the repo root, skipping lockfile update`
    );
    return [];
  }

  log.verbose("version", `Updating root ${staleLockfiles.map((p) => path.basename(p)).join(", ")}`);

  const backups: Array<[lockfilePath: string, backupPath: string]> = [];
  try {
    for (const lockfilePath of staleLockfiles) {
      const backupPath = `${lockfilePath}${BACKUP_SUFFIX}`;
      fs.renameSync(lockfilePath, backupPath);
      backups.push([lockfilePath, backupPath]);
    }

    await execPackageManager(
      "bun",
      [
        "install",
        "--lockfile-only",
        !runScriptsOnLockfileUpdate ? "--ignore-scripts" : "",
        ...npmClientArgs,
      ].filter(Boolean),
      execOpts
    );
  } catch (err) {
    restoreBackups(backups, candidates);
    log.error(
      "version",
      "Failed to update the bun lockfile via `bun install --lockfile-only`. " +
        "The original lockfile(s) have been restored. Ensure bun is installed and on your PATH."
    );
    throw err;
  }

  for (const [, backupPath] of backups) {
    try {
      fs.unlinkSync(backupPath);
    } catch (cleanupErr) {
      log.warn("version", `Could not remove lockfile backup ${backupPath}: ${cleanupErr}`);
    }
  }

  // Stage removals as well as every regenerated lockfile so format migrations are
  // captured when granular pathspecs are enabled.
  const changedFiles = new Set(staleLockfiles);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      changedFiles.add(candidate);
    }
  }
  return Array.from(changedFiles);
}

/**
 * Best-effort restore of the original lockfiles. Never throws: the caller rethrows the
 * bun install error, which must not be masked by a restore failure.
 */
function restoreBackups(backups: Array<[string, string]>, candidates: string[]): void {
  try {
    // Remove any partially generated lockfiles before renaming the backups into place.
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        fs.unlinkSync(candidate);
      }
    }
    for (const [lockfilePath, backupPath] of backups) {
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, lockfilePath);
      }
    }
  } catch (restoreErr) {
    log.error(
      "version",
      `Failed to restore the original bun lockfile(s): ${restoreErr}. ` +
        `Backup files with the ${BACKUP_SUFFIX} suffix may remain next to them for manual recovery.`
    );
  }
}
