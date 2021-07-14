"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
jest.mock("../lib/get-two-factor-auth-required");
jest.mock("../lib/create-temp-licenses", () => ({ createTempLicenses: jest.fn(() => Promise.resolve()) }));
jest.mock("../lib/remove-temp-licenses", () => ({ removeTempLicenses: jest.fn(() => Promise.resolve()) }));
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");
jest.mock("../../version/lib/remote-branch-exists");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const { packDirectory } = require("@lerna/pack");
const { createTempLicenses } = require("../lib/create-temp-licenses");
const { removeTempLicenses } = require("../lib/remove-temp-licenses");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { loggingOutput } = require("@lerna-test/logging-output");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("licenses", () => {
  it("makes a temporary copy of the root license text if package has none", async () => {
    const cwd = await initFixture("licenses");
    const packagesToBeLicensed = [expect.objectContaining({ name: "package-1" })];

    await lernaPublish(cwd)();

    expect(createTempLicenses).toHaveBeenLastCalledWith(path.join(cwd, "LICENSE"), packagesToBeLicensed);
    expect(removeTempLicenses).toHaveBeenLastCalledWith(packagesToBeLicensed);
  });

  it("removes all temporary licenses on error", async () => {
    packDirectory.mockImplementationOnce(() => Promise.reject(new Error("boom")));

    const cwd = await initFixture("licenses");
    const command = lernaPublish(cwd)();

    await expect(command).rejects.toThrow("boom");

    expect(removeTempLicenses).toHaveBeenCalledTimes(1);
    expect(removeTempLicenses).toHaveBeenLastCalledWith([expect.objectContaining({ name: "package-1" })]);
  });

  it("does not override original error when removal rejects", async () => {
    packDirectory.mockImplementationOnce(() => Promise.reject(new Error("boom")));
    removeTempLicenses.mockImplementationOnce(() => Promise.reject(new Error("shaka-lakka")));

    const cwd = await initFixture("licenses");
    const command = lernaPublish(cwd)();

    await expect(command).rejects.toThrow("boom");
  });

  it("warns when packages need a license and the root license file is missing", async () => {
    const cwd = await initFixture("licenses-missing");

    await lernaPublish(cwd)();

    const [warning] = loggingOutput("warn");
    expect(warning).toMatchInlineSnapshot(`
"Packages package-1 and package-3 are missing a license.
One way to fix this is to add a LICENSE.md file to the root of this repository.
See https://choosealicense.com for additional guidance."
`);

    expect(createTempLicenses).toHaveBeenLastCalledWith(undefined, []);
    expect(removeTempLicenses).toHaveBeenLastCalledWith([]);
  });

  it("warns when one package needs a license", async () => {
    const cwd = await initFixture("licenses");

    // remove root license so warning is triggered
    await fs.remove(path.join(cwd, "LICENSE"));

    await lernaPublish(cwd)();

    const [warning] = loggingOutput("warn");
    expect(warning).toMatch("Package package-1 is missing a license.");
  });

  it("warns when multiple packages need a license", async () => {
    const cwd = await initFixture("licenses-missing");

    // simulate _all_ packages missing a license
    await fs.remove(path.join(cwd, "packages/package-2/LICENSE"));

    await lernaPublish(cwd)();

    const [warning] = loggingOutput("warn");
    expect(warning).toMatch("Packages package-1, package-2, and package-3 are missing a license.");
  });
});
