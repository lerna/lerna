"use strict";

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { getPackages } = require("@lerna/project");
const commandRunner = require("@lerna-test/command-runner");

const lernaBootstrap = commandRunner(require("@lerna/bootstrap/command"));

// file under test
const lernaRemove = commandRunner(require("../command"));

// assertion helpers
expect.extend(require("@lerna-test/pkg-matchers"));

// setting up
async function bootstrapFixture(fixture) {
  const testDir = await initFixture(fixture);
  await lernaBootstrap(testDir)();
}

describe("RmoveCommand", () => {
  it("should remove external", async () => {
    const testDir = await bootstrapFixture("basic");
    const [pkg1, pkg2, pkg3, pkg4] = await getPackages(testDir);
    expect(pkg1).toHaveInNodeModules("pify", "tiny-tarball");
    expect(pkg2).toHaveInNodeModules("@test/package-1", "pify", "tiny-tarball");
    expect(pkg3).toHaveInNodeModules("@test/package-1", "pify", "tiny-tarball");
    expect(pkg4).toHaveInNodeModules("@test/package-1");

    await lernaRemove(testDir)("pify");
    const [updatedPkg1, updatedPkg2, updatedPkg3] = await getPackages(testDir);

    expect(updatedPkg1).not.toHaveInNodeModules("pify");
    expect(updatedPkg1).not.toDependOn("pify");

    expect(updatedPkg2).not.toDependOn("pify");
    expect(updatedPkg2).not.toHaveInNodeModules("pify");

    expect(updatedPkg3).not.toDevDependOn("pify");
    expect(updatedPkg3).not.toHaveInNodeModules("pify");
  });

  it("should remove with scope", async () => {
    const testDir = await bootstrapFixture("basic");

    await lernaRemove(testDir)("pify", "--scope=@test/package-1");
    const [pkg1, pkg2, pkg3] = await getPackages(testDir);

    expect(pkg1).not.toHaveInNodeModules("pify");
    expect(pkg1).not.toDependOn("pify");

    expect(pkg2).toDependOn("pify");
    expect(pkg2).toHaveInNodeModules("pify");

    expect(pkg3).toDevDependOn("pify");
    expect(pkg3).toHaveInNodeModules("pify");
  });

  it("should remove symlink", async () => {
    const testDir = await bootstrapFixture("basic");
    const [, , pkg3] = await getPackages(testDir);
    expect(pkg3).toHaveInNodeModules("@test/package-1");

    await lernaRemove(testDir)("@test/package-1");
    const [, , updatedPkg3] = await getPackages(testDir);

    expect(updatedPkg3).not.toHaveInNodeModules("@test/package-1");
    expect(updatedPkg3).not.toDependOn("@test/package-1");
  });

  it("should remove symlink binary", async () => {
    const testDir = await bootstrapFixture("basic");
    const [, , , pkg4] = await getPackages(testDir);
    expect(pkg4).toHaveBinaryLinks("package-2");

    await lernaRemove(testDir)("@test/package-2");
    const [, , updatedPkg4] = await getPackages(testDir);

    expect(updatedPkg4).not.toHaveBinaryLinks("package-2");
  });
});
