"use strict";

const path = require("path");

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getPackagesWithoutLicense = require("../lib/get-packages-without-license");

test("getPackagesWithoutLicense", async () => {
  const cwd = await initFixture("licenses");

  const pkg1 = { name: "package-1", location: path.join(cwd, "packages", "package-1") };
  const pkg2 = { name: "package-2", location: path.join(cwd, "packages", "package-2") };

  expect(getPackagesWithoutLicense([pkg1, pkg2])).resolves.toEqual(expect.arrayContaining([pkg1]));
});
