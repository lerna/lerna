"use strict";

jest.mock("@lerna/bootstrap");

const fs = require("fs-extra");
const path = require("path");

// mocked or stubbed modules
const bootstrap = require("@lerna/bootstrap");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const pkgMatchers = require("@lerna-test/pkg-matchers");

// file under test
const lernaAdd = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
expect.extend(pkgMatchers);

const readPkg = (testDir, pkg) => fs.readJSON(path.join(testDir, pkg, "package.json"));

describe("AddCommand", () => {
  // we already have enough tests of BootstrapCommand
  bootstrap.mockResolvedValue();

  it("should throw without packages", async () => {
    expect.assertions(1);

    const testDir = await initFixture("basic");

    try {
      await lernaAdd(testDir)();
    } catch (err) {
      expect(err.message).toMatch(/^Not enough non-option arguments/);
    }
  });

  it("should throw for locally unsatisfiable version ranges", async () => {
    expect.assertions(1);

    const testDir = await initFixture("basic");

    try {
      await lernaAdd(testDir)("@test/package-1@2");
    } catch (err) {
      expect(err.message).toMatch(/Requested range not satisfiable:/);
    }
  });

  it("should reference remote dependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("tiny-tarball");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("tiny-tarball");
    expect(await readPkg(testDir, "packages/package-2")).toDependOn("tiny-tarball");
    expect(await readPkg(testDir, "packages/package-3")).toDependOn("tiny-tarball");
    expect(await readPkg(testDir, "packages/package-4")).toDependOn("tiny-tarball");
  });

  it("should reference local dependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).toDependOn("@test/package-1");
  });

  it("should reference current caret range if unspecified", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");
    await lernaAdd(testDir)("@test/package-2");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("@test/package-2", "^2.0.0");
    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1", "^1.0.0");
  });

  it("should reference specfied range", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1@~1");

    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1", "~1");
  });

  it("should add target package to devDependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "--dev");

    expect(await readPkg(testDir, "packages/package-2")).toDevDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).toDevDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).toDevDependOn("@test/package-1");
  });

  it("should add target package to devDependencies with alias", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("-D", "@test/package-1");

    expect(await readPkg(testDir, "packages/package-2")).toDevDependOn("@test/package-1");
  });

  it("should not reference packages to themeselves", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(await readPkg(testDir, "packages/package-1")).not.toDependOn("@test/package-1");
  });

  it("filters targets by optional directory globs", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "packages/package-2");

    expect(await readPkg(testDir, "packages/package-2")).toDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-3")).not.toDevDependOn("@test/package-1");
    expect(await readPkg(testDir, "packages/package-4")).not.toDevDependOn("@test/package-1");
  });

  it("should retain existing dependencies", async () => {
    const testDir = await initFixture("existing");

    await lernaAdd(testDir)("@test/package-2");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("pify");
  });

  it("should retain existing devDependencies", async () => {
    const testDir = await initFixture("existing");

    await lernaAdd(testDir)("@test/package-1", "--dev");

    expect(await readPkg(testDir, "packages/package-2")).toDevDependOn("file-url");
  });

  it("supports tag specifiers", async () => {
    const testDir = await initFixture("basic");

    // npm dist-tags for outdated versions _should_ stay stable
    await lernaAdd(testDir)("npm@next-3");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("npm", "^3.10.10");
  });

  it("supports version specifiers (exact)", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("tiny-tarball@1.0.0");

    expect(await readPkg(testDir, "packages/package-1")).toDependOn("tiny-tarball", "1.0.0");
  });

  it("should bootstrap changed packages", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(bootstrap).lastCalledWith(
      expect.objectContaining({
        scope: ["@test/package-2", "package-3", "package-4"],
      })
    );
  });

  it("should only bootstrap scoped packages", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "--scope", "@test/package-2", "--scope", "package-3");

    expect(bootstrap).lastCalledWith(
      expect.objectContaining({
        scope: ["@test/package-2", "package-3"],
      })
    );
  });

  it("should not bootstrap ignored packages", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "--ignore", "@test/package-2");

    expect(bootstrap).lastCalledWith(
      expect.objectContaining({
        scope: ["package-3", "package-4"],
      })
    );
  });

  it("should not bootstrap unchanged packages", async () => {
    const testDir = await initFixture("unchanged");

    await lernaAdd(testDir)("@test/package-1");

    expect(bootstrap).not.toHaveBeenCalled();
  });
});
