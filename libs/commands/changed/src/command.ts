import { listableOptions } from "@lerna/core";
import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "changed",
  aliases: ["updated"],
  describe: "List local packages that have changed since the last tagged release",
  builder(yargs) {
    const opts = {
      // only the relevant bits from `lerna version`
      "conventional-commits": {
        // fallback for overzealous --conventional-graduate
        hidden: true,
        type: "boolean",
      },
      "conventional-graduate": {
        describe: "Detect currently prereleased packages that would change to a non-prerelease version.",
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      "force-conventional-graduate": {
        describe:
          "Always include all packages by specified by --conventional-graduate whether or not they are a prerelease or have changes since the previous version.",
        type: "boolean",
      },
      "force-publish": {
        describe: "Always include targeted packages when detecting changed packages, skipping default logic.",
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      "ignore-changes": {
        describe: [
          "Ignore changes in files matched by glob(s) when detecting changed packages.",
          "Pass --no-ignore-changes to completely disable.",
        ].join("\n"),
        type: "array",
      },
      "include-merged-tags": {
        describe: "Include tags from merged branches when detecting changed packages.",
        type: "boolean",
      },
    };

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    yargs.options(opts).group(Object.keys(opts), "Command Options:");

    return listableOptions(yargs, "Output Options:");
  },
  async handler(argv) {
    return (await import(".")).factory(argv);
  },
};

export = command;
