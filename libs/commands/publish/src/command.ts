import log from "npmlog";
import type { CommandModule } from "yargs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const versionCommand = require("@lerna/commands/version/command");

function composeVersionOptions(yargs: any) {
  versionCommand.addBumpPositional(yargs, ["from-git", "from-package"]);
  versionCommand.builder(yargs, "publish");
  return yargs;
}

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "publish [bump]",
  describe: "Publish packages in the current project",
  builder(yargs) {
    const opts = {
      c: {
        describe: "Publish packages after every successful merge using the sha as part of the tag.",
        alias: "canary",
        type: "boolean",
      },
      // preid is copied from ../version/command because a whitelist for one option isn't worth it
      preid: {
        describe: "Specify the prerelease identifier when publishing a prerelease",
        type: "string",
        requiresArg: true,
        defaultDescription: "alpha",
      },
      contents: {
        describe: "Subdirectory to publish. Must apply to ALL packages.",
        type: "string",
        requiresArg: true,
        defaultDescription: ".",
      },
      "dist-tag": {
        describe: "Publish packages with the specified npm dist-tag",
        type: "string",
        requiresArg: true,
      },
      "legacy-auth": {
        describe: "Legacy Base64 Encoded username and password.",
        type: "string",
      },
      "pre-dist-tag": {
        describe: "Publish prerelease packages with the specified npm dist-tag",
        type: "string",
        requiresArg: true,
      },
      "git-head": {
        describe:
          "Explicit SHA to set as gitHead when packing tarballs, only allowed with 'from-package' positional.",
        type: "string",
        requiresArg: true,
      },
      "graph-type": {
        describe: "Type of dependency to use when determining package hierarchy.",
        choices: ["all", "dependencies"],
        defaultDescription: "dependencies",
      },
      "ignore-prepublish": {
        describe: "Disable deprecated 'prepublish' lifecycle script",
        type: "boolean",
      },
      "ignore-scripts": {
        describe: "Disable all lifecycle scripts",
        type: "boolean",
      },
      // TODO: (major) make --no-granular-pathspec the default
      "no-granular-pathspec": {
        describe: "Do not reset changes file-by-file, but globally.",
        type: "boolean",
      },
      "granular-pathspec": {
        // proxy for --no-granular-pathspec
        hidden: true,
        // describe: "Reset changes file-by-file, not globally.",
        type: "boolean",
      },
      otp: {
        describe: "Supply a one-time password for publishing with two-factor authentication.",
        type: "string",
        requiresArg: true,
      },
      registry: {
        describe: "Use the specified registry for all npm client operations.",
        type: "string",
        requiresArg: true,
      },
      "require-scripts": {
        describe: "Execute ./scripts/prepublish.js and ./scripts/postpublish.js, relative to package root.",
        type: "boolean",
      },
      "no-git-reset": {
        describe: "Do not reset changes to working tree after publishing is complete.",
        type: "boolean",
      },
      "git-reset": {
        // proxy for --no-git-reset
        hidden: true,
        type: "boolean",
      },
      "temp-tag": {
        describe: "Create a temporary tag while publishing.",
        type: "boolean",
      },
      "no-verify-access": {
        // proxy for --verify-access
        describe: "Do not verify package read-write access for current npm user.",
        type: "boolean",
      },
      "verify-access": {
        describe: "Verify package read-write access for current npm user.",
        type: "boolean",
      },
      "summary-file": {
        // generate lerna publish json output.
        describe:
          "Generate a json summary report after all packages have been successfully published, you can pass an optional path for where to save the file.",
        type: "string",
      },
      "include-private": {
        describe:
          "Include specified private packages when publishing by temporarily removing the private property from the package manifest. This should only be used for testing private packages that will become public. Private packages should not usually be published. See the npm docs for details (https://docs.npmjs.com/cli/v9/configuring-npm/package-json#private).",
        type: "array",
      },
    };

    composeVersionOptions(yargs);

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    yargs.options(opts);

    // "unhide" duplicate options
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { hiddenOptions } = yargs.getOptions();
    const sharedKeys = ["preid", "y", "ignore-scripts"];

    for (const sharedKey of sharedKeys) {
      hiddenOptions.splice(
        hiddenOptions.findIndex((k: any) => k === sharedKey),
        1
      );
    }

    yargs.group(Object.keys(opts).concat(sharedKeys), "Command Options:");

    return yargs
      .option("npm-tag", {
        // TODO: remove in next major release
        hidden: true,
        conflicts: "dist-tag",
        type: "string",
        requiresArg: true,
      })
      .option("verify-registry", {
        // TODO: remove in next major release
        hidden: true,
        type: "boolean",
      })
      .option("skip-npm", {
        // TODO: remove in next major release
        // deprecation notice handled in initialize()
        hidden: true,
        type: "boolean",
      })
      .check((argv) => {
        /* eslint-disable no-param-reassign */
        if (argv["npmTag"]) {
          argv["distTag"] = argv["npmTag"];
          argv["dist-tag"] = argv["npmTag"];
          delete argv["npmTag"];
          delete argv["npm-tag"];
          log.warn("deprecated", "--npm-tag has been renamed --dist-tag");
        }
        /* eslint-enable no-param-reassign */

        return argv;
      })
      .middleware((args) => {
        const { includePrivate } = args;
        if (includePrivate && Array.isArray(includePrivate)) {
          // eslint-disable-next-line no-param-reassign
          args["includePrivate"] = includePrivate.reduce((acc, pkg) => [...acc, ...pkg.split(/[\s,]/)], []);
        }
      }, true);
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
