"use strict";

// actually _run_ the lifecycles, gorrammit
jest.unmock("@lerna/run-lifecycle");

const path = require("path");
const normalizePath = require("normalize-path");
const { printObjectProperties } = require("pretty-format/build/collections");
const npmConf = require("@lerna/npm-conf");
const { getPackages } = require("@lerna/project");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

const { packDirectory } = require("..");

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
  return normalizePath(path.join("__TMP_DIR__", subPath));
}

// process.umask() differs between macOS and Ubuntu,
// so we need to overwrite derived hashes for consistency
expect.addSnapshotSerializer({
  test(val) {
    if (isObject(val)) {
      // 420 in macOS, 436 in Ubuntu
      return hasOwn.call(val, "mode") || hasOwn.call(val, "size");
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
        // ...and this is always an object property
        return `"${str}"`;
      }

      if (val.indexOf("sha512") > -1) {
        return '"INTEGRITY"';
      }

      return '"SHASUM"';
    }

    /* eslint-disable no-param-reassign */
    if (depth) {
      // nested file objects
      val.mode = "MODE";
    } else {
      // bloody tar algorithms
      val.size = "TAR_SIZE";
    }
    /* eslint-enable no-param-reassign */

    let result = "Object {";
    result += printObjectProperties(val, config, indentation, depth, refs, printer);
    result += "}";

    return result;
  },
});

describe("pack-directory", () => {
  it("resolves tarball metadata objects on success", async () => {
    const cwd = await initFixture("pack-directory");
    const conf = npmConf({ prefix: cwd }).snapshot;
    const pkgs = await getPackages(cwd);

    // choose first and last package since the middle two are repetitive
    const [head, tail] = await Promise.all(
      [pkgs.shift(), pkgs.pop()].map((pkg) => packDirectory(pkg, pkg.location, conf))
    );

    const INTEGRITY_PATTERN = /sha512-[\S]{88}/;
    const SHASUM_PATTERN = /[0-9a-f]{40}/;

    expect(head).toMatchInlineSnapshot(`
      Object {
        "bundled": Array [],
        "entryCount": 2,
        "filename": "scope-head-1.0.0.tgz",
        "files": Array [
          Object {
            "mode": "MODE",
            "path": "dist/index.js",
            "size": 37,
          },
          Object {
            "mode": "MODE",
            "path": "package.json",
            "size": 159,
          },
        ],
        "id": "@scope/head@1.0.0",
        "integrity": "INTEGRITY",
        "name": "@scope/head",
        "shasum": "SHASUM",
        "size": "TAR_SIZE",
        "tarFilePath": "__TMP_DIR__/scope-head-1.0.0.tgz",
        "unpackedSize": 196,
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
        "entryCount": 2,
        "filename": "tail-4.0.0.tgz",
        "files": Array [
          Object {
            "mode": "MODE",
            "path": "index.js",
            "size": 37,
          },
          Object {
            "mode": "MODE",
            "path": "package.json",
            "size": 131,
          },
        ],
        "id": "tail@4.0.0",
        "integrity": "INTEGRITY",
        "name": "tail",
        "shasum": "SHASUM",
        "size": "TAR_SIZE",
        "tarFilePath": "__TMP_DIR__/tail-4.0.0.tgz",
        "unpackedSize": 168,
        "version": "4.0.0",
      }
    `);
    expect(tail.integrity.toString()).toMatch(INTEGRITY_PATTERN);
    expect(tail.shasum).toMatch(SHASUM_PATTERN);

    const next = pkgs.pop();
    const pubs = await packDirectory(
      next,
      next.location,
      Object.assign({}, conf, {
        ignorePrepublish: true,
        lernaCommand: "publish",
      })
    );

    expect(pubs).toMatchInlineSnapshot(`
      Object {
        "bundled": Array [],
        "entryCount": 2,
        "filename": "pubs-3.0.0.tgz",
        "files": Array [
          Object {
            "mode": "MODE",
            "path": "index.js",
            "size": 21,
          },
          Object {
            "mode": "MODE",
            "path": "package.json",
            "size": 171,
          },
        ],
        "id": "pubs@3.0.0",
        "integrity": "INTEGRITY",
        "name": "pubs",
        "shasum": "SHASUM",
        "size": "TAR_SIZE",
        "tarFilePath": "__TMP_DIR__/pubs-3.0.0.tgz",
        "unpackedSize": 192,
        "version": "3.0.0",
      }
    `);

    const last = pkgs.pop();
    const subs = await packDirectory(
      last,
      // a real package doesn't _actually_ need this argument
      undefined,
      conf
    );

    expect(subs).toMatchInlineSnapshot(`
      Object {
        "bundled": Array [],
        "entryCount": 2,
        "filename": "subs-2.0.0.tgz",
        "files": Array [
          Object {
            "mode": "MODE",
            "path": "prepacked.js",
            "size": 21,
          },
          Object {
            "mode": "MODE",
            "path": "package.json",
            "size": 115,
          },
        ],
        "id": "subs@2.0.0",
        "integrity": "INTEGRITY",
        "name": "subs",
        "shasum": "SHASUM",
        "size": "TAR_SIZE",
        "tarFilePath": "__TMP_DIR__/subs-2.0.0.tgz",
        "unpackedSize": 136,
        "version": "2.0.0",
      }
    `);
  });
});
