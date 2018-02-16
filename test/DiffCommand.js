"use strict";

const path = require("path");

// mocked modules
const ChildProcessUtilities = require("../src/ChildProcessUtilities");
const GitUtilities = require("../src/GitUtilities");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");

// file under test
const lernaDiff = require("./helpers/command-runner")(require("../src/commands/DiffCommand"));

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/GitUtilities");

describe("DiffCommand", () => {
  ChildProcessUtilities.spawn.mockImplementation(callsBack(null, true));
  GitUtilities.isInitialized.mockReturnValue(true);
  GitUtilities.hasCommit.mockReturnValue(true);

  it("should diff packages from the first commit", async () => {
    const testDir = await initFixture("DiffCommand/basic");

    GitUtilities.getFirstCommit.mockReturnValueOnce("beefcafe");

    await lernaDiff(testDir)();

    expect(ChildProcessUtilities.spawn).lastCalledWith(
      "git",
      ["diff", "beefcafe", "--color=auto", "--", path.join(testDir, "packages")],
      expect.objectContaining({ cwd: testDir }),
      expect.any(Function)
    );
  });

  it("should diff packages from the most recent tag", async () => {
    const testDir = await initFixture("DiffCommand/basic");

    GitUtilities.hasTags.mockReturnValueOnce(true);
    GitUtilities.getLastTaggedCommit.mockReturnValueOnce("cafedead");

    await lernaDiff(testDir)();

    expect(ChildProcessUtilities.spawn).lastCalledWith(
      "git",
      ["diff", "cafedead", "--color=auto", "--", path.join(testDir, "packages")],
      expect.objectContaining({ cwd: testDir }),
      expect.any(Function)
    );
  });

  it("should diff a specific package", async () => {
    const testDir = await initFixture("DiffCommand/basic");

    GitUtilities.getFirstCommit.mockReturnValueOnce("deadbeef");

    await lernaDiff(testDir)("package-1");

    expect(ChildProcessUtilities.spawn).lastCalledWith(
      "git",
      ["diff", "deadbeef", "--color=auto", "--", path.join(testDir, "packages/package-1")],
      expect.objectContaining({ cwd: testDir }),
      expect.any(Function)
    );
  });

  it("should error when attempting to diff a package that doesn't exist", async () => {
    const testDir = await initFixture("DiffCommand/basic");

    try {
      await lernaDiff(testDir)("missing");
    } catch (err) {
      expect(err.exitCode).toBe(1);
      expect(err.message).toBe("Cannot diff, the package 'missing' does not exist.");
    }
  });

  it("should error when running in a repository without commits", async () => {
    const testDir = await initFixture("DiffCommand/basic");

    GitUtilities.hasCommit.mockReturnValueOnce(false);

    try {
      await lernaDiff(testDir)("package-1");
    } catch (err) {
      expect(err.exitCode).toBe(1);
      expect(err.message).toBe("Cannot diff, there are no commits in this repository yet.");
    }
  });

  it("should error when git diff exits non-zero", async () => {
    const testDir = await initFixture("DiffCommand/basic");

    const nonZero = new Error("An actual non-zero, not git diff pager SIGPIPE");
    nonZero.code = 1;

    ChildProcessUtilities.spawn.mockImplementationOnce(callsBack(nonZero));

    try {
      await lernaDiff(testDir)("package-1");
    } catch (err) {
      expect(err.exitCode).toBe(1);
      expect(err.message).toBe("An actual non-zero, not git diff pager SIGPIPE");
    }
  });
});
