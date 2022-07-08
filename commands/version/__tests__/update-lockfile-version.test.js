"use strict";

const path = require("path");
const fs = require("fs-extra");

// mocked or stubbed modules
const loadJsonFile = require("load-json-file");

// helpers
const { getPackages } = require("@lerna/project");
const initFixture = require("@lerna-test/helpers").initFixtureFactory(__dirname);

const { updateLockfileVersion } = require("../lib/update-lockfile-version");

test("updateLockfileVersion with lockfile v1", async () => {
  const cwd = await initFixture("lockfile-leaf");
  const [pkg] = await getPackages(cwd);

  pkg.version = "2.0.0";

  const returnedLockfilePath = await updateLockfileVersion(pkg);

  expect(returnedLockfilePath).toBe(path.join(pkg.location, "package-lock.json"));
  expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual(["/packages/package-1"]);
  expect(fs.readJSONSync(returnedLockfilePath)).toHaveProperty("version", "2.0.0");
});

test("updateLockfileVersion with lockfile v2", async () => {
  const cwd = await initFixture("lockfile-leaf-v2");
  const [pkg] = await getPackages(cwd);

  pkg.version = "2.0.0";

  const returnedLockfilePath = await updateLockfileVersion(pkg);

  expect(returnedLockfilePath).toBe(path.join(pkg.location, "package-lock.json"));
  expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual(["/packages/package-1"]);
  const updatedLockfile = fs.readJSONSync(returnedLockfilePath);
  expect(updatedLockfile).toHaveProperty("version", "2.0.0");
  expect(updatedLockfile).toHaveProperty(["packages", "", "version"], "2.0.0");
});

test("updateLockfileVersion without sibling lockfile", async () => {
  const cwd = await initFixture("lifecycle", false);
  const [pkg] = await getPackages(cwd);

  pkg.version = "1.1.0";

  loadJsonFile.mockImplementationOnce(() => Promise.reject(new Error("file not found")));

  const returnedLockfilePath = await updateLockfileVersion(pkg);

  expect(returnedLockfilePath).toBeUndefined();
  expect(fs.pathExistsSync(path.join(pkg.location, "package-lock.json"))).toBe(false);
});
