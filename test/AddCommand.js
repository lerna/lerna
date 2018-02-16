"use strict";

const fs = require("fs-extra");
const path = require("path");

// mocked or stubbed modules
const BootstrapCommand = require("../src/commands/BootstrapCommand");

// helpers
const initFixture = require("./helpers/initFixture");
const pkgMatchers = require("./helpers/pkgMatchers");

// file under test
const lernaAdd = require("./helpers/command-runner")(require("../src/commands/AddCommand"));

jest.mock("../src/commands/BootstrapCommand");

expect.extend(pkgMatchers);

const readPkg = (testDir, pkg) => fs.readJSON(path.join(testDir, pkg, "package.json"));

describe("AddCommand", () => {
  // we already have enough tests of BootstrapCommand
  BootstrapCommand.handler.mockResolvedValue();

  it("should throw without packages", async () => {
    expect.assertions(1);

    const testDir = await initFixture("AddCommand/basic");

    try {
      await lernaAdd(testDir)();
    } catch (err) {
      expect(err.message).toMatch(/^Missing list of packages/);
    }
  });

  it("should throw for locally unsatisfiable version ranges", async () => {
    expect.assertions(1);

    const testDir = await initFixture("AddCommand/basic");

    try {
      await lernaAdd(testDir)("@test/package-1@2");
    } catch (err) {
      expect(err.message).toMatch(/Requested range not satisfiable:/);
    }
  });

  it("should reference remote dependencies", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("lerna");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("lerna");
    expect(await readPkg(testDir, "packages/package-2")).toDependOn("lerna");
    expect(await readPkg(testDir, "packages/package-3")).toDependOn("lerna");
    expect(await readPkg(testDir, "packages/package-4")).toDependOn("lerna");
  });

  it("should reference local dependencies", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).toDependOn("@test/package-1");
  });

  it("should reference to multiple dependencies", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1", "@test/package-2");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("@test/package-2");
    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).toDependOn("@test/package-2");
    expect(await readPkg(testDir, "packages/package-4")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).toDependOn("@test/package-2");
  });

  it("should reference current caret range if unspecified", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1", "@test/package-2");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("@test/package-2", "^2.0.0");
    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1", "^1.0.0");
  });

  it("should reference specfied range", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1@~1");

    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1", "~1");
  });

  it("should reference to devDepdendencies", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1", "--dev");

    expect(await readPkg(testDir, "packages/package-2")).toDevDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).toDevDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).toDevDependOn("@test/package-1");
  });

  it("should not reference packages to themeselves", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(await readPkg(testDir, "packages/package-1")).not.toDependOn("@test/package-1");
  });

  it("should respect scopes", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1", "--scope=@test/package-2");

    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).not.toDevDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).not.toDevDependOn("@test/package-1");
  });

  it("should retain existing dependencies", async () => {
    const testDir = await initFixture("AddCommand/existing");

    await lernaAdd(testDir)("@test/package-2");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("pify");
  });

  it("should retain existing devDependencies", async () => {
    const testDir = await initFixture("AddCommand/existing");

    await lernaAdd(testDir)("@test/package-1", "--dev");

    expect(await readPkg(testDir, "packages/package-2")).toDevDependOn("file-url");
  });

  it("should bootstrap changed packages", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(BootstrapCommand.handler).lastCalledWith(
      expect.objectContaining({
        scope: ["@test/package-2", "package-3", "package-4"],
      })
    );
  });

  it("should only bootstrap scoped packages", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1", "--scope", "@test/package-2", "--scope", "package-3");

    expect(BootstrapCommand.handler).lastCalledWith(
      expect.objectContaining({
        scope: ["@test/package-2", "package-3"],
      })
    );
  });

  it("should not bootstrap ignored packages", async () => {
    const testDir = await initFixture("AddCommand/basic");

    await lernaAdd(testDir)("@test/package-1", "--ignore", "@test/package-2");

    expect(BootstrapCommand.handler).lastCalledWith(
      expect.objectContaining({
        scope: ["package-3", "package-4"],
      })
    );
  });

  it("should not bootstrap unchanged packages", async () => {
    const testDir = await initFixture("AddCommand/unchanged");

    await lernaAdd(testDir)("@test/package-1");

    expect(BootstrapCommand.handler).not.toHaveBeenCalled();
  });

  it("bootstraps mixed local and external dependencies", async () => {
    const testDir = await initFixture("AddCommand/existing");

    await lernaAdd(testDir)("@test/package-2", "pify");

    const pkg1 = await readPkg(testDir, "packages/package-1");
    const pkg2 = await readPkg(testDir, "packages/package-2");
    const pkg3 = await readPkg(testDir, "packages/package-3");

    expect(pkg1).toDependOn("pify", "^3.0.0"); // overwrites ^2.0.0
    expect(pkg1).toDependOn("@test/package-2");

    expect(pkg2).toDependOn("pify", "^3.0.0");

    expect(pkg3).toDependOn("pify", "^3.0.0");
    expect(pkg3).toDependOn("@test/package-2"); // existing, but should stay

    expect(BootstrapCommand.handler).lastCalledWith(
      expect.objectContaining({
        scope: ["@test/package-1", "@test/package-2", "@test/package-3"],
      })
    );
  });
});
