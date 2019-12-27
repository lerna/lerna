"use strict";

jest.mock("../lib/get-profile-data");

const loggingOutput = require("@lerna-test/logging-output");
const getProfileData = require("../lib/get-profile-data");
const getTwoFactorAuthRequired = require("../lib/get-two-factor-auth-required");

getProfileData.mockImplementation(() => Promise.resolve({ tfa: {} }));

expect.extend(require("@lerna-test/figgy-pudding-matchers"));

describe("getTwoFactorAuthRequired", () => {
  const origConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  it("resolves true if tfa.mode === 'auth-and-writes'", async () => {
    getProfileData.mockResolvedValueOnce({
      tfa: {
        mode: "auth-and-writes",
      },
    });

    const result = await getTwoFactorAuthRequired();
    expect(result).toBe(true);
    expect(getProfileData).toHaveBeenLastCalledWith(expect.figgyPudding({ "fetch-retries": 0 }));
  });

  it("resolves false if tfa.mode !== 'auth-and-writes'", async () => {
    getProfileData.mockResolvedValueOnce({
      tfa: {
        mode: "auth-only",
      },
    });

    const result = await getTwoFactorAuthRequired();
    expect(result).toBe(false);
  });

  it("resolves false if tfa.pending === true", async () => {
    getProfileData.mockResolvedValueOnce({
      tfa: {
        pending: true,
        mode: "ignored",
      },
    });

    const result = await getTwoFactorAuthRequired();
    expect(result).toBe(false);
  });

  it("resolves false after profile 404", async () => {
    getProfileData.mockImplementationOnce(() => {
      const err = new Error("third-party profile fail");

      err.code = "E404";

      return Promise.reject(err);
    });

    const result = await getTwoFactorAuthRequired();

    expect(result).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("resolves false after profile 500", async () => {
    getProfileData.mockImplementationOnce(() => {
      const err = new Error("legacy npm Enterprise profile fail");

      err.code = "E500";

      return Promise.reject(err);
    });

    const opts = new Map([["registry", "such-registry-wow"]]);
    const result = await getTwoFactorAuthRequired(opts);

    expect(result).toBe(false);
    expect(loggingOutput("warn")).toContain(
      `Registry "${opts.get(
        "registry"
      )}" does not support 'npm profile get', skipping two-factor auth check...`
    );
  });

  it("logs unexpected failure message before throwing validation error", async () => {
    getProfileData.mockImplementationOnce(() => {
      const err = new Error("zomg explosions");

      err.code = "E401";

      return Promise.reject(err);
    });

    await expect(getTwoFactorAuthRequired()).rejects.toThrow("Unable to obtain two-factor auth mode");
    expect(console.error).toHaveBeenCalledWith("zomg explosions");
  });
});
