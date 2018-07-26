"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/create-temp-licenses", () => jest.fn(() => Promise.resolve()));
jest.mock("../lib/remove-temp-licenses", () => jest.fn(() => Promise.resolve()));
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");

const path = require("path");

// mocked modules
const npmPublish = require("@lerna/npm-publish");
const createTempLicenses = require("../lib/create-temp-licenses");
const removeTempLicenses = require("../lib/remove-temp-licenses");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const loggingOutput = require("@lerna-test/logging-output");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("licenses", () => {
  it("makes a temporary copy of the root license text if package has none", async () => {
    const cwd = await initFixture("licenses");
    const packagesToBeLicensed = [expect.objectContaining({ name: "package-1" })];

    await lernaPublish(cwd)();

    expect(createTempLicenses).lastCalledWith(path.join(cwd, "LICENSE"), packagesToBeLicensed);
    expect(removeTempLicenses).lastCalledWith(packagesToBeLicensed);
  });

  it("removes all temporary licenses on error", async () => {
    const cwd = await initFixture("licenses");

    npmPublish.mockImplementationOnce(() => Promise.reject(new Error("boom")));

    try {
      await lernaPublish(cwd)();
    } catch (err) {
      expect(err.message).toBe("boom");
    }

    expect(removeTempLicenses).toHaveBeenCalledTimes(1);
    expect(removeTempLicenses).lastCalledWith([expect.objectContaining({ name: "package-1" })]);
  });

  it("does not override original error when removal rejects", async () => {
    const cwd = await initFixture("licenses");

    npmPublish.mockImplementationOnce(() => Promise.reject(new Error("boom")));
    removeTempLicenses.mockImplementationOnce(() => Promise.reject(new Error("shaka-lakka")));

    try {
      await lernaPublish(cwd)();
    } catch (err) {
      expect(err.message).toBe("boom");
    }
  });

  it("warns when packages need a license and the root license file is missing", async () => {
    const cwd = await initFixture("licenses-missing");

    await lernaPublish(cwd)();

    const [warning] = loggingOutput("warn");
    expect(warning).toMatch("Packages package-1, package-3 are missing a license");

    expect(createTempLicenses).lastCalledWith(undefined, []);
    expect(removeTempLicenses).lastCalledWith([]);
  });
});
