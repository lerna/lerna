"use strict";

const fs = require("fs-extra");
const path = require("path");

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const createTempLicenses = require("../lib/create-temp-licenses");

test("creates temporary copy of the source license", async () => {
  const cwd = await initFixture("licenses");

  const pkg = { name: "package-1", location: path.join(cwd, "packages", "package-1") };
  await createTempLicenses(path.join(cwd, "LICENSE"), [pkg]);

  expect(fs.exists(path.join(pkg.location, "LICENSE"))).resolves.toBe(true);
});

test("resolves when source license path is missing", async () => {
  const cwd = await initFixture("licenses");

  const pkg = { name: "package-1", location: path.join(cwd, "packages", "package-1") };
  await createTempLicenses(null, [pkg]);

  expect(fs.exists(path.join(pkg.location, "LICENSE"))).resolves.toBe(false);
});

test("resolves when there are no packages", async () => {
  const cwd = await initFixture("licenses");

  await createTempLicenses(path.join(cwd, "LICENSE"), []);

  expect(fs.exists(path.join(cwd, "packages", "package-1", "LICENSE"))).resolves.toBe(false);
});
