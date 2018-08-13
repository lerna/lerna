"use strict";

jest.mock("@lerna/child-process");

const childProcess = require("@lerna/child-process");
const { getPackages } = require("@lerna/project");
const loggingOutput = require("@lerna-test/logging-output");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const verifyNpmPackageAccess = require("../lib/verify-npm-package-access");

childProcess.exec.mockImplementation(() =>
  Promise.resolve({
    stdout: JSON.stringify({
      "package-1": "read-write",
      "package-2": "read-write",
    }),
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

  test("validates all packages have read-write permission", async () => {
    const packages = await getPackages(cwd);
    const registry = undefined;

    await verifyNpmPackageAccess(packages, cwd, { registry });

    expect(childProcess.exec).lastCalledWith(
      "npm",
      ["access", "ls-packages", "--fetch-retries=0", "--loglevel=http"],
      {
        cwd,
        env: {},
      }
    );
  });

  test("allows unpublished packages to pass", async () => {
    const packages = await getPackages(cwd);
    const registry = undefined;

    childProcess.exec.mockImplementation(() =>
      Promise.resolve({
        stdout: JSON.stringify({
          "package-1": "read-write",
          // unpublished packages don't show up in ls-packages
          // "package-2": "read-write",
        }),
      })
    );

    await verifyNpmPackageAccess(packages, cwd, { registry });

    expect(childProcess.exec).toBeCalled();
  });

  test("throws EACCESS when any package does not have read-write permission", async () => {
    const packages = await getPackages(cwd);
    const registry = undefined;

    childProcess.exec.mockImplementation(() =>
      Promise.resolve({
        stdout: JSON.stringify({
          "package-1": "read-write",
          "package-2": "read-only",
        }),
      })
    );

    try {
      await verifyNpmPackageAccess(packages, cwd, { registry });
    } catch (err) {
      expect(err.prefix).toBe("EACCESS");
      expect(err.message).toBe(`You do not have write permission required to publish "package-2"`);
      expect(console.error).not.toBeCalled();
    }

    expect.assertions(3);
  });

  test("passes when third-party registry returns statusCode 500", async () => {
    const packages = await getPackages(cwd);
    const registry = "https://my-own-private-idaho.com/";

    childProcess.exec.mockImplementationOnce(() => {
      const err = new Error("ouchie");
      err.stderr = ["npm ERR! code E500", "npm ERR! connect ECONNREFUSED"].join("\n");
      return Promise.reject(err);
    });

    await verifyNpmPackageAccess(packages, cwd, { registry });

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toMatch(
      `Registry "${registry}" does not support \`npm access ls-packages\`, skipping permission checks...`
    );
  });

  test("re-throws ENEEDAUTH error", async () => {
    const packages = await getPackages(cwd);
    const registry = undefined;

    childProcess.exec.mockImplementationOnce(() => {
      const err = new Error("login-plz");
      err.stderr = "npm ERR! publish ENEEDAUTH";
      return Promise.reject(err);
    });

    try {
      await verifyNpmPackageAccess(packages, cwd, { registry });
    } catch (err) {
      expect(err.prefix).toBe("ENEEDAUTH");
      expect(err.message).toBe("You must be logged in to publish packages. Use `npm login` and try again.");
      expect(console.error).not.toBeCalled();
    }

    expect.assertions(3);
  });

  test("logs failure stderr before throwing EWHOAMI", async () => {
    const packages = await getPackages(cwd);
    const registry = undefined;

    childProcess.exec.mockImplementationOnce(() => {
      const err = new Error("gonna-need-a-bigger-boat");
      err.stderr = "npm ERR! something fishy happened";
      return Promise.reject(err);
    });

    try {
      await verifyNpmPackageAccess(packages, cwd, { registry });
    } catch (err) {
      expect(err.prefix).toBe("EWHOAMI");
      expect(err.message).toBe("Authentication error. Use `npm whoami` to troubleshoot.");
      expect(console.error).toBeCalledWith("npm ERR! something fishy happened");
    }

    expect.assertions(3);
  });
});
