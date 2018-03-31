"use strict";

const path = require("path");
const yargs = require("yargs/yargs");
const globalOptions = require("@lerna/global-options");
const sawmill = require("@lerna-test/sawmill");

module.exports = commandRunner;

/**
 * A higher-order function to help with passing _actual_ yargs-parsed argv
 * into command constructors (instead of artificial direct parameters).
 *
 * @param {Object} commandModule The yargs command exports
 * @return {Function} with partially-applied yargs config
 */
function commandRunner(commandModule) {
  /* eslint-disable import/no-dynamic-require, global-require */
  const cmd = commandModule.command.split(" ")[0];

  // prime the pump so slow-as-molasses CI doesn't fail with delayed require()
  require(path.resolve(require.main.filename, "../.."));

  return cwd => {
    // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
    const cli = yargs([], cwd)
      .strict()
      .exitProcess(false)
      .detectLocale(false)
      .showHelpOnFail(false)
      .wrap(null)
      .command(commandModule);

    globalOptions(cli);

    return (...args) =>
      new Promise((resolve, reject) => {
        const yargsMeta = {};
        const sluice = sawmill();

        const context = {
          cwd,
          lernaVersion: "__TEST_VERSION__",
          onResolved: result => {
            sluice().then(logs => {
              // success resolves the result, if any, returned from execute()
              resolve(Object.assign({ logs }, result, yargsMeta));
            });
          },
          onRejected: result => {
            sluice().then(logs => {
              // result must stay an Error, not arbitrary object
              Object.assign(result, yargsMeta, { logs });

              // tests expect errors thrown to indicate failure,
              // _not_ just non-zero exitCode
              reject(result);
            });
          },
        };

        const parseFn = (yargsError, parsedArgv, yargsOutput) => {
          // this is synchronous, before the async handlers resolve
          Object.assign(yargsMeta, { parsedArgv, yargsOutput });
        };

        cli
          .fail((msg, err) => {
            // since yargs 10.1.0, this is the only way to catch handler rejection
            // _and_ yargs validation exceptions when using async command handlers
            const actual = err || new Error(msg);
            // backfill exitCode for test convenience
            yargsMeta.exitCode = "exitCode" in actual ? actual.exitCode : 1;
            context.onRejected(actual);
          })
          .parse([cmd, ...args], context, parseFn);
      });
  };
}
