"use strict";

const fs = require("fs-extra");
const path = require("path");

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const removeTempLicenses = require("../lib/remove-temp-licenses");

test("removeTempLicenses", async () => {
  const cwd = await initFixture("licenses-names");

  const pkg = { name: "package-1", location: path.join(cwd, "packages", "package-1") };
  await removeTempLicenses([pkg]);

  expect(fs.exists(path.join(pkg.location, "LICENSE"))).resolves.toBe(false);
});
