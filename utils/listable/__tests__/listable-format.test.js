"use strict";

const chalk = require("chalk");
const path = require("path");
const tempy = require("tempy");
const Package = require("@lerna/package");
const listable = require("..");

// keep snapshots stable cross-platform
chalk.enabled = false;

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// normalize temp directory paths in snapshots
expect.addSnapshotSerializer(require("@lerna-test/serialize-windows-paths"));
expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));

describe("listable.format()", () => {
  let packages;

  const formatWithOptions = opts => listable.format(packages, Object.assign({ _: ["ls"] }, opts));

  beforeAll(() => {
    const cwd = tempy.directory();
    process.chdir(cwd);

    packages = [
      new Package({ name: "pkg-1", version: "1.0.0" }, path.join(cwd, "/pkgs/pkg-1")),
      new Package({ name: "pkg-2" }, path.join(cwd, "/pkgs/pkg-2")),
      new Package({ name: "pkg-3", version: "3.0.0", private: true }, path.join(cwd, "/pkgs/pkg-3")),
    ];
  });

  describe("renders", () => {
    test("all output", () => {
      const { count, text } = formatWithOptions({ all: true });

      expect(count).toBe(3);
      expect(text).toMatchInlineSnapshot(`
pkg-1
pkg-2
pkg-3 (PRIVATE)
`);
    });

    test("long output", () => {
      const { count, text } = formatWithOptions({ long: true });

      expect(count).toBe(2);
      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
`);
    });

    test("all long output", () => {
      const { text } = formatWithOptions({ long: true, all: true });

      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
pkg-3  v3.0.0 pkgs/pkg-3 (PRIVATE)
`);
    });

    test("JSON output", () => {
      const { text } = formatWithOptions({ json: true });

      expect(text).toMatchInlineSnapshot(`
[
  {
    "name": "pkg-1",
    "version": "1.0.0",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-1"
  },
  {
    "name": "pkg-2",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-2"
  }
]
`);
    });

    test("all JSON output", () => {
      const { text } = formatWithOptions({ json: true, all: true });

      expect(text).toMatchInlineSnapshot(`
[
  {
    "name": "pkg-1",
    "version": "1.0.0",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-1"
  },
  {
    "name": "pkg-2",
    "private": false,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-2"
  },
  {
    "name": "pkg-3",
    "version": "3.0.0",
    "private": true,
    "location": "__TEST_ROOTDIR__/pkgs/pkg-3"
  }
]
`);
    });

    test("parseable output", () => {
      const { text } = formatWithOptions({ parseable: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1
__TEST_ROOTDIR__/pkgs/pkg-2
`);
    });

    test("all parseable output", () => {
      const { text } = formatWithOptions({ parseable: true, all: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1
__TEST_ROOTDIR__/pkgs/pkg-2
__TEST_ROOTDIR__/pkgs/pkg-3
`);
    });

    test("long parseable output", () => {
      const { text } = formatWithOptions({ parseable: true, long: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1:pkg-1:1.0.0
__TEST_ROOTDIR__/pkgs/pkg-2:pkg-2:MISSING
`);
    });

    test("all long parseable output", () => {
      const { text } = formatWithOptions({ parseable: true, all: true, long: true });

      expect(text).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/pkgs/pkg-1:pkg-1:1.0.0
__TEST_ROOTDIR__/pkgs/pkg-2:pkg-2:MISSING
__TEST_ROOTDIR__/pkgs/pkg-3:pkg-3:3.0.0:PRIVATE
`);
    });
  });

  describe("aliases", () => {
    test("la => ls -la", () => {
      const { text } = formatWithOptions({ _: ["la"] });

      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
pkg-3  v3.0.0 pkgs/pkg-3 (PRIVATE)
`);
    });

    test("ll => ls -l", () => {
      const { text } = formatWithOptions({ _: ["ll"] });

      expect(text).toMatchInlineSnapshot(`
pkg-1  v1.0.0 pkgs/pkg-1
pkg-2 MISSING pkgs/pkg-2
`);
    });
  });
});
