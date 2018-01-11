import fs from "fs";
import os from "os";
import path from "path";
import readPkg from "read-pkg";
import semver from "semver";

import Package from "../../src/Package";

const toPackage = ref =>
  ref instanceof Package ? ref : new Package(readPkg.sync(ref, { normalize: false }), ref);

const matchBinaryLinks = () => (pkgRef, raw) => {
  const pkg = toPackage(pkgRef);

  const inputs = Array.isArray(raw) ? raw : [raw];

  const links =
    os.platform() === "win32"
      ? inputs.reduce((acc, input) => [...acc, input, [input, "cmd"].join(".")], [])
      : inputs;

  const expectation = `expected ${pkg.name} to link to ${links.join(", ")}`;

  const found = fs.readdirSync(pkg.binLocation);
  const missing = links.filter(link => found.indexOf(link) === -1);
  const superfluous = found.filter(link => links.indexOf(link) === -1);

  if (missing.length > 0 || superfluous.length > 0) {
    return {
      message: [
        expectation,
        missing.length > 0 ? `missing: ${missing.join(", ")}` : "",
        superfluous.length > 0 ? `superfluous: ${superfluous.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      pass: false,
    };
  }

  return {
    message: expectation,
    pass: true,
  };
};

const matchDependency = dependencyType => (manifest, pkg, range) => {
  const noDeps = typeof manifest[dependencyType] !== "object";
  const id = [pkg, range].filter(Boolean).join("@");
  const verb = dependencyType === "dependencies" ? "depend" : "dev-depend";

  const expectation = `expected ${manifest.name} to ${verb} on ${id}`;
  const json = JSON.stringify(manifest[dependencyType], null, "  ");

  if (noDeps) {
    return {
      message: `${expectation} but no .${dependencyType} specified`,
      pass: false,
    };
  }

  const missingDep = !(pkg in manifest[dependencyType]);

  if (missingDep) {
    return {
      message: `${expectation} but it is missing from .${dependencyType}\n${json}`,
      pass: false,
    };
  }

  const version = manifest[dependencyType][pkg];
  const mismatchedDep = range ? !semver.intersects(version, range) : false;

  if (mismatchedDep) {
    return {
      message: `${expectation} but ${version} does not satisfy ${range}\n${json}`,
      pass: false,
    };
  }

  return {
    message: expectation,
    pass: true,
  };
};

// eslint-disable-next-line prefer-destructuring
const X_OK = (fs.constants || fs).X_OK;

const matchExecutableFile = () => (pkgRef, raw) => {
  const files = Array.isArray(raw) ? raw : [raw];
  const expectation = `expected ${files.join(", ")} to be executable`;

  const pkg = toPackage(pkgRef);

  const failed = files.filter(file => {
    try {
      return fs.accessSync(path.join(pkg.location, file), X_OK);
    } catch (_) {
      return true;
    }
  });

  const pass = failed.length === 0;
  const verb = failed.length > 1 ? "were" : "was";

  const message = pass
    ? expectation
    : `${expectation} while ${failed.join(", ")} ${verb} found to be not executable.`;

  return {
    message,
    pass,
  };
};

export default {
  toDependOn: matchDependency("dependencies"),
  toDevDependOn: matchDependency("devDependencies"),
  toHaveExecutable: matchExecutableFile(),
  toHaveBinaryLink: matchBinaryLinks(),
};
