"use strict";

jest.mock("@lerna/bootstrap");
jest.mock("@evocateur/pacote/manifest");

// mocked or stubbed modules
const bootstrap = require("@lerna/bootstrap");
const getManifest = require("@evocateur/pacote/manifest");

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
  // we don't need network requests during unit tests
  getManifest.mockResolvedValue({ version: "1.0.0" });

  it("should throw without packages", async () => {
    const testDir = await initFixture("basic");
    const command = lernaAdd(testDir)();

    await expect(command).rejects.toThrow(/^Not enough non-option arguments/);
  });

  it("should throw for locally unsatisfiable version ranges", async () => {
    const testDir = await initFixture("basic");
    const command = lernaAdd(testDir)("@test/package-1@2");

    await expect(command).rejects.toThrow(/Requested range not satisfiable:/);
  });

  it("should throw for adding local package without specified version", async () => {
    const testDir = await initFixture("unspecified-version");
    const command = lernaAdd(testDir)("@test/package-1");

    await expect(command).rejects.toThrow(/Requested package has no version:/);
  });

  it("should reference remote dependencies", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("tiny-tarball");
    const [pkg1, pkg2, pkg3, pkg4] = await getPackages(testDir);

    expect(pkg1).toDependOn("tiny-tarball");
    expect(pkg2).toDependOn("tiny-tarball");
    expect(pkg3).toDependOn("tiny-tarball");
    expect(pkg4).toDependOn("tiny-tarball");

    expect(getManifest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        // an npm-package-arg Result
        name: "tiny-tarball",
        fetchSpec: "latest",
        registry: true,
        type: "tag",
      }),
      expect.objectContaining({
        // an npm-conf snapshot
        registry: "https://registry.npmjs.org/",
      })
    );
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

  describe("peerDependencies", () => {
    it("should add target package to peerDependencies", async () => {
      const testDir = await initFixture("basic");

      await lernaAdd(testDir)("@test/package-1", "--peer");
      const [, pkg2, pkg3, pkg4] = await getPackages(testDir);

      expect(pkg2).toPeerDependOn("@test/package-1");
      expect(pkg3).toPeerDependOn("@test/package-1");
      expect(pkg4).toPeerDependOn("@test/package-1");
    });

    it("should add target package to peerDependencies with alias", async () => {
      const testDir = await initFixture("basic");

      await lernaAdd(testDir)("-P", "@test/package-1");
      const [, pkg2] = await getPackages(testDir);

      expect(pkg2).toPeerDependOn("@test/package-1");
    });
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

    await lernaAdd(testDir)("tiny-tarball@latest");
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).toDependOn("tiny-tarball", "^1.0.0");
  });

  it("supports version specifiers (exact)", async () => {
    const testDir = await initFixture("basic");

    await lernaAdd(testDir)("tiny-tarball@1.0.0");
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).toDependOn("tiny-tarball", "1.0.0", { exact: true });
  });

  it("accepts --registry option", async () => {
    const testDir = await initFixture("basic");

    getManifest.mockImplementationOnce(() => {
      const err = new Error("ENOTFOUND");
      return Promise.reject(err);
    });

    const command = lernaAdd(testDir)(
      "@my-own/private-idaho",
      "--registry",
      "http://registry.cuckoo-banana-pants.com/"
    );

    // obviously this registry doesn't exist, thus it will always error
    await expect(command).rejects.toThrow(/ENOTFOUND/);

    expect(getManifest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "@my-own/private-idaho",
      }),
      expect.objectContaining({
        registry: "http://registry.cuckoo-banana-pants.com/",
      })
    );
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

  it("should not pass filter options to bootstrap", async () => {
    const testDir = await initFixture("existing");

    await lernaAdd(testDir)(
      "@test/package-2",
      "--scope=@test/package-1",
      "--ignore=@test/package-3",
      "--no-private",
      "--since=deadbeef",
      "--include-filtered-dependents",
      "--include-filtered-dependencies"
    );
    const [pkg1] = await getPackages(testDir);

    expect(pkg1).toDependOn("@test/package-2");
    expect(bootstrap).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scope: undefined,
        ignore: undefined,
        private: undefined,
        since: undefined,
        excludeDependents: undefined,
        includeDependents: undefined,
        includeDependencies: undefined,
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
