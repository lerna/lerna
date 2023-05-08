import { Project } from "@lerna/core";
import { initFixtureFactory } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";

const initFixture = initFixtureFactory(__dirname);

import { removeTempLicenses } from "./remove-temp-licenses";

describe("removeTempLicenses", () => {
  it("removes license file from target packages", async () => {
    const cwd = await initFixture("licenses-names");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // mimic decoration in createTempLicenses()
    pkg.licensePath = path.join(pkg.location, "LICENSE");

    await removeTempLicenses([pkg]);

    const tempLicensePresent = await fs.pathExists(pkg.licensePath);
    expect(tempLicensePresent).toBe(false);
  });

  it("skips removal when no target packages exist", async () => {
    const cwd = await initFixture("licenses-names");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    // mimic decoration in createTempLicenses()
    pkg.licensePath = path.join(pkg.location, "LICENSE");

    await removeTempLicenses([]);

    const licensePresent = await fs.pathExists(pkg.licensePath);
    expect(licensePresent).toBe(true);
  });
});
