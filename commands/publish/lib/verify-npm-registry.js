"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");
const ValidationError = require("@lerna/validation-error");

module.exports = verifyNpmRegistry;

function verifyNpmRegistry(location, { registry }) {
  log.silly("verifyNpmRegistry");

  if (registry && registry !== "https://registry.npmjs.org/") {
    log.warn(
      "ETHIRDPARTY",
      `Skipping ping of ${registry} as most third-party registries do not support advanced npm functionality`
    );

    return Promise.resolve();
  }

  const args = [
    "ping",
    // immediate feedback from request errors, not excruciatingly slow retries
    // @see https://docs.npmjs.com/misc/config#fetch-retries
    "--fetch-retries=0",
    // including http requests makes raw logging easier to debug for end users
    "--loglevel=http",
  ];
  const opts = getExecOpts({ location }, registry);

  // we do not need special log handling
  delete opts.pkg;

  return childProcess.exec("npm", args, opts).catch(({ stderr }) => {
    // Log the error cleanly to stderr, it already has npmlog decorations
    log.pause();
    console.error(stderr); // eslint-disable-line no-console
    log.resume();

    throw new ValidationError("EREGISTRY", "Connection to npm registry failed");
  });
}
