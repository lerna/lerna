"use strict";

const path = require("path");

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getLicensePath = require("../lib/get-license-path");

test("recognizes American spelling", async () => {
  const cwd = await initFixture("licenses-names");

  expect(getLicensePath(path.join(cwd, "packages", "package-1"))).resolves.toBe("LICENSE");
});

test("recognizes British spelling", async () => {
  const cwd = await initFixture("licenses-names");

  expect(getLicensePath(path.join(cwd, "packages", "package-2"))).resolves.toBe("licence");
});

test("doesn't mind upper or lower case", async () => {
  const cwd = await initFixture("licenses-names");

  expect(getLicensePath(path.join(cwd, "packages", "package-3"))).resolves.toBe("LiCeNSe");
});

test("resolves to null if there is no license file", async () => {
  const cwd = await initFixture("licenses-names");

  expect(getLicensePath(path.join(cwd, "packages", "package-4"))).resolves.toBeNull();
});

test("resolves to the first license file, alphabetically", async () => {
  const cwd = await initFixture("licenses-names");

  expect(getLicensePath(path.join(cwd, "packages", "package-5"))).resolves.toBe("LICENCE");
});
