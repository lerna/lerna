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
    packages: {
      describe:
        "A glob pattern matching packages that should be included (instead of defaulting to the package manager's workspaces config)",
      type: "array",
    },
    dryRun: {
      describe:
        "Preview the changes that will be made to the file system without actually modifying anything",
      type: "boolean",
      default: false,
    },
    skipInstall: {
      describe: "Skip installation of dependencies after initialization",
      type: "boolean",
    },
  },
  async handler(argv) {
    return (await import(".")).factory(argv);
  },
};

export = command;
