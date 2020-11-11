"use strict";

const figgyPudding = require("figgy-pudding");
const prompt = require("@lerna/prompt");
const log = require("@lerna/output");

const OtpPleaseConfig = figgyPudding({
  otp: {},
  otpRateLimitDelay: { default: -1 },
});

// basic single-entry semaphore
const semaphore = {
  wait() {
    return new Promise(resolve => {
      if (!this._promise) {
        // not waiting, block other callers until 'release' is called.
        this._promise = new Promise(release => {
          this._resolve = release;
        });
        resolve();
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

module.exports = otplease;
module.exports.getOneTimePassword = getOneTimePassword;

function otplease(fn, _opts, otpCache) {
  // NOTE: do not use 'otpCache' as a figgy-pudding provider directly as the
  // otp value could change between async wait points.
  const opts = OtpPleaseConfig(Object.assign({}, otpCache), _opts);
  return attempt(fn, opts, otpCache);
}

function requiresOtp(err) {
  return err.code === "E401" && /one-time pass/.test(err.body);
}

function requiresWaitingAsOtpIsRateLimited(err) {
  return err.code === "E429" && err.message && /rate limited otp/.test(err.message);
}

function delayAsStr(delay) {
  if (delay < 2000) {
    return `${delay} ms`;
  }
  const delayAsSeconds = Math.round(delay / 1000);
  if (delayAsSeconds < 90) {
    return `${delayAsSeconds} seconds`;
  }
  return `${Math.round(delayAsSeconds / 60)} minutes`;
}

function attempt(fn, opts, otpCache) {
  return new Promise(resolve => {
    resolve(fn(opts));
  }).catch(err => {
    const rateLimitedOtp = opts.otp && opts.otpRateLimitDelay > 0 && requiresWaitingAsOtpIsRateLimited(err);
    if (err.code !== "EOTP" && !(rateLimitedOtp || requiresOtp(err))) {
      throw err;
    } else if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw err;
    } else {
      // check the cache in case a concurrent caller has already updated the otp.
      if (otpCache != null && otpCache.otp != null && otpCache.otp !== opts.otp) {
        return attempt(fn, opts.concat(otpCache), otpCache);
      }
      // only allow one getOneTimePassword attempt at a time to reuse the value
      // from the preceeding prompt
      return semaphore.wait().then(() => {
        // check the cache again in case a previous waiter already updated it.
        if (otpCache != null && otpCache.otp != null && otpCache.otp !== opts.otp) {
          semaphore.release();
          return attempt(fn, opts.concat({ otp: otpCache.otp }), otpCache);
        }
        let basePromise = Promise.resolve();
        let promptForPassword = () => getOneTimePassword();
        if (rateLimitedOtp) {
          basePromise = new Promise(resolve => {
            const delay = opts.otpRateLimitDelay;
            log(`Waiting for ${delayAsStr(delay)} before resuming...`);
            setTimeout(resolve, delay);
          });
          promptForPassword = () => getOneTimePassword("This operation requires another one-time password:");
        }
        return basePromise
          .then(promptForPassword)
          .then(
            otp => {
              // update the otp and release the lock so that waiting
              // callers can see the updated otp.
              if (otpCache != null) {
                // eslint-disable-next-line no-param-reassign
                otpCache.otp = otp;
              }
              semaphore.release();
              return otp;
            },
            promptError => {
              // release the lock and reject the promise.
              semaphore.release();
              return Promise.reject(promptError);
            }
          )
          .then(otp => {
            return fn(opts.concat({ otp }));
          });
      });
    }
  });
}

function getOneTimePassword(message = "This operation requires a one-time password:") {
  // Logic taken from npm internals: https://git.io/fNoMe
  return prompt.input(message, {
    filter: otp => otp.replace(/\s+/g, ""),
    validate: otp =>
      (otp && /^[\d ]+$|^[A-Fa-f0-9]{64,64}$/.test(otp)) ||
      "Must be a valid one-time-password. " +
        "See https://docs.npmjs.com/getting-started/using-two-factor-authentication",
  });
}
