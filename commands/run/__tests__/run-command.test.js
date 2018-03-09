"use strict";

jest.mock("@lerna/npm-run-script");

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");

// mocked modules
const npmRunScript = require("@lerna/npm-run-script");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const consoleOutput = require("@lerna-test/console-output");
const loggingOutput = require("@lerna-test/logging-output");
const normalizeRelativeDir = require("@lerna-test/normalize-relative-dir");

// file under test
const lernaRun = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
const ranInPackages = testDir =>
  npmRunScript.mock.calls.reduce((arr, [script, { args, npmClient, pkg }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, "run", script].concat(args);
    arr.push(record.join(" "));
    return arr;
  }, []);

const ranInPackagesStreaming = testDir =>
  npmRunScript.stream.mock.calls.reduce((arr, [script, { args, npmClient, pkg }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, "run", script].concat(args);
    arr.push(record.join(" "));
    return arr;
  }, []);

describe("RunCommand", () => {
  npmRunScript.mockResolvedValue({ stdout: "stdout" });
  npmRunScript.stream.mockResolvedValue();

  describe("in a basic repo", () => {
    it("runs a script in packages", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("my-script");

      expect(ranInPackages(testDir)).toMatchSnapshot();
      expect(consoleOutput()).toMatch("stdout\nstdout");
    });

    it("runs a script in packages with --stream", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("my-script", "--stream");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("always runs env script", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("env");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("runs a script only in scoped packages", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("my-script", "--scope", "package-1");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("does not run a script in ignored packages", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("my-script", "--ignore", "package-@(2|3|4)");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("should filter packages that are not updated with --since", async () => {
      const testDir = await initFixture("basic");
      const pkgLocation = path.join(testDir, "packages/package-3");
      const readmeFile = path.join(pkgLocation, "README.md");

      // change in master
      await fs.outputFile(readmeFile, "# package-3");
      await execa("git", ["add", readmeFile], { cwd: testDir });
      await execa("git", ["commit", "-m", "add readme"], { cwd: testDir });

      // branch
      await execa("git", ["checkout", "-b", "feature/yay-docs"], { cwd: testDir });

      // change in feature branch
      await fs.appendFile(readmeFile, "yay docs");
      await execa("git", ["add", readmeFile], { cwd: testDir });
      await execa("git", ["commit", "-m", "yay docs"], { cwd: testDir });

      await lernaRun(testDir)("my-script", "--since", "master");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("requires a git repo when using --since", async () => {
      expect.assertions(1);

      const testDir = await initFixture("basic");

      await fs.remove(path.join(testDir, ".git"));

      try {
        await lernaRun(testDir)("my-script", "--since", "some-branch");
      } catch (err) {
        expect(err.message).toMatch("this is not a git repository");
      }
    });

    it("does not error when no packages match", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("missing-script");

      expect(npmRunScript).not.toBeCalled();
      expect(consoleOutput()).toBe("");
    });

    it("runs a script in all packages with --parallel", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("env", "--parallel");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("supports alternate npmClient configuration", async () => {
      const testDir = await initFixture("basic");

      await lernaRun(testDir)("env", "--npm-client", "yarn");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("runs scoped command including filtered deps", async () => {
      const testDir = await initFixture("include-filtered-dependencies");
      await lernaRun(testDir)("my-script", "--scope", "@test/package-2", "--include-filtered-dependencies");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("toposort");

      await lernaRun(testDir)("env");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");
      expect(logMessage).toMatch("package-cycle-2 -> package-cycle-1 -> package-cycle-2");
      expect(logMessage).toMatch(
        "package-cycle-extraneous -> package-cycle-1 -> package-cycle-2 -> package-cycle-1"
      );

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      const testDir = await initFixture("toposort");

      try {
        await lernaRun(testDir)("env", "--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
