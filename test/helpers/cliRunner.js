"use strict";

const log = require("npmlog");
const cli = require("../../src/cli");

jest.mock("is-ci", () => true);

// silence logs
log.level = "silent";

module.exports = runner;

function runner(cwd) {
  // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
  const instance = cli([], cwd)
    .exitProcess(false)
    .detectLocale(false)
    .showHelpOnFail(false)
    .wrap(null);

  return (...argv) =>
    new Promise((resolve, reject) => {
      const yargsMeta = {};

      const context = {
        cwd,
        onResolved: result => {
          Object.assign(result, yargsMeta);
          resolve(result);
        },
        onRejected: result => {
          Object.assign(result, yargsMeta);
          // tests expect errors thrown to indicate failure,
          // _not_ just non-zero exitCode
          reject(result);
        },
      };

      const parseFn = (yargsError, parsedArgv, yargsOutput) => {
        // this is synchronous, before the async handlers resolve
        Object.assign(yargsMeta, { parsedArgv, yargsOutput });
      };

      // workaround wonky yargs-parser configuration not being read during tests
      // hackDoubleDash(args, context);

      instance
        .fail((msg, err) => {
          // since yargs 10.1.0, this is the only way to catch handler rejection
          // _and_ yargs validation exceptions when using async command handlers
          const actual = err || new Error(msg);
          // backfill exitCode for test convenience
          yargsMeta.exitCode = "exitCode" in actual ? actual.exitCode : 1;
          context.onRejected(actual);
        })
        .parse(argv, context, parseFn);
    });
}
