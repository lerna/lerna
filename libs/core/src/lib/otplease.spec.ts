// TODO: refactor to address type issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

jest.mock("./prompt");

// mocked modules
import { promptTextInput } from "./prompt";

// file under test
import { otplease, getOneTimePassword } from "./otplease";

// global mock setup
promptTextInput.mockResolvedValue("123456");

describe("otplease", () => {
  const stdinIsTTY = process.stdin.isTTY;
  const stdoutIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    process.stdin.isTTY = true;
    process.stdout.isTTY = true;
  });

  afterEach(() => {
    process.stdin.isTTY = stdinIsTTY;
    process.stdout.isTTY = stdoutIsTTY;
  });

  it("no error", async () => {
    const obj = {};
    const fn = jest.fn(() => obj);
    const result = await otplease(fn, {});

    expect(fn).toHaveBeenCalled();
    expect(promptTextInput).not.toHaveBeenCalled();
    expect(result).toBe(obj);
  });

  it("request otp", async () => {
    const obj = {};
    const fn = jest.fn(makeTestCallback("123456", obj));
    const result = await otplease(fn, {});

    expect(fn).toHaveBeenCalledTimes(2);
    expect(promptTextInput).toHaveBeenCalled();
    expect(result).toBe(obj);
  });

  it("request otp updates cache", async () => {
    const otpCache = { otp: undefined };
    const obj = {};
    const fn = jest.fn(makeTestCallback("123456", obj));

    const result = await otplease(fn, {}, otpCache);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(promptTextInput).toHaveBeenCalled();
    expect(result).toBe(obj);
    expect(otpCache.otp).toBe("123456");
  });

  it("uses cache if opts does not have own otp", async () => {
    const otpCache = { otp: "654321" };
    const obj = {};
    const fn = jest.fn(makeTestCallback("654321", obj));
    const result = await otplease(fn, {}, otpCache);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(promptTextInput).not.toHaveBeenCalled();
    expect(result).toBe(obj);
    expect(otpCache.otp).toBe("654321");
  });

  it("uses explicit otp regardless of cache value", async () => {
    const otpCache = { otp: "654321" };
    const obj = {};
    const fn = jest.fn(makeTestCallback("987654", obj));
    const result = await otplease(fn, { otp: "987654" }, otpCache);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(promptTextInput).not.toHaveBeenCalled();
    expect(result).toBe(obj);
    // do not replace cache
    expect(otpCache.otp).toBe("654321");
  });

  it("using cache updated in a different task", async () => {
    const otpCache = { otp: undefined };
    const obj = {};
    const fn = jest.fn(makeTestCallback("654321", obj));

    // enqueue a promise resolution to update the otp at the start of the next turn.
    Promise.resolve().then(() => {
      otpCache.otp = "654321";
    });

    // start initial otplease call, 'catch' will happen in next turn *after* the cache is set.
    const result = await otplease(fn, {}, otpCache);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(promptTextInput).not.toHaveBeenCalled();
    expect(result).toBe(obj);
  });

  it("semaphore prevents overlapping requests for OTP", async () => {
    const otpCache = { otp: undefined };

    // overlapped calls to otplease that share an otpCache should
    // result in the user only being prompted *once* for an OTP.
    const obj1 = {};
    const fn1 = jest.fn(makeTestCallback("123456", obj1));
    const p1 = otplease(fn1, {}, otpCache);

    const obj2 = {};
    const fn2 = jest.fn(makeTestCallback("123456", obj2));
    const p2 = otplease(fn2, {}, otpCache);

    const [res1, res2] = await Promise.all([p1, p2]);

    expect(fn1).toHaveBeenCalledTimes(2);
    expect(fn2).toHaveBeenCalledTimes(2);
    // only prompt once for the two concurrent requests
    expect(promptTextInput).toHaveBeenCalledTimes(1);
    expect(res1).toBe(obj1);
    expect(res2).toBe(obj2);
  });

  it("strips whitespace from OTP prompt value", async () => {
    promptTextInput.mockImplementationOnce((msg, opts) => Promise.resolve(opts.filter(" 121212 ")));

    const obj = {};
    const fn = jest.fn(makeTestCallback("121212", obj));
    const result = await otplease(fn, {});

    expect(result).toBe(obj);
  });

  it("validates OTP prompt response", async () => {
    promptTextInput.mockImplementationOnce((msg, opts) =>
      Promise.resolve(opts.validate("i am the very model of a modern major general"))
    );

    const obj = {};
    const fn = jest.fn(makeTestCallback("343434", obj));

    await expect(otplease(fn, {})).rejects.toThrow("Must be a valid one-time-password");
  });

  it("rejects prompt errors", async () => {
    promptTextInput.mockImplementationOnce(() => Promise.reject(new Error("poopypants")));

    const obj = {};
    const fn = jest.fn(makeTestCallback("343434", obj));

    await expect(otplease(fn, {})).rejects.toThrow("poopypants");
  });

  it("re-throws non-EOTP errors", async () => {
    const fn = jest.fn(() => {
      const err = new Error("not found");
      err.code = "E404";
      throw err;
    });

    await expect(otplease(fn, {})).rejects.toThrow("not found");
  });

  it("re-throws E401 errors that do not contain 'one-time pass' in the body", async () => {
    const fn = jest.fn(() => {
      const err = new Error("auth required");
      err.body = "random arbitrary noise";
      err.code = "E401";
      throw err;
    });

    await expect(otplease(fn, {})).rejects.toThrow("auth required");
  });

  it.each([["stdin"], ["stdout"]])("re-throws EOTP error when %s is not a TTY", async (pipe) => {
    const fn = jest.fn(() => {
      const err = new Error(`non-interactive ${pipe}`);
      err.code = "EOTP";
      throw err;
    });

    process[pipe].isTTY = false;

    await expect(otplease(fn)).rejects.toThrow(`non-interactive ${pipe}`);
  });

  describe("getOneTimePassword()", () => {
    it("defaults message argument", async () => {
      await getOneTimePassword();

      expect(promptTextInput).toHaveBeenCalledWith(
        "This operation requires a one-time password:",
        expect.any(Object)
      );
    });

    it("accepts custom message", async () => {
      await getOneTimePassword("foo bar");

      expect(promptTextInput).toHaveBeenCalledWith("foo bar", expect.any(Object));
    });
  });
});

function makeTestCallback(otp: string, result: any) {
  return (opts: { otp: string }) => {
    if (opts.otp !== otp) {
      const err = new Error(`oops, received otp ${opts.otp}`);
      err.code = "EOTP";
      throw err;
    }
    return result;
  };
}
