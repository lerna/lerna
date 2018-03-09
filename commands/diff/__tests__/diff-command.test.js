"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const collectPackages = require("@lerna/collect-packages");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const lernaDiff = require("@lerna-test/command-runner")(require("../command"));

// stabilize diff commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

describe("DiffCommand", () => {
  // overwrite spawn so we get piped stdout, not inherited
  ChildProcessUtilities.spawn = jest.fn((...args) => execa(...args));

  const writeManifest = pkg => fs.writeJSON(pkg.manifestLocation, pkg, { spaces: 2 });
  const gitTag = (cwd, tag) => execa("git", ["tag", tag, "-m", tag], { cwd });
  const gitCommit = (cwd, message) =>
    Promise.resolve()
      .then(() => execa("git", ["add", "."], { cwd }))
      .then(() => execa("git", ["commit", "-m", message], { cwd }));

  it("should diff packages from the first commit", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await collectPackages(cwd);
    const rootReadme = path.join(cwd, "README.md");

    pkg1.json.changed += 1;

    await writeManifest(pkg1);
    await fs.outputFile(rootReadme, "change outside packages glob");
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it("should diff packages from the most recent tag", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await collectPackages(cwd);

    pkg1.json.changed += 1;

    await writeManifest(pkg1);
    await gitCommit(cwd, "changed");
    await gitTag(cwd, "v1.0.1");

    pkg1.json.sinceLastTag = true;

    await writeManifest(pkg1);
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it("should diff a specific package", async () => {
    const cwd = await initFixture("basic");
    const [pkg1, pkg2] = await collectPackages(cwd);

    pkg1.json.changed += 1;
    pkg2.json.changed += 1;

    await Promise.all([writeManifest(pkg1), writeManifest(pkg2)]);
    await gitCommit(cwd, "changed");

    const { stdout } = await lernaDiff(cwd)("package-2");
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
    await execa("git", ["init"], { cwd });

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
