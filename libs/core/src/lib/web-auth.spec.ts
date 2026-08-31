vi.mock("npm-registry-fetch");
vi.mock("@lerna/child-process");

// mocked modules
import * as childProcess from "@lerna/child-process";
import fetch from "npm-registry-fetch";

// file under test
import { getWebAuthChallenge, getWebAuthOneTimePassword } from "./web-auth";

const mockedFetch = vi.mocked(fetch);
const mockedExec = vi.mocked(childProcess.exec);

function response(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return {
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  } as unknown as Awaited<ReturnType<typeof fetch>>;
}

describe("web-auth", () => {
  beforeEach(() => {
    mockedExec.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getWebAuthChallenge()", () => {
    const authUrl = "https://www.npmjs.com/auth/cli/abc123";
    const doneUrl = "https://registry.npmjs.org/-/v1/done?sessionId=abc123";

    it("returns the challenge from an EOTP error body", () => {
      const err = Object.assign(new Error("OTP required for authentication"), {
        code: "EOTP",
        body: { authUrl, doneUrl },
      });

      expect(getWebAuthChallenge(err)).toEqual({ authUrl, doneUrl });
    });

    it("returns undefined for classic EOTP errors without a challenge", () => {
      expect(getWebAuthChallenge(Object.assign(new Error("otp"), { code: "EOTP" }))).toBeUndefined();
      expect(
        getWebAuthChallenge(Object.assign(new Error("otp"), { code: "EOTP", body: {} }))
      ).toBeUndefined();
      expect(
        getWebAuthChallenge(Object.assign(new Error("otp"), { code: "EOTP", body: { authUrl } }))
      ).toBeUndefined();
    });

    it("returns undefined when the body is not an object", () => {
      const err = Object.assign(new Error("otp"), {
        code: "EOTP",
        body: "this operation requires a one-time pass",
      });

      expect(getWebAuthChallenge(err)).toBeUndefined();
    });

    it("returns undefined for non-EOTP errors", () => {
      const err = Object.assign(new Error("not found"), { code: "E404", body: { authUrl, doneUrl } });

      expect(getWebAuthChallenge(err)).toBeUndefined();
    });

    it("returns undefined for non-http(s) urls", () => {
      expect(
        getWebAuthChallenge({ code: "EOTP", body: { authUrl: "javascript:alert(1)", doneUrl } })
      ).toBeUndefined();
      expect(getWebAuthChallenge({ code: "EOTP", body: { authUrl, doneUrl: "not a url" } })).toBeUndefined();
    });

    it("tolerates nullish input", () => {
      expect(getWebAuthChallenge(undefined)).toBeUndefined();
      expect(getWebAuthChallenge(null)).toBeUndefined();
    });
  });

  describe("getWebAuthOneTimePassword()", () => {
    const platform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, "platform", { value: platform });
    });

    const challenge = {
      authUrl: "https://www.npmjs.com/auth/cli/abc123",
      doneUrl: "https://registry.npmjs.org/-/v1/done?sessionId=abc123",
    };
    const opts = { registry: "https://registry.npmjs.org/", "//registry.npmjs.org/:_authToken": "token" };

    it("opens the auth url and polls the done url until a token is returned", async () => {
      mockedFetch
        .mockResolvedValueOnce(response(202, undefined, { "retry-after": "0.001" }))
        .mockResolvedValueOnce(response(202, undefined, { "retry-after": "0.001" }))
        .mockResolvedValueOnce(response(200, { token: "web-otp-token" }));

      const result = await getWebAuthOneTimePassword(challenge, opts);

      expect(result).toBe("web-otp-token");
      expect(mockedExec).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenCalledTimes(3);
      expect(mockedFetch).toHaveBeenCalledWith(
        challenge.doneUrl,
        expect.objectContaining({ ...opts, method: "GET", cache: false })
      );
    });

    it("waits for the retry-after header between polls", async () => {
      vi.useFakeTimers();
      try {
        mockedFetch
          .mockResolvedValueOnce(response(202, undefined, { "retry-after": "5" }))
          .mockResolvedValueOnce(response(200, { token: "web-otp-token" }));

        const pending = getWebAuthOneTimePassword(challenge, opts);

        // first poll happens immediately, second must wait 5s
        await vi.advanceTimersByTimeAsync(4999);
        expect(mockedFetch).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        expect(mockedFetch).toHaveBeenCalledTimes(2);

        await expect(pending).resolves.toBe("web-otp-token");
      } finally {
        vi.useRealTimers();
      }
    });

    it.each([
      ["darwin", "open", [challenge.authUrl], undefined],
      ["linux", "xdg-open", [challenge.authUrl], undefined],
      ["win32", "start", ['""', `"${challenge.authUrl}"`], { shell: true }],
    ])("opens the auth url with the platform default on %s", async (os, command, args, execOpts) => {
      Object.defineProperty(process, "platform", { value: os });
      mockedFetch.mockResolvedValueOnce(response(200, { token: "web-otp-token" }));

      await getWebAuthOneTimePassword(challenge, opts);

      expect(mockedExec).toHaveBeenCalledWith(command, args, ...(execOpts ? [execOpts] : []));
    });

    it("does not open a browser when the npm 'browser' config is false", async () => {
      mockedFetch.mockResolvedValueOnce(response(200, { token: "web-otp-token" }));

      await expect(getWebAuthOneTimePassword(challenge, { ...opts, browser: false })).resolves.toBe(
        "web-otp-token"
      );
      expect(mockedExec).not.toHaveBeenCalled();
    });

    it("uses the npm 'browser' config as the opener command when it is a string", async () => {
      mockedFetch.mockResolvedValueOnce(response(200, { token: "web-otp-token" }));

      await getWebAuthOneTimePassword(challenge, { ...opts, browser: "firefox" });

      expect(mockedExec).toHaveBeenCalledWith("firefox", [challenge.authUrl]);
    });

    it("still resolves when the browser cannot be opened", async () => {
      mockedExec.mockRejectedValue(Object.assign(new Error("spawn failed"), { exitCode: 127 }));
      mockedFetch.mockResolvedValueOnce(response(200, { token: "web-otp-token" }));

      await expect(getWebAuthOneTimePassword(challenge, opts)).resolves.toBe("web-otp-token");
    });

    it("rejects when a 200 response does not contain a token", async () => {
      mockedFetch.mockResolvedValueOnce(response(200, { nope: true }));

      await expect(getWebAuthOneTimePassword(challenge, opts)).rejects.toThrow("expected a token");
    });

    it("rejects on an unexpected status", async () => {
      mockedFetch.mockResolvedValueOnce(response(204));

      await expect(getWebAuthOneTimePassword(challenge, opts)).rejects.toThrow("unexpected status 204");
    });

    it("propagates fetch errors", async () => {
      mockedFetch.mockRejectedValueOnce(Object.assign(new Error("boom"), { code: "E500" }));

      await expect(getWebAuthOneTimePassword(challenge, opts)).rejects.toThrow("boom");
    });
  });
});
