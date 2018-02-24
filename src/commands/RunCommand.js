"use strict";

const pMap = require("p-map");
const pMapSeries = require("p-map-series");

const Command = require("../Command");
const npmRunScript = require("../utils/npm-run-script");
const batchPackages = require("../utils/batch-packages");
const output = require("../utils/output");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new RunCommand(argv);
};

exports.command = "run <script>";

exports.describe = "Run an npm script in each package that contains that script.";

exports.builder = yargs =>
  yargs
    .example("$0 run build -- --silent", "# `npm run build --silent` in all packages with a build script")
    .options({
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
        default: undefined,
      },
      parallel: {
        group: "Command Options:",
        describe: "Run script in all packages with unlimited concurrency, streaming prefixed output",
        type: "boolean",
        default: undefined,
      },
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to run scripts (npm, yarn, pnpm, ...)",
        type: "string",
        requiresArg: true,
      },
    })
    .positional("script", {
      describe: "The npm script to run. Pass flags to send to the npm client after --",
      type: "string",
    });

class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      parallel: false,
      stream: false,
    });
  }

  initialize() {
    const { script } = this.options;
    this.script = script;
    this.args = this.options["--"] || [];

    if (!script) {
      throw new Error("You must specify which npm script to run.");
    }

    const { parallel, stream, npmClient } = this.options;
    this.npmClient = npmClient || "npm";

    const { filteredPackages } = this;

    if (script === "env") {
      this.packagesWithScript = filteredPackages;
    } else {
      this.packagesWithScript = filteredPackages.filter(pkg => pkg.scripts && pkg.scripts[script]);
    }

    if (!this.packagesWithScript.length) {
      this.logger.warn(`No packages found with the npm script '${script}'`);
    }

    if (parallel || stream) {
      // don't interrupt streaming stdio
      this.logger.disableProgress();
    }

    this.batchedPackages = this.toposort
      ? batchPackages(this.packagesWithScript, this.options.rejectCycles)
      : [this.packagesWithScript];
  }

  execute() {
    let chain = Promise.resolve();

    if (this.options.parallel) {
      chain = chain.then(() => this.runScriptInPackagesParallel());
    } else {
      chain = chain.then(() => this.runScriptInPackagesBatched());
    }

    return chain.then(() => {
      if (this.packagesWithScript.length) {
        this.logger.success("run", `Ran npm script '${this.script}' in packages:`);
        this.logger.success("", this.packagesWithScript.map(pkg => `- ${pkg.name}`).join("\n"));
      }
    });
  }

  runScriptInPackagesBatched() {
    const runner = this.options.stream
      ? this.runScriptInPackageStreaming.bind(this)
      : this.runScriptInPackageCapturing.bind(this);

    pMapSeries(this.batchedPackages, batch =>
      pMap(batch, pkg => runner(pkg), {
        concurrency: this.concurrency,
      })
    );
  }

  runScriptInPackagesParallel() {
    this.logger.info(
      "run",
      "in %d package(s): npm run %s",
      this.packagesWithScript.length,
      [this.script].concat(this.args).join(" ")
    );

    return pMap(this.packagesWithScript, pkg => this.runScriptInPackageStreaming(pkg));
  }

  runScriptInPackageStreaming(pkg) {
    return npmRunScript.stream(this.script, {
      args: this.args,
      npmClient: this.npmClient,
      pkg,
    });
  }

  runScriptInPackageCapturing(pkg) {
    return npmRunScript(this.script, {
      args: this.args,
      npmClient: this.npmClient,
      pkg,
    })
      .then(result => {
        output(result.stdout);
      })
      .catch(err => {
        this.logger.error(this.script, `Errored while running script in '${pkg.name}'`);

        throw err;
      });
  }
}
