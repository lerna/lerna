import { filterOptions } from "@lerna/core";
import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "watch",
  describe: "Runs a command whenever packages or their dependents change.",
  builder(yargs) {
    yargs
      .parserConfiguration({
        "populate--": true,
        "strip-dashed": true,
      })
      .option("command", { type: "string", hidden: true })
      .option("verbose", {
        type: "boolean",
        description: "Run watch mode in verbose mode, where commands are logged before execution.",
      })
      .middleware((args) => {
        const { "--": doubleDash } = args;
        if (doubleDash && Array.isArray(doubleDash)) {
          // eslint-disable-next-line no-param-reassign
          args.command = doubleDash.join(" ");
        }
      }, true);

    return filterOptions(yargs);
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
