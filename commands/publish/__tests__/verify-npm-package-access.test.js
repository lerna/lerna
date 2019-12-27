"use strict";

jest.mock("@evocateur/libnpmaccess");

const access = require("@evocateur/libnpmaccess");
const { getPackages } = require("@lerna/project");
const loggingOutput = require("@lerna-test/logging-output");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const verifyNpmPackageAccess = require("../lib/verify-npm-package-access");

access.lsPackages.mockImplementation(() =>
  Promise.resolve({
    "package-1": "read-write",
    "package-2": "read-write",
  })
);

expect.extend(require("@lerna-test/figgy-pudding-matchers"));

describe("verifyNpmPackageAccess", () => {
  const origConsoleError = console.error;

  let cwd;

  beforeAll(async () => {
    cwd = await initFixture("lifecycle");
  });

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  test("validates that all packages have read-write permission", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map().set("registry", "https://registry.npmjs.org/");

    await verifyNpmPackageAccess(packages, "lerna-test", opts);

    expect(access.lsPackages).toHaveBeenLastCalledWith(
      "lerna-test",
      expect.figgyPudding({
        registry: "https://registry.npmjs.org/",
        "fetch-retries": 0,
      })
    );
  });

  test("allows unpublished packages to pass", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map().set("registry", "https://registry.npmjs.org/");

    access.lsPackages.mockImplementationOnce(() =>
      Promise.resolve({
        "package-1": "read-write",
        // unpublished packages don't show up in ls-packages
        // "package-2": "read-write",
      })
    );

    await verifyNpmPackageAccess(packages, "lerna-test", opts);

    expect(access.lsPackages).toHaveBeenCalled();
  });

  test("allows null result to pass with warning", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map().set("registry", "https://registry.npmjs.org/");

    access.lsPackages.mockImplementationOnce(() =>
      // access.lsPackages() returns null when _no_ results returned
      Promise.resolve(null)
    );

    await verifyNpmPackageAccess(packages, "lerna-test", opts);

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toBe(
      "The logged-in user does not have any previously-published packages, skipping permission checks..."
    );
  });

  test("throws EACCESS when any package does not have read-write permission", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map().set("registry", "https://registry.npmjs.org/");

    access.lsPackages.mockImplementationOnce(() =>
      Promise.resolve({
        "package-1": "read-write",
        "package-2": "read-only",
      })
    );

    const result = verifyNpmPackageAccess(packages, "lerna-test", opts);
    await expect(result).rejects.toThrow(`You do not have write permission required to publish "package-2"`);
    expect(console.error).not.toHaveBeenCalled();
  });

  test("passes when npm Enterprise registry returns E500", async () => {
    const packages = await getPackages(cwd);
    const registry = "http://outdated-npm-enterprise.mycompany.com:12345/";
    const opts = new Map().set("registry", registry);

    access.lsPackages.mockImplementationOnce(() => {
      const err = new Error("npm-enterprise-what");
      err.code = "E500";
      return Promise.reject(err);
    });

    await verifyNpmPackageAccess(packages, "lerna-test", opts);

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toMatch(
      `Registry "${registry}" does not support \`npm access ls-packages\`, skipping permission checks...`
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  test("passes when Artifactory registry returns E404", async () => {
    const packages = await getPackages(cwd);
    const registry = "https://artifactory-partial-implementation.corpnet.mycompany.com/";
    const opts = new Map().set("registry", registry);

    access.lsPackages.mockImplementationOnce(() => {
      const err = new Error("artifactory-why");
      err.code = "E404";
      return Promise.reject(err);
    });

    await verifyNpmPackageAccess(packages, "lerna-test", opts);

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toMatch(
      `Registry "${registry}" does not support \`npm access ls-packages\`, skipping permission checks...`
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  test("logs unexpected failure message before throwing EWHOAMI", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map();

    access.lsPackages.mockImplementationOnce(() => {
      const err = new Error("gonna-need-a-bigger-boat");

      return Promise.reject(err);
    });

    const result = verifyNpmPackageAccess(packages, "lerna-test", opts);
    await expect(result).rejects.toThrow("Authentication error. Use `npm whoami` to troubleshoot.");
    expect(console.error).toHaveBeenCalledWith("gonna-need-a-bigger-boat");
  });
});
