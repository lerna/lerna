"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const { getPackages } = require("@lerna/project");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitInit = require("@lerna-test/git-init");
const gitTag = require("@lerna-test/git-tag");

// file under test
const lernaDiff = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("DiffCommand", () => {
  // overwrite spawn so we get piped stdout, not inherited
  ChildProcessUtilities.spawn = jest.fn((...args) => execa(...args));

  it("should diff packages from the first commit", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await getPackages(cwd);
    const rootReadme = path.join(cwd, "README.md");

    await pkg1.set("changed", 1).serialize();
    await fs.outputFile(rootReadme, "change outside packages glob");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it("should diff packages from the most recent tag", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await getPackages(cwd);

    await pkg1.set("changed", 1).serialize();
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");
    await gitTag(cwd, "v1.0.1");

    await pkg1.set("sinceLastTag", true).serialize();
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it("should diff a specific package", async () => {
    const cwd = await initFixture("basic");
    const [pkg1, pkg2] = await getPackages(cwd);

    await pkg1.set("changed", 1).serialize();
    await pkg2.set("changed", 1).serialize();
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)("package-2");
    expect(stdout).toMatchSnapshot();
  });

  it("passes diff exclude globs configured with --ignored-changes", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await getPackages(cwd);

    await pkg1.set("changed", 1).serialize();
    await fs.outputFile(path.join(pkg1.location, "README.md"), "ignored change");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)("--ignore-changes", "**/README.md");
    expect(stdout).toMatchSnapshot();
  });

  it("should error when attempting to diff a package that doesn't exist", async () => {
    const cwd = await initFixture("basic");

    try {
      await lernaDiff(cwd)("missing");
    } catch (err) {
      expect(err.message).toBe("Cannot diff, the package 'missing' does not exist.");
    }
  });

  it("should error when running in a repository without commits", async () => {
    const cwd = await initFixture("basic");

    await fs.remove(path.join(cwd, ".git"));
    await gitInit(cwd);

    try {
      await lernaDiff(cwd)("package-1");
    } catch (err) {
      expect(err.message).toBe("Cannot diff, there are no commits in this repository yet.");
    }
  });

  it("should error when git diff exits non-zero", async () => {
    const cwd = await initFixture("basic");

    ChildProcessUtilities.spawn.mockImplementationOnce(() => {
      const nonZero = new Error("An actual non-zero, not git diff pager SIGPIPE");
      nonZero.code = 1;

      throw nonZero;
    });

    try {
      await lernaDiff(cwd)("package-1");
    } catch (err) {
      expect(err.message).toBe("An actual non-zero, not git diff pager SIGPIPE");
    }
  });
});
