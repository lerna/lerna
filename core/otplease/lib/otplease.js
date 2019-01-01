"use strict";

const figgyPudding = require("figgy-pudding");
const pTry = require("p-try");
const prompt = require("@lerna/prompt");

const OtpPleaseConfig = figgyPudding({
  otp: {},
});

module.exports = otplease;

function otplease(_opts, fn) {
  const opts = OtpPleaseConfig(_opts);

  return pTry(() => fn(opts)).catch(err => {
    if (err.code !== "EOTP" && !(err.code === "E401" && /one-time pass/.test(err.body))) {
      throw err;
    } else if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw err;
    } else {
      return getOneTimePassword().then(otp => fn(opts.concat({ otp })));
    }
  });
}

function getOneTimePassword() {
  // Logic taken from npm internals: https://git.io/fNoMe
  return prompt.input("Enter OTP", {
    filter: otp => otp.replace(/\s+/g, ""),
    validate: otp =>
      (otp && /^[\d ]+$|^[A-Fa-f0-9]{64,64}$/.test(otp)) ||
      "Must be a valid one-time-password. " +
        "See https://docs.npmjs.com/getting-started/using-two-factor-authentication",
  });
}
