import path from "path";
import readPkg from "read-pkg";
import semver from "semver";

export default function dependencyIsSatisfied(dir, dependency, needVersion) {
  try {
    const pkg = readPkg.sync(path.join(dir, dependency, "package.json"), { normalize: false });
    return semver.satisfies(pkg.version, needVersion);
  } catch (e) {
    return false;
  }
}
