"use strict";

const PromptUtilities = require("@lerna/prompt");

module.exports = promptOneTimePassword;

function promptOneTimePassword() {
  // Logic taken from npm internals: https://git.io/fNoMe
  return PromptUtilities.input("Enter OTP", {
    filter: otp => otp.replace(/\s+/g, ""),
    validate: otp =>
      (otp && /^[\d ]+$|^[A-Fa-f0-9]{64,64}$/.test(otp)) ||
      "Must be a valid one-time-password. " +
        "See https://docs.npmjs.com/getting-started/using-two-factor-authentication",
  });
}
