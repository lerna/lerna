import _ from "lodash";
import dedent from "dedent";
import log from "npmlog";

import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import GitUtilities from "./GitUtilities";
import GitVersionParser from "./GitVersionParser";
import PackageUtilities from "./PackageUtilities";
import Repository from "./Repository";
import filterFlags from "./utils/filterFlags";
import writeLogFile from "./utils/writeLogFile";
import UpdatedPackagesCollector from "./UpdatedPackagesCollector";
import VersionSerializer from "./VersionSerializer";
import ValidationError from "./utils/ValidationError";

// handle log.success()
log.addLevel("success", 3001, { fg: "green", bold: true });

const DEFAULT_CONCURRENCY = 4;
const LERNA_VERSION = require("../package.json").version;

export const builder = {
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
  "include-filtered-dependents": {
    describe: dedent`
      Include all transitive dependents when running a command, regardless of --scope, --since or --ignore.
    `,
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

class ValidationWarning extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationWarning";
    log.warn("EINVALID", message);
  }
}

export default class Command {
  constructor(input, flags, cwd) {
    log.pause();
    log.heading = "lerna";

    this.input = input;
    this._flags = flags;

    log.silly("input", input);
    log.silly("flags", filterFlags(flags));

    this.lernaVersion = LERNA_VERSION;
    this.repository = new Repository(cwd);
    this.logger = log.newGroup(this.name);
  }

  get concurrency() {
    if (!this._concurrency) {
      const { concurrency } = this.options;
      this._concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    }

    return this._concurrency;
  }

  get toposort() {
    if (!this._toposort) {
      const { sort } = this.options;
      // If the option isn't present then the default is to sort.
      this._toposort = sort == null || sort;
    }

    return this._toposort;
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
        this._flags,
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

  run() {
    log.info("version", this.lernaVersion);

    return new Promise((resolve, reject) => {
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
        this.configureLogging();
        this.runValidations();
        this.runPreparations();
      } catch (err) {
        return this._complete(err, 1, onComplete);
      }

      this.runCommand(onComplete);
    });
  }

  configureLogging() {
    // this.options getter might throw (invalid JSON in lerna.json)
    const { loglevel } = this.options;

    if (loglevel) {
      log.level = loglevel;
    }

    // emit all buffered logs at configured level and higher
    log.resume();
  }

  runValidations() {
    const { independent, onlyExplicitUpdates } = this.options;

    if (this.requiresGit && !GitUtilities.isInitialized(this.execOpts)) {
      throw new ValidationError(
        "ENOGIT",
        "git binary missing, or this is not a git repository. Did you already run `git init` or `lerna init`?"
      );
    }

    if (!this.repository.packageJson) {
      throw new ValidationError("ENOPKG", "`package.json` does not exist, have you run `lerna init`?");
    }

    if (!this.repository.initVersion) {
      throw new ValidationError("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
    }

    if (independent && !this.repository.isIndependent()) {
      throw new ValidationError(
        "EVERSIONMODE",
        dedent`
          You ran lerna with --independent or -i, but the repository is not set to independent mode.
          To use independent mode you need to set lerna.json's "version" property to "independent".
          Then you won't need to pass the --independent or -i flags.
        `
      );
    }

    if (!this.repository.isCompatibleLerna(this.lernaVersion)) {
      throw new ValidationError(
        "EMISMATCH",
        dedent`
          Incompatible local version of lerna detected!
          The running version of lerna is ${this.lernaVersion}, but the version in lerna.json is ${
          this.repository.initVersion
        }.
          You can either run 'lerna init' again or install 'lerna@^${this.repository.initVersion}'.
        `
      );
    }

    /* eslint-disable max-len */
    // TODO: remove these warnings eventually
    if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      throw new ValidationWarning(
        "You have a `VERSION` file in your repository, this is leftover from a previous version. Please run `lerna init` to update."
      );
    }

    if (process.env.NPM_DIST_TAG !== undefined) {
      throw new ValidationWarning(
        "`NPM_DIST_TAG=[tagname] lerna publish` is deprecated, please use `lerna publish --tag [tagname]` instead."
      );
    }

    if (process.env.FORCE_VERSION !== undefined) {
      throw new ValidationWarning(
        "`FORCE_VERSION=[package/*] lerna updated/publish` is deprecated, please use `lerna updated/publish --force-publish [package/*]` instead."
      );
    }

    if (onlyExplicitUpdates) {
      throw new ValidationWarning(
        "`--only-explicit-updates` has been removed. This flag was only ever added for Babel and we never should have exposed it to everyone."
      );
    }
    /* eslint-enable max-len */
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

      if (this.options.includeFilteredDependents) {
        this.filteredPackages = PackageUtilities.addDependents(this.filteredPackages, this.packageGraph);
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
    if (err && err.name !== "ValidationWarning" && err.name !== "ValidationError") {
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

export function commandNameFromClassName(className) {
  return className.replace(/Command$/, "").toLowerCase();
}

function cleanStack(err, className) {
  const lines = err.stack ? err.stack.split("\n") : err.split("\n");
  const cutoff = new RegExp(`^    at ${className}._attempt .*$`);
  const relevantIndex = lines.findIndex(line => cutoff.test(line));
  return lines.slice(0, relevantIndex).join("\n");
}
