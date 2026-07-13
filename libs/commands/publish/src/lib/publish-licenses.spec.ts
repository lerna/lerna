import { packDirectory as _packDirectory } from "@lerna/core";
import { commandRunner, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

vi.mock("@lerna/core", async () => {
  const actual = (await vi.importActual("@lerna/core")) as any;
  return {
    ...actual,
    ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
    gitCheckout: actual.gitCheckout,
  };
});

// lerna publish mocks
vi.mock("./verify-npm-package-access");
vi.mock("./get-npm-username");
vi.mock("./get-two-factor-auth-required");
vi.mock("./create-temp-licenses", async () => ({
  createTempLicenses: vi.fn(() => Promise.resolve()),
}));
vi.mock("./remove-temp-licenses", async () => ({
  removeTempLicenses: vi.fn(() => Promise.resolve()),
}));

// lerna version mocks
setupLernaVersionMocks();

// The mock differs from the real thing
const packDirectory = _packDirectory as any;

import { createTempLicenses } from "./create-temp-licenses";

import { removeTempLicenses } from "./remove-temp-licenses";

const initFixture = initFixtureFactory(__dirname);

// test command

import command from "../command";

const lernaPublish = commandRunner(command);

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
