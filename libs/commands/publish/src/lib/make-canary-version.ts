/**
 * Composes a canary version, e.g. `1.1.0-alpha.0.sha-81e3b44`.
 *
 * The commit SHA is appended as a prerelease identifier (instead of build metadata, which
 * registries strip on publish). The literal "sha-" prefix is fused with the hash into a
 * single identifier so that it always parses as an alphanumeric (string) identifier, no
 * matter which characters the short SHA happens to contain. A dot-separated hash would be
 * parsed as its own identifier: all digits with a leading zero is an invalid semver
 * numeric identifier (see lerna/lerna#1118), and all digits without a leading zero would
 * sort in a different (numeric) precedence class than hex SHAs.
 */
export function makeCanaryVersion(nextVersion: string, preid: string, refCount: number, sha: string): string {
  return `${nextVersion}-${preid}.${Math.max(0, refCount - 1)}.sha-${sha}`;
}
