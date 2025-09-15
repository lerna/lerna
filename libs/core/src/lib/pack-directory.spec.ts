/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory } from "@lerna/test-helpers";
import normalizePath from "normalize-path";
import path from "path";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { printObjectProperties } from "pretty-format/build/collections";
import { packDirectory } from "./pack-directory";
import { getPackages } from "./project";

require("@lerna/test-helpers/src/lib/silence-logging");

// actually _run_ the lifecycles, gorrammit
jest.unmock("./run-lifecycle");

const npmConf = require("./npm-conf");

const initFixture = initFixtureFactory(__dirname);

// temp-write creates temp directories that are 36 characters long (uuid.v4())
const TAR_DIR_REGEXP = /([^\s"]*[\\/][-0-9a-f]{36})([^\s"]*)/g;
const hasOwn = Object.prototype.hasOwnProperty;

function isObject(val: any) {
  return val && typeof val === "object" && Array.isArray(val) === false;
}

function isString(val: any) {
  return val && typeof val === "string";
}

function serializeTempDir(match: any, cwd: any, subPath: string) {
  return normalizePath(path.join("__TMP_DIR__", subPath));
}

/**
 * Extraced from pretty-format codebase as no longer exported in v30
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const getKeysOfEnumerableProperties = (object: any, compareKeys: any) => {
  const rawKeys = Object.keys(object);
  const keys = compareKeys === null ? rawKeys : rawKeys.sort(compareKeys);
  if (Object.getOwnPropertySymbols) {
    for (const symbol of Object.getOwnPropertySymbols(object)) {
      if (Object.getOwnPropertyDescriptor(object, symbol)?.enumerable) {
        keys.push(symbol.toString());
      }
    }
  }
  return keys;
};

/**
 * Extraced from pretty-format codebase as no longer exported in v30
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
function printObjectProperties(val: any, config: any, indentation: any, depth: any, refs: any, printer: any) {
  let result = "";
  const keys = getKeysOfEnumerableProperties(val, config.compareKeys);
  if (keys.length > 0) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const name = printer(key, config, indentationNext, depth, refs);
      const value = printer(val[key], config, indentationNext, depth, refs);
      result += `${indentationNext + name}: ${value}`;
      if (i < keys.length - 1) {
        result += `,${config.spacingInner}`;
      } else if (!config.min) {
        result += ",";
      }
    }
    result += config.spacingOuter + indentation;
  }
  return result;
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

    return false;
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

    if (depth) {
      // nested file objects
      val.mode = "MODE";
    } else {
      // bloody tar algorithms
      val.size = "TAR_SIZE";
    }

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
      [pkgs.shift()!, pkgs.pop()!].map((pkg) => packDirectory(pkg, pkg.location, conf))
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

    const next = pkgs.pop()!;
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
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
