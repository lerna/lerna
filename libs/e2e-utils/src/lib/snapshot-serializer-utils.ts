// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const E2E_ROOT = process.env.E2E_ROOT!;

function getE2EWithoutLeadingSlash(): string {
  return E2E_ROOT.replace(/^\//, "");
}

function containsE2ERootWithNoLeadingSlash(str: string): boolean {
  return new RegExp(`(?<!/)${getE2EWithoutLeadingSlash()}`).test(str);
}

export function normalizeCommitSHAs(str: string): string {
  return str
    .replaceAll(/\b[0-9a-f]{7,8}\b/g, "{SHORT_COMMIT_SHA}")
    .replaceAll(/\b[0-9a-f]{40}\b/g, "{FULL_COMMIT_SHA}");
}

/**
 * As well as normalizing paths across environments, we need to strip a CI specific log from the
 * output to ensure that snapshots are consistent between local and CI runs.
 *
 * We also need to replace the unique namespacing of the fixtures based on package manager and a
 * random number.
 */
export function normalizeEnvironment(str: string): string {
  const normalized = str
    .replaceAll(/\/private/g, "")
    .replaceAll(E2E_ROOT, "/tmp/lerna-e2e")
    .replaceAll(/lerna info ci enabled\n/g, "")
    // Replace fixture namespacing
    .replaceAll(/-npm-\d+/g, "");

  /**
   * In the case of generated CHANGELOGs we will currently end up with a variant of E2E_ROOT without
   * a leading slash in the output, so we also need to account for that.
   */
  if (!containsE2ERootWithNoLeadingSlash(normalized)) {
    return normalized;
  }

  return normalized.replaceAll(getE2EWithoutLeadingSlash(), "tmp/lerna-e2e");
}

/**
 * In most cases the output of running commands across multiple packages is non-deterministic, so we
 * strip the specifics of individual package names and execution timings.
 */
export function normalizeCommandOutput(str: string): string {
  const lines = str
    .replaceAll(/package-\d/g, "package-X")
    .replaceAll(/\d\.(\d{1,2})s/g, "X.Xs")
    .replaceAll(/Lerna-Profile-\d{8}T\d{6}\.json/g, "Lerna-Profile-XXXXXXXXTXXXXXX.json");
  // We trim each line to reduce the changes of snapshot flakiness
  return lines
    .split("\n")
    .map((r) => r.trim())
    .join("\n");
}
