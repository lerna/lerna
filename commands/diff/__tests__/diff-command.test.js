"use strict";

jest.mock("@lerna/child-process");
jest.mock("@lerna/git-utils");

const path = require("path");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");
const GitUtilities = require("@lerna/git-utils");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const lernaDiff = require("@lerna-test/command-runner")(require("../command"));

describe("DiffCommand", () => {
  ChildProcessUtilities.spawn.mockResolvedValue();
  GitUtilities.isInitialized.mockReturnValue(true);
  GitUtilities.hasCommit.mockReturnValue(true);

  it("should diff packages from the first commit", async () => {
    const testDir = await initFixture("basic");

    GitUtilities.getFirstCommit.mockReturnValueOnce("beefcafe");

    await lernaDiff(testDir)();

    expect(ChildProcessUtilities.spawn).lastCalledWith(
      "git",
      ["diff", "beefcafe", "--color=auto", "--", path.join(testDir, "packages")],
      expect.objectContaining({ cwd: testDir })
    );
  });

  it("should diff packages from the most recent tag", async () => {
    const testDir = await initFixture("basic");

    GitUtilities.hasTags.mockReturnValueOnce(true);
    GitUtilities.getLastTaggedCommit.mockReturnValueOnce("cafedead");

    await lernaDiff(testDir)();

    expect(ChildProcessUtilities.spawn).lastCalledWith(
      "git",
      ["diff", "cafedead", "--color=auto", "--", path.join(testDir, "packages")],
      expect.objectContaining({ cwd: testDir })
    );
  });

  it("should diff a specific package", async () => {
    const testDir = await initFixture("basic");

    GitUtilities.getFirstCommit.mockReturnValueOnce("deadbeef");

    await lernaDiff(testDir)("package-1");

    expect(ChildProcessUtilities.spawn).lastCalledWith(
      "git",
      ["diff", "deadbeef", "--color=auto", "--", path.join(testDir, "packages/package-1")],
      expect.objectContaining({ cwd: testDir })
    );
  });

  it("should error when attempting to diff a package that doesn't exist", async () => {
    const testDir = await initFixture("basic");

    try {
      await lernaDiff(testDir)("missing");
    } catch (err) {
      expect(err.message).toBe("Cannot diff, the package 'missing' does not exist.");
    }
  });

  it("should error when running in a repository without commits", async () => {
    const testDir = await initFixture("basic");

    GitUtilities.hasCommit.mockReturnValueOnce(false);

    try {
      await lernaDiff(testDir)("package-1");
    } catch (err) {
      expect(err.message).toBe("Cannot diff, there are no commits in this repository yet.");
    }
  });

  it("should error when git diff exits non-zero", async () => {
    const testDir = await initFixture("basic");

    ChildProcessUtilities.spawn.mockImplementationOnce(() => {
      const nonZero = new Error("An actual non-zero, not git diff pager SIGPIPE");
      nonZero.code = 1;

      throw nonZero;
    });

    try {
      await lernaDiff(testDir)("package-1");
    } catch (err) {
      expect(err.message).toBe("An actual non-zero, not git diff pager SIGPIPE");
    }
  });
});
