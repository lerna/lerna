"use strict";

const _ = require("lodash");
const dedent = require("dedent");
const execa = require("execa");
const log = require("npmlog");

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

class Command {
  constructor(argv) {
    log.pause();
    log.heading = "lerna";

    this._argv = argv;
    log.silly("argv", argv);

    this.lernaVersion = argv.lernaVersion;
    log.info("version", this.lernaVersion);

    // "FooCommand" => "foo"
    this.name = this.constructor.name.replace(/Command$/, "").toLowerCase();

    // launch the command
    let runner = new Promise((resolve, reject) => {
      // run everything inside a Promise chain
      let chain = Promise.resolve();

      chain = chain.then(() => {
        this.project = new Project(argv.cwd);
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

          // ValidationError does not trigger a log dump, nor do external package errors
          if (err.name !== "ValidationError" && !err.pkg) {
            writeLogFile(this.project.rootPath);
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

  configureOptions() {
    // Command config object normalized to "command" namespace
    const commandConfig = this.project.config.command || {};

    // The current command always overrides otherCommandConfigs
    const overrides = [this.name, ...this.otherCommandConfigs].map(key => commandConfig[key]);

    this.options = _.defaults(
      {},
      // CLI flags, which if defined overrule subsequent values
      this._argv,
      // Namespaced command options from `lerna.json`
      ...overrides,
      // Global options from `lerna.json`
      this.project.config
    );
  }

  configureProperties() {
    const { concurrency, sort, maxBuffer } = this.options;

    this.concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    this.toposort = sort === undefined || sort;
    this.execOpts = {
      cwd: this.project.rootPath,
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

  enableProgressBar() {
    // istanbul ignore else
    if (this.options.progress) {
      this.logger.enableProgress();
    }
  }

  gitInitialized() {
    const opts = {
      cwd: this.project.rootPath,
      // don't throw, just want boolean
      reject: false,
      // only return code, no stdio needed
      stdio: "ignore",
    };

    return execa.sync("git", ["rev-parse"], opts).code === 0;
  }

  runValidations() {
    if ((this.options.since !== undefined || this.requiresGit) && !this.gitInitialized()) {
      throw new ValidationError("ENOGIT", "The git binary was not found, or this is not a git repository.");
    }

    if (!this.project.manifest) {
      throw new ValidationError("ENOPKG", "`package.json` does not exist, have you run `lerna init`?");
    }

    if (!this.project.version) {
      throw new ValidationError("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
    }

    if (this.options.independent && !this.project.isIndependent()) {
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
    if (this.project.isIndependent()) {
      log.info("versioning", "independent");
    }

    const { rootPath, packageConfigs } = this.project;
    const { scope: include, ignore: exclude } = this.options;

    let chain = Promise.resolve();

    chain = chain.then(() => collectPackages(rootPath, packageConfigs));
    chain = chain.then(packages => {
      this.packages = packages;
      this.packageGraph = new PackageGraph(packages);
      this.filteredPackages = filterPackages(packages, include, exclude, this.options.private);
    });

    // collectUpdates requires that filteredPackages be present prior to checking for
    // updates. That's okay because it further filters based on what's already been filtered.
    if (this.options.since !== undefined) {
      chain = chain.then(() => collectUpdates(this));
      chain = chain.then(updates => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        this.filteredPackages = this.filteredPackages.filter(pkg => updated.has(pkg.name));
      });
    }

    if (this.options.includeFilteredDependents) {
      chain = chain.then(() => {
        this.filteredPackages = this.packageGraph.addDependents(this.filteredPackages);
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

  initialize() {
    throw new ValidationError(this.name, "initialize() needs to be implemented.");
  }

  execute() {
    throw new ValidationError(this.name, "execute() needs to be implemented.");
  }
}

module.exports = Command;
