import log from "npmlog";
import path from "path";
import readPkg from "read-pkg";
import semver from "semver";

export default function dependencyIsSatisfied(dir, depName, needVersion) {
  log.silly("dependencyIsSatisfied", [depName, needVersion, dir]);

  let retVal;
  try {
    const pkg = readPkg.sync(path.join(dir, depName, "package.json"), { normalize: false });
    retVal = semver.satisfies(pkg.version, needVersion);
  } catch (e) {
    retVal = false;
  }

  log.verbose("dependencyIsSatisfied", depName, retVal);
  return retVal;
}
