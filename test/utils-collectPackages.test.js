"use strict";

const log = require("npmlog");
const path = require("path");
const Repository = require("../src/Repository");

// helpers
const initFixture = require("./helpers/initFixture");

// file under test
const collectPackages = require("../src/utils/collectPackages");

// silence logs
log.level = "silent";

describe("collectPackages", () => {
  it("should collect all the packages from the given packages directory", async () => {
    const cwd = await initFixture("PackageUtilities/basic");
    const result = collectPackages(new Repository(cwd));
    expect(result).toHaveLength(4);

    const pkgOne = result[0];
    expect(pkgOne.constructor.name).toBe("Package");
    expect(pkgOne.name).toBe("package-1");
    expect(pkgOne.version).toBe("1.0.0");
    expect(pkgOne.location).toBe(path.join(cwd, "packages", "package-1"));
  });

  it("finds nested packages with globstar", async () => {
    const cwd = await initFixture("PackageUtilities/globstar");
    const result = collectPackages(new Repository(cwd));

    expect(result.map(pkg => pkg.name)).toEqual([
      "globstar-monorepo",
      "package-2",
      "package-4",
      "package-1",
      "package-3",
      "package-5",
    ]);
  });

  it("does not ignore explicit node_modules in packages config", async () => {
    const cwd = await initFixture("PackageUtilities/explicit-node-modules");
    const result = collectPackages(new Repository(cwd));

    expect(result.map(pkg => pkg.name)).toEqual([
      "alle-pattern-monorepo",
      "package-1",
      "package-2",
      "package-3",
      "package-4",
      "@scoped/package-5",
    ]);
  });

  it("throws an error when globstars and explicit node_modules configs are mixed", async () => {
    const cwd = await initFixture("PackageUtilities/mixed-globstar");

    try {
      collectPackages(new Repository(cwd));
    } catch (err) {
      expect(err.message).toMatch("An explicit node_modules package path does not allow globstars");
    }
  });
});
