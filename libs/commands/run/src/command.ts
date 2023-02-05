import { filterOptions } from "@lerna/core";
import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "run <script>",
  describe: "Run an npm script in each package that contains that script",
  builder(yargs) {
    yargs
      .example("$0 run build -- --silent", "# `npm run build --silent` in all packages with a build script")
      .parserConfiguration({
        "populate--": true,
      })
      .positional("script", {
        describe: "The npm script to run. Pass flags to send to the npm client after --",
        type: "string",
        coerce: (script) => {
          // Allow passing multiple scripts to run concurrently by comma-separating them
          if (script.includes(",")) {
            return script
              .split(",")
              .filter(Boolean)
              .map((s: string) => s.trim());
          }
          return script;
        },
      })
      .options({
        "npm-client": {
          group: "Command Options:",
          describe: "Executable used to run scripts (npm, yarn, pnpm, ...).",
          defaultDescription: "npm",
          type: "string",
          requiresArg: true,
        },
        stream: {
          group: "Command Options:",
          describe: "Stream output with lines prefixed by package.",
          type: "boolean",
        },
        parallel: {
          group: "Command Options:",
          describe: "Run script with unlimited concurrency, streaming prefixed output.",
          type: "boolean",
        },
        "no-bail": {
          group: "Command Options:",
          describe: "Continue running script despite non-zero exit in a given package.",
          type: "boolean",
        },
        bail: {
          // proxy for --no-bail
          hidden: true,
          type: "boolean",
        },
        // This option controls prefix for stream output so that it can be disabled to be friendly
        // to tools like Visual Studio Code to highlight the raw results
        "no-prefix": {
          group: "Command Options:",
          describe: "Do not prefix streaming output.",
          type: "boolean",
        },
        prefix: {
          // proxy for --no-prefix
          hidden: true,
          type: "boolean",
        },
        profile: {
          group: "Command Options:",
          describe: "Profile script executions and output performance profile to default location.",
          type: "boolean",
        },
        "profile-location": {
          group: "Command Options:",
          describe: "Output performance profile to custom location instead of default project root.",
          type: "string",
        },
        "skip-nx-cache": {
          hidden: true,
          type: "boolean",
        },
        verbose: {
          group: "Command Options:",
          describe: "When useNx is not false, show verbose output from dependent tasks.",
          type: "boolean",
        },
        "load-env-files": {
          group: "Command Options:",
          describe: "When useNx is not false, automatically load .env files",
          type: "boolean",
        },
      });

    return filterOptions(yargs);
  },
  handler(argv) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(".")(argv);
  },
};

module.exports = command;
