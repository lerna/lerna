"use strict";

const fs = require("fs-extra");
const path = require("path");
const Project = require("@lerna/project");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const createTempLicenses = require("../lib/create-temp-licenses");

describe("createTempLicenses", () => {
  it("copies root license into package location", async () => {
    const cwd = await initFixture("licenses");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await createTempLicenses(project.licensePath, [pkg]);

    const licenseWritten = await fs.pathExists(path.join(pkg.location, "LICENSE"));
    expect(licenseWritten).toBe(true);
  });

  it("copies root license with extension into package location", async () => {
    const cwd = await initFixture("licenses");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await fs.move(path.join(cwd, "LICENSE"), path.join(cwd, "LICENSE.md"));
    await createTempLicenses(project.licensePath, [pkg]);

    const licenseWritten = await fs.pathExists(path.join(pkg.location, "LICENSE.md"));
    expect(licenseWritten).toBe(true);
  });

  it("skips copying when root license is missing", async () => {
    const cwd = await initFixture("licenses");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await createTempLicenses(undefined, [pkg]);

    const licenseWritten = await fs.pathExists(path.join(pkg.location, "LICENSE"));
    expect(licenseWritten).toBe(false);
  });

  it("skips copying when there are no packages to be licensed", async () => {
    const cwd = await initFixture("licenses");
    const project = new Project(cwd);
    const [pkg] = await project.getPackages();

    await createTempLicenses(project.licensePath, []);

    const licenseWritten = await fs.pathExists(path.join(pkg.location, "LICENSE"));
    expect(licenseWritten).toBe(false);
  });
});
