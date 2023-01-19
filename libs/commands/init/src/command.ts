import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "init",
  describe: "Create a new Lerna repo or upgrade an existing repo to the current version of Lerna",
  builder: {
    exact: {
      describe: "Specify lerna dependency version in package.json without a caret (^)",
      type: "boolean",
    },
    independent: {
      describe: "Version packages independently",
      alias: "i",
      type: "boolean",
    },
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
