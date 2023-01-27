import {
  npmPublish as _npmPublish,
  output as _output,
  promptConfirmation as _promptConfirmation,
  throwIfUncommitted as _throwIfUncommitted,
} from "@lerna/core";
import { commandRunner, gitTag, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";

jest.mock("@lerna/core", () => {
  // eslint-disable-next-line jest/no-mocks-import, @typescript-eslint/no-var-requires
  const mockCore = require("@lerna/test-helpers/__mocks__/@lerna/core");
  return {
    ...mockCore,
    // we're actually testing integration with git
    collectUpdates: jest.requireActual("@lerna/core").collectUpdates,
  };
});

// lerna publish mocks
jest.mock("./get-packages-without-license", () => {
  return {
    getPackagesWithoutLicense: jest.fn().mockResolvedValue([]),
  };
});
jest.mock("./verify-npm-package-access");
jest.mock("./get-npm-username");
jest.mock("./get-two-factor-auth-required");
jest.mock("./get-unpublished-packages");

// lerna version mocks
jest.mock("@lerna/commands/version/lib/git-push");
jest.mock("@lerna/commands/version/lib/is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockResolvedValue(true),
}));
jest.mock("@lerna/commands/version/lib/is-behind-upstream");
jest.mock("@lerna/commands/version/lib/remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

const promptConfirmation = jest.mocked(_promptConfirmation);
const throwIfUncommitted = jest.mocked(_throwIfUncommitted);

// The mock differs from the real thing
const output = _output as any;
const npmPublish = _npmPublish as any;

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaPublish = commandRunner(require("../command"));

describe("publish from-git", () => {
  it("publishes tagged packages", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "v1.0.0");
    await lernaPublish(cwd)("from-git");

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
    expect(output.logged()).toMatch("Found 4 packages to publish:");
    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-4",
      "package-2",
      "package-3",
      // package-5 is private
    ]);
  });

  it("publishes tagged packages, lexically sorted when --no-sort is present", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "v1.0.0");
    await lernaPublish(cwd)("from-git", "--no-sort");

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
    expect(output.logged()).toMatch("Found 4 packages to publish:");
    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-2",
      "package-3",
      "package-4",
      // package-5 is private
    ]);
  });

  it("publishes tagged independent packages", async () => {
    const cwd = await initFixture("independent");

    await Promise.all([
      gitTag(cwd, "package-1@1.0.0"),
      gitTag(cwd, "package-2@2.0.0"),
      gitTag(cwd, "package-3@3.0.0"),
      gitTag(cwd, "package-4@4.0.0"),
      gitTag(cwd, "package-5@5.0.0"),
    ]);
    await lernaPublish(cwd)("from-git");

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-4",
      "package-2",
      "package-3",
      // package-5 is private
    ]);
  });

  it("publishes packages matching custom --tag-version-prefix", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "foo/1.0.0");
    await lernaPublish(cwd)("from-git", "--tag-version-prefix", "foo/");

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-4",
      "package-2",
      "package-3",
      // package-5 is private
    ]);
  });

  it("only publishes independent packages with matching tags", async () => {
    const cwd = await initFixture("independent");

    await gitTag(cwd, "package-3@3.0.0");
    await lernaPublish(cwd)("from-git");

    expect(output.logged()).toMatch("Found 1 package to publish:");
    expect(npmPublish.order()).toEqual(["package-3"]);
  });

  it("exits early when the current commit is not tagged", async () => {
    const cwd = await initFixture("normal");

    await lernaPublish(cwd)("from-git");

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput("info");
    expect(logMessages).toContain("No tagged release found");
  });

  it("throws an error when uncommitted changes are present", async () => {
    throwIfUncommitted.mockImplementationOnce(() => {
      throw new Error("uncommitted");
    });

    const cwd = await initFixture("normal");
    const command = lernaPublish(cwd)("from-git");

    await expect(command).rejects.toThrow("uncommitted");
    // notably different than the actual message, but good enough here
  });

  it("throws an error when --git-head is passed", async () => {
    const cwd = await initFixture("normal");
    const command = lernaPublish(cwd)("from-git", "--git-head", "deadbeef");

    await expect(command).rejects.toThrow(
      expect.objectContaining({
        prefix: "EGITHEAD",
      })
    );
  });
});
