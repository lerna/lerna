"use strict";

const path = require("path");
const lernaCLI = require("@lerna/cli");

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
    const cli = lernaCLI([], cwd)
      .exitProcess(false)
      .detectLocale(false)
      .showHelpOnFail(false)
      .wrap(null)
      .command(commandModule);

    return (...args) =>
      new Promise((resolve, reject) => {
        const yargsMeta = {};

        const context = {
          cwd,
          lernaVersion: "__TEST_VERSION__",
          loglevel: "silent",
          progress: false,
          onResolved: result => {
            // success resolves the result, if any, returned from execute()
            resolve(Object.assign({}, result, yargsMeta));
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
