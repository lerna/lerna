import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "diff [pkgName]",
  describe: "Diff all packages or a single package since the last release",
  builder(yargs) {
    return yargs
      .positional("pkgName", {
        describe: "An optional package name to filter the diff output",
      })
      .options({
        "ignore-changes": {
          group: "Command Options:",
          describe: "Ignore changes in files matched by glob(s).",
          type: "array",
        },
      })
      .epilogue(
        "When ignoreChanges is configured in lerna.json, pass --no-ignore-changes to include ignored files."
      );
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
