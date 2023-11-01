import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "info",
  describe: "Prints debugging information about the local environment",
  async handler(argv) {
    return (await import(".")).factory(argv);
  },
};

export = command;
