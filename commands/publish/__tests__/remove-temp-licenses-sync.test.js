"use strict";

const fs = require("fs-extra");
const path = require("path");

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const removeTempLicensesSync = require("../lib/remove-temp-licenses-sync");

test("removeTempLicensesSync", async () => {
  const cwd = await initFixture("licenses-names");

  const pkg = { name: "package-1", location: path.join(cwd, "packages", "package-1") };
  removeTempLicensesSync([pkg]);

  expect(fs.exists(path.join(pkg.location, "LICENSE"))).resolves.toBe(false);
});
