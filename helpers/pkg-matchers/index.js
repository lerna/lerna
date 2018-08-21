"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const readPkg = require("read-pkg");
const semver = require("semver");

const Package = require("@lerna/package");

const toPackage = pkgRef =>
  // don't use instanceof because it fails across nested module boundaries
  typeof pkgRef !== "string" && pkgRef.location
    ? pkgRef
    : new Package(readPkg.sync(pkgRef, { normalize: false }), pkgRef);

const matchBinaryLinks = () => (pkgRef, raw) => {
  const pkg = toPackage(pkgRef);

  const inputs = Array.isArray(raw) ? raw : [raw];

  const links =
    os.platform() === "win32"
      ? inputs.reduce((acc, input) => [...acc, input, [input, "cmd"].join(".")], [])
      : inputs;

  const expectedName = `expected ${pkg.name}`;
  const expectedAction = `to link to ${links.join(", ")}`;

  let found;

  try {
    found = fs.readdirSync(pkg.binLocation);
  } catch (err) {
    if (links.length === 0 && err.code === "ENOENT") {
      return {
        message: () => `${expectedName} to have binary links`,
        pass: true,
      };
    }

    throw err;
  }

  const missing = links.filter(link => found.indexOf(link) === -1);
  const superfluous = found.filter(link => links.indexOf(link) === -1);

  if (missing.length > 0 || superfluous.length > 0) {
    const message = [
      expectedName,
      expectedAction,
      missing.length > 0 ? `missing: ${missing.join(", ")}` : "",
      superfluous.length > 0 ? `superfluous: ${superfluous.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      message: () => message,
      pass: false,
    };
  }

  return {
    message: () => `${expectedName} not ${expectedAction}`,
    pass: true,
  };
};

const matchDependency = dependencyType => (manifest, pkg, range, options) => {
  const noDeps = typeof manifest[dependencyType] !== "object";
  const id = [pkg, range].filter(Boolean).join("@");
  const verb = dependencyType === "dependencies" ? "depend" : "dev-depend";
  const exact = options && options.exact;

  const expectedName = `expected ${manifest.name}`;
  const expectedAction = `to ${verb} on ${id}`;
  const expectation = `${expectedName} ${expectedAction}`;
  const json = JSON.stringify(manifest[dependencyType], null, "  ");

  if (noDeps) {
    return {
      message: () => `${expectation} but no .${dependencyType} specified`,
      pass: false,
    };
  }

  const missingDep = !(pkg in manifest[dependencyType]);

  if (missingDep) {
    return {
      message: () => `${expectation} but it is missing from .${dependencyType}\n${json}`,
      pass: false,
    };
  }

  // replace backslashes because windows sucks
  const version = manifest[dependencyType][pkg].replace(/[\\]/g, "/");

  // we don't care about semver intersection, it's not always a semver range
  const mismatchedDep = range && version !== range;

  if (mismatchedDep) {
    return {
      message: () => `${expectation} but ${version} does not satisfy ${range}\n${json}`,
      pass: false,
    };
  }

  if (exact) {
    if (!semver.valid(version)) {
      return {
        message: () => `${expectation} but ${version} is not an exact version\n${json}`,
        pass: false,
      };
    }

    // semver.eq will throw a TypeError if range is not a valid exact version
    if (!semver.eq(version, range)) {
      return {
        message: () => `${expectation} but ${version} is not ${range}\n${json}`,
        pass: false,
      };
    }
  }

  return {
    message: () => `${expectedName} not ${expectedAction}`,
    pass: true,
  };
};

// eslint-disable-next-line prefer-destructuring
const X_OK = (fs.constants || fs).X_OK;

const matchExecutableFile = () => (pkgRef, raw) => {
  const files = Array.isArray(raw) ? raw : [raw];
  const expectedFiles = `expected ${files.join(", ")}`;
  const expectedAction = "to be executable";
  const expectation = `${expectedFiles} ${expectedAction}`;
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
    ? `${expectedFiles} not ${expectedAction}`
    : `${expectation} while ${failed.join(", ")} ${verb} found to be not executable.`;

  return {
    message: () => message,
    pass,
  };
};

module.exports = {
  toDependOn: matchDependency("dependencies"),
  toDevDependOn: matchDependency("devDependencies"),
  toHaveExecutable: matchExecutableFile(),
  toHaveBinaryLink: matchBinaryLinks(),
};
