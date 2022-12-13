/* eslint-disable */
"use strict";

const pMap = require("p-map");
const path = require("path");
const { existsSync } = require("fs-extra");

const { Command } = require("@lerna/command");
const { npmRunScript, npmRunScriptStreaming } = require("@lerna/npm-run-script");
const { output } = require("@lerna/output");
const { Profiler, generateProfileOutputPath } = require("@lerna/profiler");
const { timer } = require("@lerna/timer");
const { runTopologically } = require("@lerna/run-topologically");
const { ValidationError } = require("@lerna/validation-error");
const { getFilteredPackages } = require("@lerna/filter-options");
const { performance } = require("perf_hooks");

module.exports = factory;

function factory(argv) {
  return new RunCommand(argv);
}

class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    const { script, npmClient = "npm" } = this.options;

    this.script = script;
    this.args = this.options["--"] || [];
    this.npmClient = npmClient;

    if (!script) {
      throw new ValidationError("ENOSCRIPT", "You must specify a lifecycle script to run");
    }

    // Check this.argv (not this.options) so that we only error in this case when --npm-client is set via the CLI (not via lerna.json which is a legitimate use case for other things)
    if (this.argv.npmClient && this.options.useNx !== false) {
      throw new ValidationError(
        "run",
        "The legacy task runner option `--npm-client` is not currently supported. Please open an issue on https://github.com/lerna/lerna if you require this feature."
      );
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    let chain = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then((filteredPackages) => {
      this.packagesWithScript =
        script === "env"
          ? filteredPackages
          : filteredPackages.filter((pkg) => pkg.scripts && pkg.scripts[script]);
    });

    return chain.then(() => {
      this.count = this.packagesWithScript.length;
      this.packagePlural = this.count === 1 ? "package" : "packages";
      this.joinedCommand = [this.npmClient, "run", this.script].concat(this.args).join(" ");

      if (!this.count) {
        this.logger.success("run", `No packages found with the lifecycle script '${script}'`);

        // still exits zero, aka "ok"
        return false;
      }
    });
  }

  execute() {
    if (this.options.useNx === false) {
      this.logger.info(
        "",
        "Executing command in %d %s: %j",
        this.count,
        this.packagePlural,
        this.joinedCommand
      );
    }

    let chain = Promise.resolve();
    const getElapsed = timer();

    if (this.options.useNx !== false) {
      chain = chain.then(() => this.runScriptsUsingNx());
    } else if (this.options.parallel) {
      chain = chain.then(() => this.runScriptInPackagesParallel());
    } else if (this.toposort) {
      chain = chain.then(() => this.runScriptInPackagesTopological());
    } else {
      chain = chain.then(() => this.runScriptInPackagesLexical());
    }

    if (this.bail) {
      // only the first error is caught
      chain = chain.catch((err) => {
        process.exitCode = err.exitCode;

        // rethrow to halt chain and log properly
        throw err;
      });
    } else {
      // detect error (if any) from collected results
      chain = chain.then((results) => {
        /* istanbul ignore else */
        if (results.some((result) => result.failed)) {
          // propagate "highest" error code, it's probably the most useful
          const codes = results.filter((result) => result.failed).map((result) => result.exitCode);
          const exitCode = Math.max(...codes, 1);

          this.logger.error("", "Received non-zero exit code %d during execution", exitCode);
          process.exitCode = exitCode;
        }
      });
    }

    return chain.then(() => {
      this.logger.success(
        "run",
        "Ran npm script '%s' in %d %s in %ss:",
        this.script,
        this.count,
        this.packagePlural,
        (getElapsed() / 1000).toFixed(1)
      );
      this.logger.success("", this.packagesWithScript.map((pkg) => `- ${pkg.name}`).join("\n"));
    });
  }

  getOpts(pkg) {
    // these options are NOT passed directly to execa, they are composed in npm-run-script
    return {
      args: this.args,
      npmClient: this.npmClient,
      prefix: this.prefix,
      reject: this.bail,
      pkg,
    };
  }

  getRunner() {
    return this.options.stream
      ? (pkg) => this.runScriptInPackageStreaming(pkg)
      : (pkg) => this.runScriptInPackageCapturing(pkg);
  }

  runScriptInPackagesTopological() {
    let profiler;
    let runner;

    if (this.options.profile) {
      profiler = new Profiler({
        concurrency: this.concurrency,
        log: this.logger,
        outputDirectory: this.options.profileLocation,
      });

      const callback = this.getRunner();
      runner = (pkg) => profiler.run(() => callback(pkg), pkg.name);
    } else {
      runner = this.getRunner();
    }

    let chain = runTopologically(this.packagesWithScript, runner, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
    });

    if (profiler) {
      chain = chain.then((results) => profiler.output().then(() => results));
    }

    return chain;
  }

  addQuotesAroundScriptNameIfItHasAColon(scriptName) {
    // Nx requires quotes around script names of the form script:name
    if (scriptName.includes(":")) {
      return `"${scriptName}"`;
    } else {
      return scriptName;
    }
  }

  async runScriptsUsingNx() {
    if (this.options.ci) {
      process.env.CI = "true";
    }
    if (this.options.profile) {
      const absolutePath = generateProfileOutputPath(this.options.profileLocation);
      // Nx requires a workspace relative path for this
      process.env.NX_PROFILE = path.relative(this.project.rootPath, absolutePath);
    }
    performance.mark("init-local");
    this.configureNxOutput();
    const { targetDependencies, options, extraOptions } = await this.prepNxOptions();

    if (this.packagesWithScript.length === 1) {
      const { runOne } = require("nx/src/command-line/run-one");
      const fullQualifiedTarget =
        this.packagesWithScript.map((p) => p.name)[0] +
        ":" +
        this.addQuotesAroundScriptNameIfItHasAColon(this.script);
      return runOne(
        process.cwd(),
        {
          "project:target:configuration": fullQualifiedTarget,
          ...options,
        },
        targetDependencies,
        extraOptions
      );
    } else {
      const { runMany } = require("nx/src/command-line/run-many");
      const projects = this.packagesWithScript.map((p) => p.name).join(",");
      return runMany(
        {
          projects,
          target: this.script,
          ...options,
        },
        targetDependencies,
        extraOptions
      );
    }
  }

  async prepNxOptions() {
    const nxJsonExists = existsSync(path.join(this.project.rootPath, "nx.json"));

    const { readNxJson } = require("nx/src/config/configuration");
    const nxJson = readNxJson();
    const targetDependenciesAreDefined =
      Object.keys(nxJson.targetDependencies || nxJson.targetDefaults || {}).length > 0;

    const hasProjectSpecificNxConfiguration = this.packagesWithScript.some((p) => !!p.get("nx"));
    const hasCustomizedNxConfiguration =
      (nxJsonExists && targetDependenciesAreDefined) || hasProjectSpecificNxConfiguration;
    const mimicLernaDefaultBehavior = !hasCustomizedNxConfiguration;

    const targetDependencies =
      this.toposort && !this.options.parallel && mimicLernaDefaultBehavior
        ? {
            [this.script]: [
              {
                projects: "dependencies",
                target: this.script,
              },
            ],
          }
        : {};

    if (this.options.prefix === false && !this.options.stream) {
      this.logger.warn(this.name, `"no-prefix" is ignored when not using streaming output.`);
    }

    const outputStyle = this.options.stream
      ? this.prefix
        ? "stream"
        : "stream-without-prefixes"
      : "dynamic";

    const options = {
      outputStyle,
      /**
       * To match lerna's own behavior (via pMap's default concurrency), we set parallel to a very large number if
       * the flag has been set (we can't use Infinity because that would cause issues with the task runner).
       */
      parallel: this.options.parallel && mimicLernaDefaultBehavior ? 999 : this.concurrency,
      nxBail: this.bail,
      nxIgnoreCycles: !this.options.rejectCycles,
      skipNxCache: this.options.skipNxCache,
      verbose: this.options.verbose,
      __overrides__: this.args.map((t) => t.toString()),
    };

    if (hasCustomizedNxConfiguration) {
      this.logger.verbose(
        this.name,
        "Nx target configuration was found. Task dependencies will be automatically included."
      );

      if (this.options.parallel || this.options.sort !== undefined) {
        this.logger.warn(
          this.name,
          `"parallel", "sort", and "no-sort" are ignored when Nx targets are configured. See https://lerna.js.org/docs/lerna6-obsolete-options for details.`
        );
      }

      if (this.options.includeDependencies) {
        this.logger.info(
          this.name,
          `Using the "include-dependencies" option when Nx targets are configured will include both task dependencies detected by Nx and project dependencies detected by Lerna. See https://lerna.js.org/docs/lerna6-obsolete-options#--include-dependencies for details.`
        );
      }

      if (this.options.ignore) {
        this.logger.info(
          this.name,
          `Using the "ignore" option when Nx targets are configured will exclude only tasks that are not determined to be required by Nx. See https://lerna.js.org/docs/lerna6-obsolete-options#--ignore for details.`
        );
      }
    } else {
      this.logger.verbose(
        this.name,
        "Nx target configuration was not found. Task dependencies will not be automatically included."
      );
    }

    const extraOptions = {
      excludeTaskDependencies: mimicLernaDefaultBehavior,
      loadDotEnvFiles: this.options.loadEnvFiles ?? true,
    };

    return { targetDependencies, options, extraOptions };
  }

  runScriptInPackagesParallel() {
    return pMap(this.packagesWithScript, (pkg) => this.runScriptInPackageStreaming(pkg));
  }

  runScriptInPackagesLexical() {
    return pMap(this.packagesWithScript, this.getRunner(), { concurrency: this.concurrency });
  }

  runScriptInPackageStreaming(pkg) {
    return npmRunScriptStreaming(this.script, this.getOpts(pkg));
  }

  runScriptInPackageCapturing(pkg) {
    const getElapsed = timer();
    return npmRunScript(this.script, this.getOpts(pkg)).then((result) => {
      this.logger.info(
        "run",
        "Ran npm script '%s' in '%s' in %ss:",
        this.script,
        pkg.name,
        (getElapsed() / 1000).toFixed(1)
      );
      output(result.stdout);

      return result;
    });
  }

  configureNxOutput() {
    try {
      const nxOutput = require("nx/src/utils/output");
      nxOutput.output.cliName = "Lerna (powered by Nx)";
      nxOutput.output.formatCommand = (taskId) => taskId;
      return nxOutput;
    } catch (err) {
      // This should be unreachable and we would want to know if it somehow occurred in a user's setup.
      this.logger.error(
        "\n",
        "There was a critical error when configuring the task runner, please report this on https://github.com/lerna/lerna"
      );
      throw err;
    }
  }
}

module.exports.RunCommand = RunCommand;
