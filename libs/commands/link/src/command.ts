import type { CommandModule } from "yargs";

function handler(argv: any) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(".")(argv);
}

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "link",
  describe: "Symlink together all packages that are dependencies of each other",
  builder(yargs) {
    yargs.options({
      "force-local": {
        group: "Command Options:",
        describe: "Force local sibling links regardless of version range match",
        type: "boolean",
      },
      contents: {
        group: "Command Options:",
        describe: "Subdirectory to use as the source of the symlink. Must apply to ALL packages.",
        type: "string",
        defaultDescription: ".",
      },
    });

    return yargs.command(
      "convert",
      "Replace local sibling version ranges with relative file: specifiers",
      () => {},
      handler
    );
  },
  handler,
};

module.exports = command;
