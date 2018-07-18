"use strict";

const fs = require("fs-extra");
const path = require("path");
const Project = require("@lerna/project");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const removeTempLicenses = require("../lib/remove-temp-licenses");

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
