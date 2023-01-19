import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "import <dir>",
  describe: "Import a package into the monorepo with commit history",
  builder(yargs) {
    return yargs
      .positional("dir", { describe: "The path to an external git repository that contains an npm package" })
      .options({
        flatten: {
          group: "Command Options:",
          describe: "Import each merge commit as a single change the merge introduced",
          type: "boolean",
        },
        dest: {
          group: "Command Options:",
          describe: "Import destination directory for the external git repository",
          type: "string",
        },
        "preserve-commit": {
          group: "Command Options:",
          describe: "Preserve original committer in addition to original author",
          type: "boolean",
        },
        y: {
          group: "Command Options:",
          describe: "Skip all confirmation prompts",
          alias: "yes",
          type: "boolean",
        },
      });
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
