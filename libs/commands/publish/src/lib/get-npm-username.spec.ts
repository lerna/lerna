import { loggingOutput } from "@lerna/test-helpers";
import _fetch from "npm-registry-fetch";

jest.mock("npm-registry-fetch");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getNpmUsername } = require("./get-npm-username");

const fetch = jest.mocked(_fetch);

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
      const err = new Error("third-party profile fail") as any;

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
      const err = new Error("legacy npm Enterprise profile fail") as any;

      err.code = "E500";

      return Promise.reject(err);
    });
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("third-party whoami fail") as any;

      err.code = "E404";

      return Promise.reject(err);
    });

    const opts = { registry: "https://registry.npmjs.org/" };

    await expect(getNpmUsername(opts)).rejects.toThrow(
      "Authentication error. Use `npm whoami` to troubleshoot."
    );
    expect(console.error).toHaveBeenCalledWith("third-party whoami fail");
  });

  test("logs failure message when npm returns forbidden response", async () => {
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("npm profile fail due to insufficient permissions") as any;

      err.code = "E403";

      return Promise.reject(err);
    });

    const opts = { registry: "https://registry.npmjs.org/" };

    await expect(getNpmUsername(opts)).rejects.toThrow(
      "Access verification failed. Ensure that your npm access token has both read and write access, or remove the verifyAccess option to skip this verification. Note that npm automation tokens do NOT have read access (https://docs.npmjs.com/creating-and-viewing-access-tokens)."
    );
    expect(console.error).toHaveBeenCalledWith("npm profile fail due to insufficient permissions");
  });

  test("allows third-party registries to fail with a stern warning", async () => {
    fetch.json.mockImplementationOnce(() => {
      const err = new Error("many third-party registries do not support npm whoami") as any;

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
