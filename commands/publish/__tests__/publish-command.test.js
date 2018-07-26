"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");

// mocked or stubbed modules
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");

// helpers
const loggingOutput = require("@lerna-test/logging-output");
const gitTag = require("@lerna-test/git-tag");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("PublishCommand", () => {
  describe("with implied versioning", () => {
    it("publishes changed packages", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)();

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
      expect(npmDistTag.check).not.toBeCalled();
      expect(npmDistTag.remove).not.toBeCalled();
      expect(npmDistTag.add).not.toBeCalled();
    });

    it("publishes changed independent packages", async () => {
      const testDir = await initFixture("independent");

      await lernaPublish(testDir)();

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
    });

    it("--skip-npm yields immediately to VersionCommand with warning", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--skip-npm");

      expect(npmPublish.order()).toHaveLength(0);

      const logMessages = loggingOutput("warn");
      expect(logMessages).toContain("Instead of --skip-npm, call `lerna version` directly");
    });

    it("throws an error in fixed mode when --independent is passed", async () => {
      const testDir = await initFixture("normal");

      try {
        await lernaPublish(testDir)("--independent");
      } catch (err) {
        expect(err.message).toMatch("independent");
      }

      expect.assertions(1);
    });
  });

  describe("from-git", () => {
    it("publishes tagged packages", async () => {
      const testDir = await initFixture("normal");

      await gitTag(testDir, "v1.0.0");
      await lernaPublish(testDir)("from-git");

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
    });

    it("publishes tagged independent packages", async () => {
      const testDir = await initFixture("independent");

      await Promise.all([
        gitTag(testDir, "package-1@1.0.0"),
        gitTag(testDir, "package-2@2.0.0"),
        gitTag(testDir, "package-3@3.0.0"),
        gitTag(testDir, "package-4@4.0.0"),
        gitTag(testDir, "package-5@5.0.0"),
      ]);
      await lernaPublish(testDir)("from-git");

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
    });

    it("only publishes independent packages with matching tags", async () => {
      const testDir = await initFixture("independent");

      await gitTag(testDir, "package-3@3.0.0");
      await lernaPublish(testDir)("from-git");

      expect(npmPublish.order()).toEqual(["package-3"]);
    });

    it("exits early when the current commit is not tagged", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)("from-git");

      expect(npmPublish).not.toBeCalled();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("No tagged release found");
    });
  });

  describe("--registry", () => {
    it("passes registry to npm commands", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://my-private-registry";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmPublish).toBeCalledWith(
        expect.objectContaining({ name: "package-1" }),
        undefined, // dist-tag
        expect.objectContaining({ registry })
      );
    });
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      try {
        const testDir = await initFixture("toposort");

        await lernaPublish(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
