import { filterOptions, listableOptions } from "@lerna/core";
import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "list",
  aliases: ["ls", "la", "ll"],
  describe: "List local packages",
  builder(yargs) {
    listableOptions(yargs);
    return filterOptions(yargs);
  },
  async handler(argv) {
    return (await import(".")).factory(argv);
  },
};

export = command;
