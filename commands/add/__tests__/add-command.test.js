"use strict";

jest.mock("@lerna/bootstrap");

// mocked or stubbed modules
const bootstrap = require("@lerna/bootstrap");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { getPackages } = require("@lerna/project");

// file under test
const lernaAdd = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
expect.extend(require("@lerna-test/pkg-matchers"));

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

  it("should throw for adding local package without specified version", async () => {
    expect.assertions(1);

    const testDir = await initFixture("unspecified-version");

    try {
      await lernaAdd(testDir)("@test/package-1");
    } catch (err) {
      expect(err.message).toMatch(/Requested package has no version:/);
    }
  });

  it("should reference remote dependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("tiny-tarball");
    const [pkg1, pkg2, pkg3, pkg4] = await getPackages(testDir);

    expect(pkg1).toDependOn("tiny-tarball");
    expect(pkg2).toDependOn("tiny-tarball");
    expect(pkg3).toDependOn("tiny-tarball");
    expect(pkg4).toDependOn("tiny-tarball");
  });

  it("should reference local dependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");
    const [, pkg2, pkg3, pkg4] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1");
    expect(pkg3).toDependOn("@test/package-1");
    expect(pkg4).toDependOn("@test/package-1");
  });

  it("should reference current caret range if unspecified", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");
    await lernaAdd(testDir)("@test/package-2");
    const [pkg1, pkg2] = await getPackages(testDir);

    expect(pkg1).toDependOn("@test/package-2", "^2.0.0");
    expect(pkg2).toDependOn("@test/package-1", "^1.0.0");
  });

  it("should reference specified range", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1@~1");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1", "~1");
  });

  it("should reference exact version if --exact", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "--exact");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1", "1.0.0", {
      exact: true,
    });
  });

  it("adds explicit local file: specifier as file: specifier", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1@file:packages/package-1");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1", "file:../package-1");
  });

  it("adds local dep as file: specifier when existing relationships are file: specifiers", async () => {
    const testDir = await initFixture("existing");
    const [, , pkg3] = await getPackages(testDir);

    pkg3.updateLocalDependency({ name: "@test/package-2", type: "directory" }, "file:../package-2", "");
    await pkg3.serialize();

    await lernaAdd(testDir)("@test/package-1");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1", "file:../package-1");
  });

  it("should add target package to devDependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "--dev");
    const [, pkg2, pkg3, pkg4] = await getPackages(testDir);

    expect(pkg2).toDevDependOn("@test/package-1");
    expect(pkg3).toDevDependOn("@test/package-1");
    expect(pkg4).toDevDependOn("@test/package-1");
  });

  it("should add target package to devDependencies with alias", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("-D", "@test/package-1");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDevDependOn("@test/package-1");
  });

  it("should not reference packages to themeselves", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).not.toDependOn("@test/package-1");
  });

  it("filters targets by optional directory globs", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "packages/package-2");
    const [, pkg2, pkg3, pkg4] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1");
    expect(pkg3).not.toDevDependOn("@test/package-1");
    expect(pkg4).not.toDevDependOn("@test/package-1");
  });

  it("should retain existing dependencies", async () => {
    const testDir = await initFixture("existing");

    await lernaAdd(testDir)("@test/package-2");
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).toDependOn("pify");
  });

  it("should retain existing devDependencies", async () => {
    const testDir = await initFixture("existing");

    await lernaAdd(testDir)("@test/package-1", "--dev");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDevDependOn("file-url");
  });

  it("supports tag specifiers", async () => {
    const testDir = await initFixture("basic");

    // npm dist-tags for outdated versions _should_ stay stable
    await lernaAdd(testDir)("npm@next-3");
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).toDependOn("npm", "^3.10.10");
  });

  it("supports version specifiers (exact)", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("tiny-tarball@1.0.0");
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).toDependOn("tiny-tarball", "1.0.0", { exact: true });
  });

  it("accepts --registry option", async () => {
    const testDir = await initFixture("basic");

    try {
      await lernaAdd(testDir)(
        "@my-own/private-idaho",
        "--registry",
        "http://registry.cuckoo-banana-pants.com/"
      );
    } catch (err) {
      // obviously this registry doesn't exist, thus it will always error
      expect(err.message).toMatch("ENOTFOUND");
    }

    expect.assertions(1);
  });

  it("should bootstrap changed packages", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");

    expect(bootstrap).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [],
        cwd: testDir,
        composed: "add",
      })
    );
  });

  it("should not bootstrap unchanged packages", async () => {
    const testDir = await initFixture("unchanged");

    await lernaAdd(testDir)("@test/package-1");

    expect(bootstrap).not.toHaveBeenCalled();
  });

  it("skips bootstrap with --no-bootstrap", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1", "--no-bootstrap");
    const [, pkg2] = await getPackages(testDir);

    expect(bootstrap).not.toHaveBeenCalled();
    expect(pkg2).toDependOn("@test/package-1", "^1.0.0");
  });

  it("should reset a dependency from caret to exact", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("@test/package-1");
    await lernaAdd(testDir)("@test/package-1", "--exact");
    const [, pkg2] = await getPackages(testDir);

    expect(pkg2).toDependOn("@test/package-1", "1.0.0", {
      exact: true,
    });
  });
});
