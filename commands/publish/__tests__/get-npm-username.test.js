"use strict";

jest.mock("npm-registry-fetch");

const fetch = require("npm-registry-fetch");
const { loggingOutput } = require("@lerna-test/logging-output");
const { getNpmUsername } = require("../lib/get-npm-username");

fetch.json.mockImplementation(() => Promise.resolve({ username: "lerna-test" }));

describe("getNpmUsername", () => {
  const origConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  test("fetches whoami endpoint after profile 404", async () => {
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("third-party profile fail");

      err.code = "E404";

      return Promise.reject(err);
    });
    const opts = { registry: "such-config-wow" };

    const username = await getNpmUsername(opts);

    expect(username).toBe("lerna-test");
    expect(fetch.json).toHaveBeenLastCalledWith("/-/whoami", expect.objectContaining({ fetchRetries: 0 }));
  });

  test("throws an error when successful fetch yields empty username", async () => {
    fetch.json.mockImplementationOnce(() => Promise.resolve({ username: undefined }));

    await expect(getNpmUsername({ stub: true })).rejects.toThrow(
      "You must be logged in to publish packages. Use `npm login` and try again."
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  test("logs failure message before throwing validation error", async () => {
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("legacy npm Enterprise profile fail");

      err.code = "E500";

      return Promise.reject(err);
    });
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("third-party whoami fail");

      err.code = "E404";

      return Promise.reject(err);
    });

    const opts = { registry: "https://registry.npmjs.org/" };

    await expect(getNpmUsername(opts)).rejects.toThrow(
      "Authentication error. Use `npm whoami` to troubleshoot."
    );
    expect(console.error).toHaveBeenCalledWith("third-party whoami fail");
  });

  test("allows third-party registries to fail with a stern warning", async () => {
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("many third-party registries do not support npm whoami");

      err.code = "E401";

      return Promise.reject(err);
    });

    const opts = { registry: "http://my-own-private-idaho.com" };

    const username = await getNpmUsername(opts);

    expect(username).toBeUndefined();
    expect(loggingOutput("warn")).toContain(
      "Unable to determine npm username from third-party registry, this command will likely fail soon!"
    );
  });
});
