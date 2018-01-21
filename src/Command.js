"use strict";

const _ = require("lodash");
const dedent = require("dedent");
const log = require("npmlog");

const ChildProcessUtilities = require("./ChildProcessUtilities");
const GitUtilities = require("./GitUtilities");
const GitVersionParser = require("./GitVersionParser");
const PackageUtilities = require("./PackageUtilities");
const Repository = require("./Repository");
const filterFlags = require("./utils/filterFlags");
const writeLogFile = require("./utils/writeLogFile");
const UpdatedPackagesCollector = require("./UpdatedPackagesCollector");
const VersionSerializer = require("./VersionSerializer");
const ValidationError = require("./utils/ValidationError");

// handle log.success()
log.addLevel("success", 3001, { fg: "green", bold: true });

const DEFAULT_CONCURRENCY = 4;
const LERNA_VERSION = require("../package.json").version;

const builder = {
  loglevel: {
    defaultDescription: "info",
    describe: "What level of logs to report.",
    type: "string",
  },
  concurrency: {
    describe: "How many threads to use if lerna parallelises the tasks.",
    type: "number",
    requiresArg: true,
  },
  scope: {
    describe: dedent`
      Restricts the scope to package names matching the given glob.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: true,
  },
  since: {
    describe: dedent`
      Restricts the scope to the packages that have been updated since
      the specified [ref], or if not specified, the latest tag.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: false,
  },
  ignore: {
    describe: dedent`
      Ignore packages with names matching the given glob.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: true,
  },
  "include-filtered-dependencies": {
    describe: dedent`
      Include all transitive dependencies when running a command, regardless of --scope, --since or --ignore.
    `,
  },
  registry: {
    describe: "Use the specified registry for all npm client operations.",
    type: "string",
    requiresArg: true,
  },
  "reject-cycles": {
    describe: "Fail if a cycle is detected among dependencies",
    type: "boolean",
    default: false,
  },
  sort: {
    describe: "Sort packages topologically (all dependencies before dependents)",
    type: "boolean",
    default: undefined,
  },
  "max-buffer": {
    describe: "Set max-buffer(bytes) for Command execution",
    type: "number",
    requiresArg: true,
  },
};

class Command {
  constructor(argv) {
    log.pause();
    log.heading = "lerna";

    this._argv = argv;
    log.silly("argv", filterFlags(argv));

    this.lernaVersion = LERNA_VERSION;
    log.info("version", this.lernaVersion);

    // launch the command
    const runner = new Promise((resolve, reject) => {
      const onComplete = (err, exitCode) => {
        if (err) {
          if (typeof err === "string") {
            err = { stack: err }; // eslint-disable-line no-param-reassign
          }
          err.exitCode = exitCode;
          reject(err);
        } else {
          resolve({ exitCode });
        }
      };

      try {
        this.repository = new Repository(argv.cwd);
        this.configureLogging();
        this.runValidations();
        this.runPreparations();
      } catch (err) {
        return this._complete(err, 1, onComplete);
      }

      this.runCommand(onComplete);
    });

    // passed via yargs context, never actual CLI
    runner.then(argv.onResolved, argv.onRejected);

    // proxy "Promise" methods to "private" instance
    this.then = (onResolved, onRejected) => runner.then(onResolved, onRejected);
    this.catch = onRejected => runner.catch(onRejected);
  }

  get concurrency() {
    if (!this._concurrency) {
      const { concurrency } = this.options;
      this._concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    }

    return this._concurrency;
  }

  get toposort() {
    const { sort } = this.options;
    // If the option isn't present then the default is to sort.
    return sort === undefined || sort;
  }

  get name() {
    // For a class named "FooCommand" this returns "foo".
    return commandNameFromClassName(this.className);
  }

  get className() {
    return this.constructor.name;
  }

  get execOpts() {
    if (!this._execOpts) {
      this._execOpts = {
        cwd: this.repository.rootPath,
      };

      if (this.options.maxBuffer) {
        this._execOpts.maxBuffer = this.options.maxBuffer;
      }
    }

    return this._execOpts;
  }

  get requiresGit() {
    return true;
  }

  // Override this to inherit config from another command.
  // For example `updated` inherits config from `publish`.
  get otherCommandConfigs() {
    return [];
  }

  get options() {
    if (!this._options) {
      // Command config object is either "commands" or "command".
      const { commands, command } = this.repository.lernaJson;

      // The current command always overrides otherCommandConfigs
      const lernaCommandOverrides = [this.name, ...this.otherCommandConfigs].map(
        name => (commands || command || {})[name]
      );

      this._options = _.defaults(
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

    return this._options;
  }

  get defaultOptions() {
    return {
      concurrency: DEFAULT_CONCURRENCY,
      sort: true,
    };
  }

  configureLogging() {
    // this.options getter might throw (invalid JSON in lerna.json)
    const { loglevel } = this.options;

    if (loglevel) {
      log.level = loglevel;
    }

    // create logger that subclasses use
    this.logger = log.newGroup(this.name);

    // emit all buffered logs at configured level and higher
    log.resume();
  }

  runValidations() {
    if (this.requiresGit && !GitUtilities.isInitialized(this.execOpts)) {
      throw new ValidationError(
        "ENOGIT",
        "This is not a git repository, did you already run `git init` or `lerna init`?"
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
    const { scope, ignore, registry, since, useGitVersion, gitVersionPrefix } = this.options;

    if (scope) {
      log.info("scope", scope);
    }

    if (ignore) {
      log.info("ignore", ignore);
    }

    if (registry) {
      this.npmRegistry = registry;
    }

    try {
      const versionParser = useGitVersion && new GitVersionParser(gitVersionPrefix);
      const packages = PackageUtilities.getPackages({ rootPath, packageConfigs });
      const packageGraph = PackageUtilities.getPackageGraph(packages, false, versionParser);

      if (useGitVersion) {
        packages.forEach(pkg => {
          pkg.versionSerializer = new VersionSerializer({
            graphDependencies: packageGraph.get(pkg.name).dependencies,
            versionParser,
          });
        });
      }

      this.packages = packages;
      this.packageGraph = packageGraph;
      this.filteredPackages = PackageUtilities.filterPackages(packages, { scope, ignore });

      // The UpdatedPackagesCollector requires that filteredPackages be present prior to checking for
      // updates. That's okay because it further filters based on what's already been filtered.
      if (typeof since === "string") {
        const updated = new UpdatedPackagesCollector(this).getUpdates().map(update => update.package.name);
        this.filteredPackages = this.filteredPackages.filter(pkg => updated.indexOf(pkg.name) > -1);
      }

      if (this.options.includeFilteredDependencies) {
        this.filteredPackages = PackageUtilities.addDependencies(this.filteredPackages, this.packageGraph);
      }
    } catch (err) {
      this._logError("EPACKAGES", "Errored while collecting packages and package graph", err);
      throw err;
    }
  }

  runCommand(callback) {
    this._attempt(
      "initialize",
      () => {
        this._attempt(
          "execute",
          () => {
            this._complete(null, 0, callback);
          },
          callback
        );
      },
      callback
    );
  }

  _attempt(method, next, callback) {
    try {
      log.silly(method, "attempt");

      this[method]((err, completed, code = 0) => {
        if (err) {
          // If we have package details we can direct the developers attention
          // to that specific package.
          if (err.pkg) {
            this._logPackageError(method, err);
          } else {
            this._logError(method, "callback with error", err);
          }
          this._complete(err, 1, callback);
        } else if (!completed) {
          // an early exit is rarely an error
          log.verbose(method, "exited early");
          this._complete(null, code, callback);
        } else {
          log.silly(method, "success");
          next();
        }
      });
    } catch (err) {
      // ValidationError already logged appropriately
      if (err.name !== "ValidationError") {
        this._logError(method, "caught error", err);
      }
      this._complete(err, 1, callback);
    }
  }

  _complete(err, code, callback) {
    if (err && err.name !== "ValidationError") {
      writeLogFile(this.repository.rootPath);
    }

    // process.exit() is an anti-pattern
    process.exitCode = code;

    const finish = () => {
      if (callback) {
        callback(err, code);
      }
    };

    const childProcessCount = ChildProcessUtilities.getChildProcessCount();
    if (childProcessCount > 0) {
      log.warn(
        "complete",
        `Waiting for ${childProcessCount} child ` +
          `process${childProcessCount === 1 ? "" : "es"} to exit. ` +
          "CTRL-C to exit immediately."
      );
      ChildProcessUtilities.onAllExited(finish);
    } else {
      finish();
    }
  }

  _legacyOptions() {
    return ["bootstrap", "publish"].reduce((opts, command) => {
      if (this.name === command && this.repository.lernaJson[`${command}Config`]) {
        log.warn(
          "deprecated",
          `\`${command}Config.ignore\` has been replaced by \`command.${command}.ignore\`.`
        );
        opts.ignore = this.repository.lernaJson[`${command}Config`].ignore;
      }
      return opts;
    }, {});
  }

  initialize() {
    throw new Error("command.initialize() needs to be implemented.");
  }

  execute() {
    throw new Error("command.execute() needs to be implemented.");
  }

  _logError(method, description, err) {
    log.error(method, description);

    // npmlog does some funny stuff to the stack by default,
    // so pass it directly to avoid duplication.
    log.error("", cleanStack(err, this.className));
  }

  _logPackageError(method, err) {
    log.error(method, `Error occured with '${err.pkg.name}' while running '${err.cmd}'`);

    const pkgPrefix = `${err.cmd} [${err.pkg.name}]`;
    log.error(pkgPrefix, `Output from stdout:`);
    log.pause();
    console.error(err.stdout); // eslint-disable-line no-console

    log.resume();
    log.error(pkgPrefix, `Output from stderr:`);
    log.pause();
    console.error(err.stderr); // eslint-disable-line no-console

    // Below is just to ensure something sensible is printed after the long
    // stream of logs
    log.resume();
    log.error(method, `Error occured with '${err.pkg.name}' while running '${err.cmd}'`);
  }
}

function commandNameFromClassName(className) {
  return className.replace(/Command$/, "").toLowerCase();
}

function cleanStack(err, className) {
  const lines = err.stack ? err.stack.split("\n") : err.split("\n");
  const cutoff = new RegExp(`^    at ${className}._attempt .*$`);
  const relevantIndex = lines.findIndex(line => cutoff.test(line));
  return lines.slice(0, relevantIndex).join("\n");
}

module.exports = Command;
module.exports.builder = builder;
