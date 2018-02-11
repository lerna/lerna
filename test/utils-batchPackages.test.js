"use strict";

const log = require("npmlog");
const Repository = require("../src/Repository");
const collectPackages = require("../src/utils/collectPackages");

// helpers
const initFixture = require("./helpers/initFixture");

// file under test
const batchPackages = require("../src/utils/batchPackages");

// silence logs
log.level = "silent";

describe("batchPackages", () => {
  it("should batch roots, then internal/leaf nodes, then cycles", async () => {
    let logMessage = null;
    log.once("log.warn", e => {
      logMessage = e.message;
    });

    const cwd = await initFixture("PackageUtilities/toposort");
    const packages = collectPackages(new Repository(cwd));
    const batchedPackages = batchPackages(packages);

    expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
    expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");
    expect(logMessage).toMatch("package-cycle-2 -> package-cycle-1 -> package-cycle-2");
    expect(logMessage).toMatch(
      "package-cycle-extraneous -> package-cycle-1 -> package-cycle-2 -> package-cycle-1"
    );

    expect(batchedPackages.map(batch => batch.map(pkg => pkg.name))).toEqual([
      ["package-dag-1", "package-standalone"],
      ["package-dag-2a", "package-dag-2b"],
      ["package-dag-3"],
      ["package-cycle-1"],
      ["package-cycle-2", "package-cycle-extraneous"],
    ]);
  });

  it("should throw an error if a cycle is detected and reject-cycles is truthy", async () => {
    const cwd = await initFixture("PackageUtilities/toposort");
    const packages = collectPackages(new Repository(cwd));

    expect(() => {
      batchPackages(packages, {
        rejectCycles: true,
      });
    }).toThrowError("Dependency cycles detected, you should fix these!");
  });

  it("should not warn about cycles if one is not detected", async () => {
    let warnedCycle = false;
    log.once("log.warn", () => {
      warnedCycle = true;
    });

    const cwd = await initFixture("PackageUtilities/basic");
    const packages = collectPackages(new Repository(cwd));
    const batchedPackages = batchPackages(packages);

    expect(warnedCycle).toBeFalsy();
    expect(batchedPackages.map(b => b.map(p => p.name))).toEqual([
      ["package-1", "package-4"],
      ["package-2"],
      ["package-3"],
    ]);
  });
});
