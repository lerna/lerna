"use strict";

const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const tempy = require("tempy");

const Project = require("@lerna/project");
const loggingOutput = require("@lerna-test/logging-output");
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
  function populateFixture(directoryPath) {
    fs.writeJsonSync(path.join(directoryPath, "lerna.json"), {
      version: "independent",
      packages: ["pkgs/*"],
    });
    fs.writeJsonSync(path.join(directoryPath, "package.json"), {
      name: "listable-format-test",
    });
    const packagesPath = path.join(directoryPath, "pkgs");
    fs.mkdirpSync(path.join(packagesPath, "pkg-1"));
    fs.writeJsonSync(path.join(packagesPath, "pkg-1/package.json"), {
      name: "pkg-1",
      version: "1.0.0",
      dependencies: { "pkg-2": "file:../pkg-2" },
    });
    fs.mkdirpSync(path.join(packagesPath, "pkg-2"));
    fs.writeJsonSync(path.join(packagesPath, "pkg-2/package.json"), {
      name: "pkg-2",
      // version: "2.0.0",
      devDependencies: { "pkg-3": "file:../pkg-3" },
    });
    fs.mkdirpSync(path.join(packagesPath, "pkg-3"));
    fs.writeJsonSync(path.join(packagesPath, "pkg-3/package.json"), {
      name: "pkg-3",
      version: "3.0.0",
      dependencies: { "pkg-2": "file:../pkg-2" },
      private: true,
    });
  }

  beforeAll(async () => {
    const cwd = tempy.directory();
    populateFixture(cwd);
    process.chdir(cwd);

    packages = await Project.getPackages(cwd);
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

    test("NDJSON output", () => {
      const { text } = formatWithOptions({ ndjson: true, all: true });

      expect(text).toMatchInlineSnapshot(`
{"name":"pkg-1","version":"1.0.0","private":false,"location":"__TEST_ROOTDIR__/pkgs/pkg-1"}
{"name":"pkg-2","private":false,"location":"__TEST_ROOTDIR__/pkgs/pkg-2"}
{"name":"pkg-3","version":"3.0.0","private":true,"location":"__TEST_ROOTDIR__/pkgs/pkg-3"}
`);
    });

    test("graph output", () => {
      const { text } = formatWithOptions({ graph: true });

      expect(text).toMatchInlineSnapshot(`
        {
          "pkg-1": [
            "pkg-2"
          ],
          "pkg-2": []
        }
      `);
    });

    test("all graph output", () => {
      const { text } = formatWithOptions({ graph: true, all: true });

      expect(text).toMatchInlineSnapshot(`
        {
          "pkg-1": [
            "pkg-2"
          ],
          "pkg-2": [
            "pkg-3"
          ],
          "pkg-3": [
            "pkg-2"
          ]
        }
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

  describe("toposort", () => {
    test("output", () => {
      const { text } = formatWithOptions({ toposort: true });

      expect(text).toMatchInlineSnapshot(`
pkg-2
pkg-1
`);
    });

    test("cycles", () => {
      const { text } = formatWithOptions({ toposort: true, all: true });

      expect(loggingOutput("warn")).toContainEqual(expect.stringContaining("pkg-2 -> pkg-3 -> pkg-2"));
      expect(text).toMatchInlineSnapshot(`
pkg-2
pkg-3 (PRIVATE)
pkg-1
`);
    });
  });
});
