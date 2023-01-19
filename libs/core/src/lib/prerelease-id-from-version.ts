import semver from "semver";

export function prereleaseIdFromVersion(version: string): string | undefined {
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (semver.prerelease(version) || []).shift();
}
