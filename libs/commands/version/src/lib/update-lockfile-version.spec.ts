import { getPackages } from "@lerna/core";
import { initFixtureFactory } from "@lerna/test-helpers";
import fs from "fs-extra";
import _loadJsonFile from "load-json-file";
import path from "path";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("load-json-file", () => require("@lerna/test-helpers/__mocks__/load-json-file"));

// The mocked version isn't the same as the real one
const loadJsonFile = _loadJsonFile as any;

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { updateLockfileVersion } = require("./update-lockfile-version");

test("updateLockfileVersion with lockfile v1", async () => {
  const cwd = await initFixture("lockfile-leaf");
  const [pkg] = await getPackages(cwd);

  pkg.version = "2.0.0";

  const returnedLockfilePath = await updateLockfileVersion(pkg);

  expect(returnedLockfilePath).toBe(path.join(pkg.location, "package-lock.json"));
  expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual(["/packages/package-1"]);
  expect(fs.readJSONSync(returnedLockfilePath)).toHaveProperty("version", "2.0.0");
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

test("updateLockfileVersion with lockfile v2 - local dependency should be updated if already listed", async () => {
  const cwd = await initFixture("lockfile-leaf-v2");
  const [pkg] = await getPackages(cwd);

  pkg.version = "2.0.0";
  pkg.dependencies["package-2"] = "^2.0.0";
  pkg.devDependencies["package-3"] = "3.0.0";

  const returnedLockfilePath = await updateLockfileVersion(pkg);

  expect(returnedLockfilePath).toBe(path.join(pkg.location, "package-lock.json"));
  expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual(["/packages/package-1"]);
  const updatedLockfile = fs.readJSONSync(returnedLockfilePath);
  expect(updatedLockfile).toHaveProperty("version", "2.0.0");
  expect(updatedLockfile).toHaveProperty(["packages", "", "dependencies", "package-2"], "^2.0.0");
  expect(updatedLockfile).toHaveProperty(["packages", "", "dependencies", "tiny-tarball"], "^1.0.0");
  expect(updatedLockfile).toHaveProperty(["packages", "", "devDependencies", "package-3"], "3.0.0");
});

test("updateLockfileVersion with lockfile v2 - local dependency should not be added if not already listed", async () => {
  const cwd = await initFixture("lockfile-v2-missing-local-deps");
  const pkg2 = (await getPackages(cwd))[1];

  pkg2.version = "2.0.0";
  pkg2.dependencies["package-1"] = "^2.0.0";
  pkg2.devDependencies["package-3"] = "^2.0.0";

  const returnedLockfilePath = await updateLockfileVersion(pkg2);

  expect(returnedLockfilePath).toBe(path.join(pkg2.location, "package-lock.json"));
  const updatedLockfile = fs.readJSONSync(returnedLockfilePath);

  expect(updatedLockfile).toHaveProperty("version", "2.0.0");

  expect(updatedLockfile).toHaveProperty(["packages", "", "dependencies", "yargs"], "^6.6.0");
  expect(updatedLockfile).not.toHaveProperty(["packages", "", "dependencies", "package-1"]);

  expect(updatedLockfile).toHaveProperty(["packages", "", "devDependencies", "typescript"], "^4.0.0");
  expect(updatedLockfile).not.toHaveProperty(["packages", "", "devDependencies", "package-3"]);
});

test("updateLockfileVersion with outdated lockfile v2 - should not fail", async () => {
  // the package-lock file for package-2 was not updated when
  // the deps and devDeps were removed from package-2's package.json file.
  const cwd = await initFixture("lockfile-v2-outdated-package-lock");
  const pkg2 = (await getPackages(cwd))[1];

  const returnedLockfilePath = await updateLockfileVersion(pkg2);
  const updatedLockfile = fs.readJSONSync(returnedLockfilePath);

  expect(updatedLockfile.packages[""].dependencies).toEqual({});
  expect(updatedLockfile.packages[""].devDependencies).toEqual({});
});
