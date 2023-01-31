import { promptTextInput } from "./prompt";

export interface OneTimePasswordCache {
  otp: string | null;
}

// basic single-entry semaphore
const semaphore = {
  _promise: undefined as Promise<unknown> | undefined,
  _resolve: undefined as (() => void) | undefined,
  wait() {
    return new Promise((resolve) => {
      if (!this._promise) {
        // not waiting, block other callers until 'release' is called.
        this._promise = new Promise((release: any) => {
          this._resolve = release;
        });
        resolve(undefined);
      } else {
        // wait for 'release' to be called and try to lock the semaphore again.
        resolve(this._promise.then(() => this.wait()));
      }
    });
  },
  release() {
    const resolve = this._resolve;
    // istanbul ignore else
    if (resolve) {
      this._resolve = undefined;
      this._promise = undefined;
      // notify waiters that the semaphore has been released.
      resolve();
    }
  },
};

/**
 * Attempt to execute Promise callback, prompting for OTP if necessary.
 * @template {Record<string, unknown>} T
 * @param {(opts: T) => Promise<unknown>} fn
 * @param {T} _opts The options to be passed to `fn`
 * @param {OneTimePasswordCache} otpCache
 */
export function otplease<T extends Record<string, unknown>>(
  fn: (opts: T) => Promise<unknown>,
  _opts: T,
  otpCache?: OneTimePasswordCache | null
) {
  // always prefer explicit config (if present) to cache
  const opts = { ...otpCache, ..._opts };
  return attempt(fn, opts, otpCache);
}

function attempt<T extends Record<string, unknown>>(
  fn: (opts: T) => Promise<unknown>,
  opts: T,
  otpCache?: { otp: string | null } | null
): Promise<unknown> {
  return new Promise((resolve) => {
    resolve(fn(opts));
  }).catch((err) => {
    if (err.code !== "EOTP" && !(err.code === "E401" && /one-time pass/.test(err.body))) {
      throw err;
    } else if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw err;
    } else {
      // check the cache in case a concurrent caller has already updated the otp.
      if (otpCache != null && otpCache.otp != null && otpCache.otp !== opts["otp"]) {
        return attempt(fn, { ...opts, ...otpCache }, otpCache);
      }
      // only allow one getOneTimePassword attempt at a time to reuse the value
      // from the preceding prompt
      return semaphore.wait().then(() => {
        // check the cache again in case a previous waiter already updated it.
        if (otpCache != null && otpCache.otp != null && otpCache.otp !== opts["otp"]) {
          semaphore.release();
          return attempt(fn, { ...opts, ...otpCache }, otpCache);
        }
        return getOneTimePassword()
          .then(
            (otp) => {
              // update the otp and release the lock so that waiting
              // callers can see the updated otp.
              if (otpCache != null) {
                // eslint-disable-next-line no-param-reassign
                otpCache.otp = otp;
              }
              semaphore.release();
              return otp;
            },
            (promptError) => {
              // release the lock and reject the promise.
              semaphore.release();
              return Promise.reject(promptError);
            }
          )
          .then((otp) => {
            return fn({ ...opts, otp });
          });
      });
    }
  });
}

/**
 * Prompt user for one-time password.
 */
export function getOneTimePassword(
  message = "This operation requires a one-time password:"
): Promise<string> {
  // Logic taken from npm internals: https://github.com/npm/cli/blob/4f801d8a476f7ca52b0f182bf4e17a80db12b4e2/lib/utils/read-user-info.js#L21-L35
  return promptTextInput(message, {
    filter: (otp: string) => otp.replace(/\s+/g, ""),
    validate: (otp: string) =>
      (otp && /^[\d ]+$|^[A-Fa-f0-9]{64,64}$/.test(otp)) ||
      "Must be a valid one-time-password. " +
        "See https://docs.npmjs.com/getting-started/using-two-factor-authentication",
  });
}
