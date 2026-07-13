import { filterOptions } from "@lerna/core";
import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/main/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "clean",
  describe: "Remove the node_modules directory from all packages",
  builder(yargs) {
    yargs.options({
      y: {
        group: "Command Options:",
        describe: "Skip all confirmation prompts",
        alias: "yes",
        type: "boolean",
      },
    });

    return filterOptions(yargs);
  },
  async handler(argv) {
    const cmd: any = await import(".");
    return (cmd.default ?? cmd)(argv);
  },
};

export = command;
