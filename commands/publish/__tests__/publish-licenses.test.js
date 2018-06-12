"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const npmPublish = require("@lerna/npm-publish");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const loggingOutput = require("@lerna-test/logging-output");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("licenses", () => {
  it("makes a temporary copy of the root license text if package has none", async () => {
    const cwd = await initFixture("licenses");

    await lernaPublish(cwd)();

    expect(npmPublish.registry.get("package-1").licenseBasename).toBe("LICENSE");
    expect(npmPublish.registry.get("package-1").licenseText).toMatch("ABC License");
    expect(fs.exists(path.join(cwd, "packages", "package-1", "LICENSE"))).resolves.toBe(false);
  });

  it("keeps the package license text if already present", async () => {
    const cwd = await initFixture("licenses");

    await lernaPublish(cwd)();

    expect(npmPublish.registry.get("package-2").licenseBasename).toBe("licence");
    expect(npmPublish.registry.get("package-2").licenseText).toMatch("XYZ License");
    expect(fs.exists(path.join(cwd, "packages", "package-2", "licence"))).resolves.toBe(true);
  });

  it("is able to clean up temporary licenses on error", async () => {
    const cwd = await initFixture("licenses");

    npmPublish.mockImplementationOnce(() => Promise.reject(new Error("boom")));

    try {
      await lernaPublish(cwd)();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("boom");
    }

    expect(fs.exists(path.join(cwd, "packages", "package-1", "LICENSE"))).resolves.toBe(false);
  });

  it("warns in case the packages have no license text and there is no root license file", async () => {
    const cwd = await initFixture("licenses-missing");

    await lernaPublish(cwd)();

    const [warning] = loggingOutput("warn");
    expect(warning).toMatch(
      "Packages package-1, package-3 are missing a LICENSE file with full license text"
    );

    expect(fs.exists(path.join(cwd, "packages", "package-1", "LICENSE"))).resolves.toBe(false);
    expect(fs.exists(path.join(cwd, "packages", "package-2", "LICENSE"))).resolves.toBe(true);
    expect(fs.exists(path.join(cwd, "packages", "package-3", "LICENSE"))).resolves.toBe(false);
  });
});
