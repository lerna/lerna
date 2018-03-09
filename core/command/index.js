"use strict";

const _ = require("lodash");
const dedent = require("dedent");
const log = require("npmlog");

const GitUtilities = require("@lerna/git-utils");
const PackageGraph = require("@lerna/package-graph");
const Project = require("@lerna/project");
const writeLogFile = require("@lerna/write-log-file");
const collectPackages = require("@lerna/collect-packages");
const collectUpdates = require("@lerna/collect-updates");
const filterPackages = require("@lerna/filter-packages");
const ValidationError = require("@lerna/validation-error");

const cleanStack = require("./lib/clean-stack");
const logPackageError = require("./lib/log-package-error");
const warnIfHanging = require("./lib/warn-if-hanging");

const DEFAULT_CONCURRENCY = 4;
const LERNA_VERSION = require("./package.json").version; // FIXME: this is wrong now

class Command {
  constructor(argv) {
    log.pause();
    log.heading = "lerna";

    this._argv = argv;
    log.silly("argv", argv);

    this.lernaVersion = LERNA_VERSION;
    log.info("version", this.lernaVersion);

    // "FooCommand" => "foo"
    this.name = this.constructor.name.replace(/Command$/, "").toLowerCase();

    // launch the command
    let runner = new Promise((resolve, reject) => {
      // run everything inside a Promise chain
      let chain = Promise.resolve();

      chain = chain.then(() => {
        this.repository = new Project(argv.cwd);
      });
      chain = chain.then(() => this.configureOptions());
      chain = chain.then(() => this.configureProperties());
      chain = chain.then(() => this.configureLogging());
      chain = chain.then(() => this.runValidations());
      chain = chain.then(() => this.runPreparations());
      chain = chain.then(() => this.runCommand());

      chain.then(
        result => {
          warnIfHanging();

          resolve(result);
        },
        err => {
          if (err.pkg) {
            // Cleanly log specific package error details
            logPackageError(err);
          } else if (err.name !== "ValidationError") {
            // npmlog does some funny stuff to the stack by default,
            // so pass it directly to avoid duplication.
            log.error("", cleanStack(err, this.constructor.name));
          }

          // ValidationError does not trigger a log dump
          if (err.name !== "ValidationError") {
            writeLogFile(this.repository.rootPath);
          }

          warnIfHanging();

          // error code is handled by cli.fail()
          reject(err);
        }
      );
    });

    // passed via yargs context in tests, never actual CLI
    runner = runner.then(argv.onResolved, argv.onRejected);

    // proxy "Promise" methods to "private" instance
    this.then = (onResolved, onRejected) => runner.then(onResolved, onRejected);
    this.catch = onRejected => runner.catch(onRejected);
  }

  get requiresGit() {
    return true;
  }

  // Override this to inherit config from another command.
  // For example `changed` inherits config from `publish`.
  get otherCommandConfigs() {
    return [];
  }

  get defaultOptions() {
    return {
      concurrency: DEFAULT_CONCURRENCY,
      sort: true,
    };
  }

  configureOptions() {
    // Command config object is either "commands" or "command".
    const { commands, command } = this.repository.lernaJson;

    // The current command always overrides otherCommandConfigs
    const lernaCommandOverrides = [this.name, ...this.otherCommandConfigs].map(
      name => (commands || command || {})[name]
    );

    this.options = _.defaults(
      {},
      // CLI flags, which if defined overrule subsequent values
      this._argv,
      // Namespaced command options from `lerna.json`
      ...lernaCommandOverrides,
      // Global options from `lerna.json`
      this.repository.lernaJson,
      // Command specific defaults
      this.defaultOptions,
      // Deprecated legacy options in `lerna.json`
      this._legacyOptions()
    );
  }

  configureProperties() {
    const { concurrency, sort, maxBuffer } = this.options;

    this.concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    this.toposort = sort === undefined || sort;
    this.execOpts = {
      cwd: this.repository.rootPath,
      maxBuffer,
    };
  }

  configureLogging() {
    const { loglevel } = this.options;

    if (loglevel) {
      log.level = loglevel;
    }

    // handle log.success()
    log.addLevel("success", 3001, { fg: "green", bold: true });

    // create logger that subclasses use
    this.logger = log.newGroup(this.name);

    // emit all buffered logs at configured level and higher
    log.resume();
  }

  runValidations() {
    if (this.requiresGit && !GitUtilities.isInitialized(this.execOpts)) {
      throw new ValidationError(
        "ENOGIT",
        "git binary missing, or this is not a git repository. Did you already run `git init` or `lerna init`?"
      );
    }

    if (!this.repository.packageJson) {
      throw new ValidationError("ENOPKG", "`package.json` does not exist, have you run `lerna init`?");
    }

    if (!this.repository.version) {
      throw new ValidationError("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
    }

    if (this.options.independent && !this.repository.isIndependent()) {
      throw new ValidationError(
        "EVERSIONMODE",
        dedent`
          You ran lerna with --independent or -i, but the repository is not set to independent mode.
          To use independent mode you need to set lerna.json's "version" property to "independent".
          Then you won't need to pass the --independent or -i flags.
        `
      );
    }
  }

  runPreparations() {
    if (this.repository.isIndependent()) {
      log.info("versioning", "independent");
    }

    const { rootPath, packageConfigs } = this.repository;
    const { scope, ignore } = this.options;

    if (scope) {
      log.info("scope", scope);
    }

    if (ignore) {
      log.info("ignore", ignore);
    }

    let chain = Promise.resolve();

    chain = chain.then(() => collectPackages(rootPath, packageConfigs));
    chain = chain.then(packages => {
      this.packages = packages;
      this.packageGraph = new PackageGraph(packages);
      this.filteredPackages = filterPackages(packages, { scope, ignore }, this.options.private);
    });

    // collectUpdates requires that filteredPackages be present prior to checking for
    // updates. That's okay because it further filters based on what's already been filtered.
    if (typeof this.options.since === "string") {
      chain = chain.then(() => collectUpdates(this));
      chain = chain.then(updates => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        this.filteredPackages = this.filteredPackages.filter(pkg => updated.has(pkg.name));
      });
    }

    if (this.options.includeFilteredDependencies) {
      chain = chain.then(() => {
        this.filteredPackages = this.packageGraph.addDependencies(this.filteredPackages);
      });
    }

    return chain;
  }

  runCommand() {
    return Promise.resolve()
      .then(() => this.initialize())
      .then(proceed => {
        if (proceed !== false) {
          return this.execute();
        }
        // early exits set their own exitCode (if non-zero)
      });
  }

  _legacyOptions() {
    return ["bootstrap", "publish"].reduce((obj, command) => {
      if (this.name === command && this.repository.lernaJson[`${command}Config`]) {
        log.warn(
          "deprecated",
          `\`${command}Config.ignore\` has been replaced by \`command.${command}.ignore\`.`
        );
        obj.ignore = this.repository.lernaJson[`${command}Config`].ignore;
      }

      return obj;
    }, {});
  }

  initialize() {
    throw new Error("command.initialize() needs to be implemented.");
  }

  execute() {
    throw new Error("command.execute() needs to be implemented.");
  }
}

module.exports = Command;
