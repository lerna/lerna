"use strict";

jest.mock("@lerna/child-process");

const childProcess = require("@lerna/child-process");
const loggingOutput = require("@lerna-test/logging-output");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const verifyNpmRegistry = require("../lib/verify-npm-registry");

childProcess.exec.mockResolvedValue();

describe("verifyNpmRegistry", () => {
  const origConsoleError = console.error;
  let cwd;

  beforeAll(async () => {
    cwd = await initFixture("registries");
  });

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  test("pings public registry", async () => {
    const registry = undefined;

    await verifyNpmRegistry(cwd, { registry });

    expect(childProcess.exec).lastCalledWith("npm", ["ping", "--fetch-retries=0", "--loglevel=http"], {
      cwd,
      env: {},
    });
  });

  test("logs failure stderr before throwing validation error", async () => {
    childProcess.exec.mockImplementationOnce(() => {
      const err = new Error("whoops");

      err.stderr = "npm ERR! something happened";

      return Promise.reject(err);
    });

    try {
      await verifyNpmRegistry(cwd, {});
    } catch (err) {
      expect(err.prefix).toBe("EREGISTRY");
      expect(err.message).toBe("Connection to npm registry failed");
      expect(console.error).toBeCalledWith("npm ERR! something happened");
    }

    expect.assertions(3);
  });
});
