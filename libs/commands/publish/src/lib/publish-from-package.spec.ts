import {
  npmPublish as _npmPublish,
  output as _output,
  promptConfirmation as _promptConfirmation,
  throwIfUncommitted as _throwIfUncommitted,
} from "@lerna/core";
import { commandRunner, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import _writePkg from "write-pkg";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("write-pkg", () => require("@lerna/test-helpers/__mocks__/write-pkg"));

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// lerna publish mocks
jest.mock("./get-packages-without-license", () => ({
  getPackagesWithoutLicense: jest.fn().mockResolvedValue([]),
}));
jest.mock("./verify-npm-package-access", () => ({
  verifyNpmPackageAccess: jest.fn(() => Promise.resolve()),
}));
jest.mock("./get-npm-username", () => ({
  getNpmUsername: jest.fn(() => Promise.resolve("lerna-test")),
}));
jest.mock("./get-two-factor-auth-required");
jest.mock("./get-unpublished-packages", () => ({
  getUnpublishedPackages: jest.fn(() => Promise.resolve([])),
}));

// lerna version mocks
jest.mock("@lerna/commands/version/lib/git-push");
jest.mock("@lerna/commands/version/lib/is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockResolvedValue(true),
}));
jest.mock("@lerna/commands/version/lib/is-behind-upstream");
jest.mock("@lerna/commands/version/lib/remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getUnpublishedPackages } = require("./get-unpublished-packages");

const promptConfirmation = jest.mocked(_promptConfirmation);
const throwIfUncommitted = jest.mocked(_throwIfUncommitted);

// The mock differs from the real thing
const npmPublish = _npmPublish as any;
const writePkg = _writePkg as any;
const output = _output as any;

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaPublish = commandRunner(require("../command"));

describe("publish from-package", () => {
  it("publishes unpublished packages", async () => {
    const cwd = await initFixture("normal");

    getUnpublishedPackages.mockImplementationOnce((packageGraph) => {
      const pkgs = packageGraph.rawPackageList.slice(1, 3);
      return pkgs.map((pkg) => packageGraph.get(pkg.name));
    });

    await lernaPublish(cwd)("from-package");

    expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
    expect(output.logged()).toMatch("Found 2 packages to publish:");
    expect(npmPublish.order()).toEqual(["package-2", "package-3"]);
  });

  it("publishes unpublished independent packages", async () => {
    const cwd = await initFixture("independent");

    getUnpublishedPackages.mockImplementationOnce((packageGraph) => Array.from(packageGraph.values()));

    await lernaPublish(cwd)("from-package");

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-4",
      "package-2",
      "package-3",
      // package-5 is private
    ]);
  });

  it("publishes unpublished independent packages, lexically sorted when --no-sort is present", async () => {
    const cwd = await initFixture("independent");

    getUnpublishedPackages.mockImplementationOnce((packageGraph) => Array.from(packageGraph.values()));

    await lernaPublish(cwd)("from-package", "--no-sort");

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-2",
      "package-3",
      "package-4",
      // package-5 is private
    ]);
  });

  it("exits early when all packages are published", async () => {
    const cwd = await initFixture("normal");

    await lernaPublish(cwd)("from-package");

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput("notice");
    expect(logMessages).toContain("No unpublished release found");
  });

  it("throws an error when uncommitted changes are present", async () => {
    throwIfUncommitted.mockImplementationOnce(() => {
      throw new Error("uncommitted");
    });

    const cwd = await initFixture("normal");
    const command = lernaPublish(cwd)("from-package");

    await expect(command).rejects.toThrow("uncommitted");
    // notably different than the actual message, but good enough here
  });

  it("does not require a git repo", async () => {
    getUnpublishedPackages.mockImplementationOnce((packageGraph) => [packageGraph.get("package-1")]);

    const cwd = await initFixture("independent");

    // nuke the git repo first
    await fs.remove(path.join(cwd, ".git"));
    await lernaPublish(cwd)("from-package");

    expect(npmPublish).toHaveBeenCalled();
    expect(writePkg.updatedManifest("package-1")).not.toHaveProperty("gitHead");

    const logMessages = loggingOutput("notice");
    expect(logMessages).toContain("Unable to verify working tree, proceed at your own risk");
    expect(logMessages).toContain(
      "Unable to set temporary gitHead property, it will be missing from registry metadata"
    );
    expect(logMessages).toContain("Unable to reset working tree changes, this probably isn't a git repo.");
  });

  it("accepts --git-head override", async () => {
    getUnpublishedPackages.mockImplementationOnce((packageGraph) => [packageGraph.get("package-1")]);

    const cwd = await initFixture("independent");

    await lernaPublish(cwd)("from-package", "--git-head", "deadbeef");

    expect(npmPublish).toHaveBeenCalled();
    expect(writePkg.updatedManifest("package-1").gitHead).toBe("deadbeef");
  });
});
