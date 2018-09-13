"use strict";

jest.mock("libnpmaccess");

const access = require("libnpmaccess");
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
    const opts = new Map([["username", "lerna-test"], ["registry", "https://registry.npmjs.org/"]]);

    await verifyNpmPackageAccess(packages, opts);

    expect(access.lsPackages).lastCalledWith("lerna-test", opts);
  });

  test("allows unpublished packages to pass", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map([["username", "lerna-test"], ["registry", "https://registry.npmjs.org/"]]);

    access.lsPackages.mockImplementationOnce(() =>
      Promise.resolve({
        "package-1": "read-write",
        // unpublished packages don't show up in ls-packages
        // "package-2": "read-write",
      })
    );

    await verifyNpmPackageAccess(packages, opts);

    expect(access.lsPackages).toBeCalled();
  });

  test("allows null result to pass with warning", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map([["username", "lerna-test"], ["registry", "https://registry.npmjs.org/"]]);

    access.lsPackages.mockImplementationOnce(() =>
      // access.lsPackages() returns null when _no_ results returned
      Promise.resolve(null)
    );

    await verifyNpmPackageAccess(packages, opts);

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toBe(
      "The logged-in user does not have any previously-published packages, skipping permission checks..."
    );
  });

  test("throws EACCESS when any package does not have read-write permission", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map([["username", "lerna-test"], ["registry", "https://registry.npmjs.org/"]]);

    access.lsPackages.mockImplementationOnce(() =>
      Promise.resolve({
        "package-1": "read-write",
        "package-2": "read-only",
      })
    );

    try {
      await verifyNpmPackageAccess(packages, opts);
    } catch (err) {
      expect(err.prefix).toBe("EACCESS");
      expect(err.message).toBe(`You do not have write permission required to publish "package-2"`);
      expect(console.error).not.toBeCalled();
    }

    expect.assertions(3);
  });

  test("passes when npm Enterprise registry returns E500", async () => {
    const packages = await getPackages(cwd);
    const registry = "http://outdated-npm-enterprise.mycompany.com:12345/";
    const opts = new Map([["username", "lerna-test"], ["registry", registry]]);

    access.lsPackages.mockImplementationOnce(() => {
      const err = new Error("npm-enterprise-what");
      err.code = "E500";
      return Promise.reject(err);
    });

    await verifyNpmPackageAccess(packages, opts);

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toMatch(
      `Registry "${registry}" does not support \`npm access ls-packages\`, skipping permission checks...`
    );
    expect(console.error).not.toBeCalled();
  });

  test("passes when Artifactory registry returns E404", async () => {
    const packages = await getPackages(cwd);
    const registry = "https://artifactory-partial-implementation.corpnet.mycompany.com/";
    const opts = new Map([["username", "lerna-test"], ["registry", registry]]);

    access.lsPackages.mockImplementationOnce(() => {
      const err = new Error("artifactory-why");
      err.code = "E404";
      return Promise.reject(err);
    });

    await verifyNpmPackageAccess(packages, opts);

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toMatch(
      `Registry "${registry}" does not support \`npm access ls-packages\`, skipping permission checks...`
    );
    expect(console.error).not.toBeCalled();
  });

  test("logs unexpected failure message before throwing EWHOAMI", async () => {
    const packages = await getPackages(cwd);
    const opts = new Map([["username", "lerna-test"]]);

    access.lsPackages.mockImplementationOnce(() => {
      const err = new Error("gonna-need-a-bigger-boat");

      return Promise.reject(err);
    });

    try {
      await verifyNpmPackageAccess(packages, opts);
    } catch (err) {
      expect(err.prefix).toBe("EWHOAMI");
      expect(err.message).toBe("Authentication error. Use `npm whoami` to troubleshoot.");
      expect(console.error).toBeCalledWith("gonna-need-a-bigger-boat");
    }

    expect.assertions(3);
  });
});
