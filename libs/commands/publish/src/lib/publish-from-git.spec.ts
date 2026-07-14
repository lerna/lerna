import {
  npmPublish as _npmPublish,
  output as _output,
  promptConfirmation as _promptConfirmation,
  throwIfUncommitted as _throwIfUncommitted,
} from "@lerna/core";
import { commandRunner, gitTag, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";

vi.mock("@lerna/core", async () => {
  const actual = (await vi.importActual("@lerna/core")) as any;
  return {
    ...actual,
    ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
    // we're actually testing integration with git
    collectProjectUpdates: actual.collectProjectUpdates,
    gitCheckout: actual.gitCheckout,
  };
});

// lerna publish mocks
vi.mock("./get-packages-without-license", async () => {
  return {
    getPackagesWithoutLicense: vi.fn().mockResolvedValue([]),
  };
});
vi.mock("./verify-npm-package-access");
vi.mock("./get-npm-username");
vi.mock("./get-two-factor-auth-required");
vi.mock("./get-projects-with-unpublished-packages");

// lerna version mocks
vi.mock("@lerna/commands/version/lib/git-push");
vi.mock("@lerna/commands/version/lib/is-anything-committed", async () => ({
  isAnythingCommitted: vi.fn().mockResolvedValue(true),
}));
vi.mock("@lerna/commands/version/lib/is-behind-upstream");
vi.mock("@lerna/commands/version/lib/remote-branch-exists", async () => ({
  remoteBranchExists: vi.fn().mockResolvedValue(true),
}));

const promptConfirmation = vi.mocked(_promptConfirmation);
const throwIfUncommitted = vi.mocked(_throwIfUncommitted);

// The mock differs from the real thing
const output = _output as any;
const npmPublish = _npmPublish as any;

const initFixture = initFixtureFactory(__dirname);

// file under test

import command from "../command";

const lernaPublish = commandRunner(command);

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
