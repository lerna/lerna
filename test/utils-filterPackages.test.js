"use strict";

const log = require("npmlog");
const collectPackages = require("../src/utils/collect-packages");

// helpers
const initFixture = require("./helpers/initFixture");

// file under test
const filterPackages = require("../src/utils/filterPackages");

// silence logs
log.level = "silent";

describe("filterPackages", () => {
  let packages;

  beforeAll(async () => {
    const cwd = await initFixture("PackageUtilities/filtering");
    packages = collectPackages({ packageConfigs: ["packages/*"], rootPath: cwd });
  });

  it("includes all packages when --scope is omitted", () => {
    const flags = {
      // scope: undefined
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-3", "package-4", "package-a-1", "package-a-2"]);
  });

  it("includes all packages when --scope is boolean", () => {
    const flags = {
      scope: true, // --scope
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-3", "package-4", "package-a-1", "package-a-2"]);
  });

  it("includes packages when --scope is a package name", () => {
    const flags = {
      scope: "package-3",
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-3"]);
  });

  it("excludes packages when --ignore is a package name", () => {
    const flags = {
      ignore: "package-3",
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-4", "package-a-1", "package-a-2"]);
  });

  it("includes packages when --scope is a glob", () => {
    const flags = {
      scope: "package-a-*",
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-a-1", "package-a-2"]);
  });

  it("excludes packages when --ignore is a glob", () => {
    const flags = {
      ignore: "package-@(2|3|4)",
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-a-1", "package-a-2"]);
  });

  it("excludes packages when --ignore is a brace-expanded list", () => {
    /* NOTE: ignore value is array at this point if option is "package-{3,4}" */
    const flags = {
      ignore: ["package-3", "package-4"],
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-a-1", "package-a-2"]);
  });

  it("filters packages when both --scope and --ignore are passed", () => {
    const flags = {
      scope: "package-a-*",
      ignore: "package-a-2",
    };
    const result = filterPackages(packages, flags);
    expect(result.map(pkg => pkg.name)).toEqual(["package-a-1"]);
  });

  it("should throw when --scope glob excludes all packages", () => {
    const flags = {
      scope: "no-package-*",
    };
    expect(() => {
      filterPackages(packages, flags);
    }).toThrow();
  });

  it("should throw when --ignore glob excludes all packages", () => {
    const flags = {
      ignore: "package-*",
    };
    expect(() => {
      filterPackages(packages, flags);
    }).toThrow();
  });

  it("should throw when --scope and --ignore globs exclude all packages", () => {
    const flags = {
      scope: "package-a-*",
      ignore: "package-a-@(1|2)",
    };
    expect(() => {
      filterPackages(packages, flags);
    }).toThrow();
  });
});
