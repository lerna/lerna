import { packDirectory as _packDirectory } from "@lerna/core";
import { commandRunner, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// lerna publish mocks
jest.mock("./verify-npm-package-access");
jest.mock("./get-npm-username");
jest.mock("./get-two-factor-auth-required");
jest.mock("./create-temp-licenses", () => ({
  createTempLicenses: jest.fn(() => Promise.resolve()),
}));
jest.mock("./remove-temp-licenses", () => ({
  removeTempLicenses: jest.fn(() => Promise.resolve()),
}));

// lerna version mocks
setupLernaVersionMocks();

// The mock differs from the real thing
const packDirectory = _packDirectory as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createTempLicenses } = require("../src/lib/create-temp-licenses");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { removeTempLicenses } = require("../src/lib/remove-temp-licenses");

const initFixture = initFixtureFactory(__dirname);

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaPublish = commandRunner(require("../command"));

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
