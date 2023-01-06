import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "repair",
  describe: "Runs automated migrations to repair the state of a lerna repo",
  builder(yargs) {
    yargs.options({
      /**
       * equivalent to --loglevel=verbose, but added explicitly here because the repair()
       * output will potentially contain instructions to run with --verbose
       */
      verbose: {
        hidden: true,
        type: "boolean",
      },
    });
    return yargs;
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
