"use strict";

const fs = require("fs-extra");
const path = require("path");
const normalizePath = require("normalize-path");
const { printObjectProperties } = require("pretty-format/build/collections");
const npmConf = require("@lerna/npm-conf");
const { getPackages } = require("@lerna/project");
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../../integration"));

const packDirectory = require("..");

// temp-write creates temp directories that are 36 characters long (uuid.v4())
const TAR_DIR_REGEXP = /([^\s"]*[\\/][-0-9a-f]{36})([^\s"]*)/g;
const hasOwn = Object.prototype.hasOwnProperty;

function isObject(val) {
  return val && typeof val === "object" && Array.isArray(val) === false;
}

function isString(val) {
  return val && typeof val === "string";
}

function serializeTempDir(match, cwd, subPath) {
  return normalizePath(path.join("__TAR_DIR__", subPath));
}

// process.umask() differs between macOS and Ubuntu,
// so we need to overwrite derived hashes for consistency
expect.addSnapshotSerializer({
  test(val) {
    if (isObject(val)) {
      // 420 in macOS, 436 in Ubuntu
      return hasOwn.call(val, "mode");
    }

    if (isString(val)) {
      // integrity or shasum
      return /sha512-[\S]{88}/.test(val) || /[0-9a-f]{40}/.test(val) || TAR_DIR_REGEXP.test(val);
    }
  },
  serialize(val, config, indentation, depth, refs, printer) {
    if (isString(val)) {
      if (/tgz$/.test(val)) {
        const str = val.replace(TAR_DIR_REGEXP, serializeTempDir);

        // top-level strings don't need quotes, but nested ones do (object properties, etc)
        return depth ? `"${str}"` : str;
      }

      if (val.indexOf("sha512") > -1) {
        return '"INTEGRITY"';
      }

      return '"SHASUM"';
    }

    // eslint-disable-next-line no-param-reassign
    val.mode = "MODE";

    let result = "{";
    result += printObjectProperties(val, config, indentation, depth, refs, printer);
    result += "}";

    return result;
  },
});

describe("pack-directory", () => {
  it("resolves tarball metadata objects on success", async () => {
    jest.spyOn(fs, "move");

    const cwd = await initFixture("lerna-bootstrap");
    const conf = npmConf({ prefix: cwd }).snapshot;
    const pkgs = await getPackages(cwd);

    // choose first and last package since the middle two are repetitive
    const [head, tail] = await Promise.all([pkgs.shift(), pkgs.pop()].map(pkg => packDirectory(pkg, conf)));

    // the generated tarball is _not_ moved into the package directory
    expect(fs.move).not.toHaveBeenCalled();

    const INTEGRITY_PATTERN = /sha512-[\S]{88}/;
    const SHASUM_PATTERN = /[0-9a-f]{40}/;

    expect(head).toMatchInlineSnapshot(`
Object {
  "bundled": Array [],
  "entryCount": 3,
  "filename": "integration-package-1-1.0.0.tgz",
  "files": Array [
    {
      "mode": "MODE",
      "path": "package.json",
      "size": 269,
    },
    {
      "mode": "MODE",
      "path": "build.js",
      "size": 329,
    },
    {
      "mode": "MODE",
      "path": "index.src.js",
      "size": 141,
    },
  ],
  "id": "@integration/package-1@1.0.0",
  "integrity": "INTEGRITY",
  "name": "@integration/package-1",
  "shasum": "SHASUM",
  "size": 539,
  "tarFilePath": "__TAR_DIR__/integration-package-1-1.0.0.tgz",
  "unpackedSize": 739,
  "version": "1.0.0",
}
`);
    // integrity is an instance of Integrity
    // https://github.com/zkat/ssri/blob/a4337cd672f341deee2b52699b6720d82e4d0ddf/index.js#L83
    expect(head.integrity.toString()).toMatch(INTEGRITY_PATTERN);
    expect(head.shasum).toMatch(SHASUM_PATTERN);

    expect(tail).toMatchInlineSnapshot(`
Object {
  "bundled": Array [],
  "entryCount": 1,
  "filename": "package-4-1.0.0.tgz",
  "files": Array [
    {
      "mode": "MODE",
      "path": "package.json",
      "size": 224,
    },
  ],
  "id": "package-4@1.0.0",
  "integrity": "INTEGRITY",
  "name": "package-4",
  "shasum": "SHASUM",
  "size": 230,
  "tarFilePath": "__TAR_DIR__/package-4-1.0.0.tgz",
  "unpackedSize": 224,
  "version": "1.0.0",
}
`);
    expect(tail.integrity.toString()).toMatch(INTEGRITY_PATTERN);
    expect(tail.shasum).toMatch(SHASUM_PATTERN);
  });
});
