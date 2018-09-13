"use strict";

jest.mock("npm-registry-fetch");

const fetch = require("npm-registry-fetch");
const getNpmUsername = require("../lib/get-npm-username");

fetch.json.mockImplementation(() => Promise.resolve({ username: "lerna-test" }));

describe("getNpmUsername", () => {
  const origConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  test("fetches whoami endpoint", async () => {
    const opts = { such: "npm-conf", wow: true };

    const username = await getNpmUsername(opts);

    expect(username).toBe("lerna-test");
    expect(fetch.json).lastCalledWith("-/whoami", opts);
  });

  test("throws an error when successful fetch yields empty username", async () => {
    fetch.json.mockImplementationOnce(() => Promise.resolve({ username: undefined }));

    try {
      await getNpmUsername({ stub: true });
    } catch (err) {
      expect(err.prefix).toBe("ENEEDAUTH");
      expect(err.message).toBe("You must be logged in to publish packages. Use `npm login` and try again.");
      expect(console.error).not.toBeCalled();
    }

    expect.assertions(3);
  });

  test("logs failure message before throwing validation error", async () => {
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("whoops");

      err.code = "E500";

      return Promise.reject(err);
    });

    try {
      await getNpmUsername({ stub: true });
    } catch (err) {
      expect(err.prefix).toBe("EWHOAMI");
      expect(err.message).toBe("Authentication error. Use `npm whoami` to troubleshoot.");
      expect(console.error).toBeCalledWith("whoops");
    }

    expect.assertions(3);
  });
});
