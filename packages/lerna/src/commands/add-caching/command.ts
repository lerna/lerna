import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "add-caching",
  describe: "Interactive prompt to generate task runner configuration",
  builder(yargs) {
    return yargs;
  },
  handler(argv) {
    return require(".")(argv);
  },
};

export = command;
