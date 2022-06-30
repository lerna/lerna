import { E2E_ROOT } from "./fixture";

export function normalizeCommitSHAs(str: string): string {
  return str
    .replaceAll(/\b[0-9a-f]{7,8}\b/g, "{SHORT_COMMIT_SHA}")
    .replaceAll(/\b[0-9a-f]{40}\b/g, "{FULL_COMMIT_SHA}");
}

/**
 * As well as normalizing paths across environments, we need to strip a CI specific log from the
 * output to ensure that snapshots are consistent between local and CI runs.
 */
export function normalizeEnvironment(str: string): string {
  return str
    .replaceAll(/\/private\/tmp\//g, "/tmp/")
    .replaceAll(E2E_ROOT, "/tmp/lerna-e2e")
    .replaceAll(/lerna info ci enabled\n/g, "");
}

/**
 * In most cases the output of running commands across multiple packages is non-deterministic, so we
 * strip the specifics of individual package names and execution timings.
 */
export function normalizeCommandOutput(str: string): string {
  return str
    .replaceAll(/package-\d/g, "package-X")
    .replaceAll(/\d\.(\d{1,2})s/g, "X.Xs")
    .replaceAll(/Lerna-Profile-\d{8}T\d{6}\.json/g, "Lerna-Profile-XXXXXXXXTXXXXXX.json");
}
