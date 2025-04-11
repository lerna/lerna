import semver from "semver";

const childProcess = require("@lerna/child-process");

export function hasNpmVersion(range: string) {
  return rangeSatisfies(getNpmVersion(), range);
}

function rangeSatisfies(npmVersion: string, range: string) {
  return Boolean(semver.satisfies(npmVersion, range));
}

function getNpmVersion() {
  return childProcess.execSync("npm", ["--version"]);
}
