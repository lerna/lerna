import { Project } from "@lerna/core";
import { initFixtureFactory } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { removeTempLicenses } = require("./remove-temp-licenses");

describe("removeTempLicenses", () => {
  it("removes license file from target packages", async () => {
    const cwd = await initFixture("licenses-names");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // mimic decoration in createTempLicenses()
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pkg.licensePath = path.join(pkg.location, "LICENSE");

    await removeTempLicenses([pkg]);

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const tempLicensePresent = await fs.pathExists(pkg.licensePath);
    expect(tempLicensePresent).toBe(false);
  });

  it("skips removal when no target packages exist", async () => {
    const cwd = await initFixture("licenses-names");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // mimic decoration in createTempLicenses()
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pkg.licensePath = path.join(pkg.location, "LICENSE");

    await removeTempLicenses([]);

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const licensePresent = await fs.pathExists(pkg.licensePath);
    expect(licensePresent).toBe(true);
  });
});
