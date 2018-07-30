"use strict";

const path = require("path");
const tempy = require("tempy");
const Package = require("@lerna/package");
const listable = require("..");

// normalize temp directory paths in snapshots
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
"pkg-1
pkg-2
pkg-3 ([31mPRIVATE[39m)"
`);
    });

    test("long output", () => {
      const { count, text } = formatWithOptions({ long: true });

      expect(count).toBe(2);
      expect(text).toMatchInlineSnapshot(`
"pkg-1  [32mv1.0.0[39m [90mpkgs/pkg-1[39m
pkg-2 [33mMISSING[39m [90mpkgs/pkg-2[39m"
`);
    });

    test("all long output", () => {
      const { text } = formatWithOptions({ long: true, all: true });

      expect(text).toMatchInlineSnapshot(`
"pkg-1  [32mv1.0.0[39m [90mpkgs/pkg-1[39m
pkg-2 [33mMISSING[39m [90mpkgs/pkg-2[39m
pkg-3  [32mv3.0.0[39m [90mpkgs/pkg-3[39m ([31mPRIVATE[39m)"
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
    "location": "<PROJECT_ROOT>/pkgs/pkg-1"
  },
  {
    "name": "pkg-2",
    "private": false,
    "location": "<PROJECT_ROOT>/pkgs/pkg-2"
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
    "location": "<PROJECT_ROOT>/pkgs/pkg-1"
  },
  {
    "name": "pkg-2",
    "private": false,
    "location": "<PROJECT_ROOT>/pkgs/pkg-2"
  },
  {
    "name": "pkg-3",
    "version": "3.0.0",
    "private": true,
    "location": "<PROJECT_ROOT>/pkgs/pkg-3"
  }
]
`);
    });

    test("parseable output", () => {
      const { text } = formatWithOptions({ parseable: true });

      expect(text).toMatchInlineSnapshot(`
<PROJECT_ROOT>/pkgs/pkg-1
<PROJECT_ROOT>/pkgs/pkg-2
`);
    });

    test("all parseable output", () => {
      const { text } = formatWithOptions({ parseable: true, all: true });

      expect(text).toMatchInlineSnapshot(`
<PROJECT_ROOT>/pkgs/pkg-1
<PROJECT_ROOT>/pkgs/pkg-2
<PROJECT_ROOT>/pkgs/pkg-3
`);
    });

    test("long parseable output", () => {
      const { text } = formatWithOptions({ parseable: true, long: true });

      expect(text).toMatchInlineSnapshot(`
<PROJECT_ROOT>/pkgs/pkg-1:pkg-1:1.0.0
<PROJECT_ROOT>/pkgs/pkg-2:pkg-2:MISSING
`);
    });

    test("all long parseable output", () => {
      const { text } = formatWithOptions({ parseable: true, all: true, long: true });

      expect(text).toMatchInlineSnapshot(`
<PROJECT_ROOT>/pkgs/pkg-1:pkg-1:1.0.0
<PROJECT_ROOT>/pkgs/pkg-2:pkg-2:MISSING
<PROJECT_ROOT>/pkgs/pkg-3:pkg-3:3.0.0:PRIVATE
`);
    });
  });

  describe("aliases", () => {
    test("la => ls -la", () => {
      const { text } = formatWithOptions({ _: ["la"] });

      expect(text).toMatchInlineSnapshot(`
"pkg-1  [32mv1.0.0[39m [90mpkgs/pkg-1[39m
pkg-2 [33mMISSING[39m [90mpkgs/pkg-2[39m
pkg-3  [32mv3.0.0[39m [90mpkgs/pkg-3[39m ([31mPRIVATE[39m)"
`);
    });

    test("ll => ls -l", () => {
      const { text } = formatWithOptions({ _: ["ll"] });

      expect(text).toMatchInlineSnapshot(`
"pkg-1  [32mv1.0.0[39m [90mpkgs/pkg-1[39m
pkg-2 [33mMISSING[39m [90mpkgs/pkg-2[39m"
`);
    });
  });
});
