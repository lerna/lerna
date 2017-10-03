import _ from "lodash";
import dedent from "dedent";
import log from "npmlog";

import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import GitUtilities from "./GitUtilities";
import PackageUtilities from "./PackageUtilities";
import Repository from "./Repository";
import filterFlags from "./utils/filterFlags";
import writeLogFile from "./utils/writeLogFile";
import UpdatedPackagesCollector from "./UpdatedPackagesCollector";

// handle log.success()
log.addLevel("success", 3001, { fg: "green", bold: true });

const DEFAULT_CONCURRENCY = 4;

export const builder = {
  "loglevel": {
    defaultDescription: "info",
    describe: "What level of logs to report.",
    type: "string",
  },
  "concurrency": {
    describe: "How many threads to use if lerna parallelises the tasks.",
    type: "number",
    requiresArg: true,
  },
  "scope": {
    describe: dedent`
      Restricts the scope to package names matching the given glob.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: true,
  },
  "since": {
    describe: dedent`
      Restricts the scope to the packages that have been updated since
      the specified [ref], or if not specified, the latest tag.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: false,
  },
  "ignore": {
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
  "registry": {
    describe: "Use the specified registry for all npm client operations.",
    type: "string",
    requiresArg: true,
  },
  "sort": {
    describe: "Sort packages topologically (all dependencies before dependents)",
    type: "boolean",
    default: undefined,
  },
  "max-buffer": {
    describe: "Set max-buffer(bytes) for Command execution",
    type: "number",
    requiresArg: true,
  }
};

export class ValidationError extends Error {
  constructor(prefix, message) {
    super(message);
    this.name = "ValidationError";
    log.error(prefix, message);
  }
}

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

    this.lernaVersion = require("../package.json").version;
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
      const lernaCommandOverrides = [
        this.name,
        ...this.otherCommandConfigs,
      ].map((name) => (commands || command || {})[name]);

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
    const { loglevel } = this.options;

    if (loglevel) {
      log.level = loglevel;
    }

    // no logging is emitted until run() is called
    log.resume();
    log.info("version", this.lernaVersion);

    if (this.repository.isIndependent()) {
      log.info("versioning", "independent");
    }

    return new Promise((resolve, reject) => {
      const onComplete = (err, exitCode) => {
        if (err) {
          err.exitCode = exitCode;
          reject(err);
        } else {
          resolve({ exitCode });
        }
      };

      try {
        this.runValidations();
        this.runPreparations();
      } catch (err) {
        return this._complete(err, 1, onComplete);
      }

      this.runCommand(onComplete);
    });
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

    if (!this.repository.initVersion) {
      throw new ValidationError("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
    }

    if (this.options.independent && !this.repository.isIndependent()) {
      throw new ValidationError(
        "EVERSIONMODE",
        "You ran lerna with `--independent` or `-i`, but the repository is not set to independent mode. " +
        "To use independent mode you need to set your `lerna.json` \"version\" to \"independent\". " +
        "Then you won't need to pass the `--independent` or `-i` flags."
      );
    }

    if (
      process.env.NODE_ENV !== "lerna-test" &&
      !this.repository.isCompatibleLerna(this.lernaVersion)
    ) {
      throw new ValidationError(
        "EMISMATCH",
        `Lerna major version mismatch: The current version of lerna is ${this.lernaVersion}, ` +
        `but the Lerna version in \`lerna.json\` is ${this.repository.initVersion}. ` +
        `You can either run \`lerna init\` again or install \`lerna@${this.repository.initVersion}\`.`
      );
    }

    /* eslint-disable max-len */
    // TODO: remove these warnings eventually
    if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      throw new ValidationWarning("You have a `VERSION` file in your repository, this is leftover from a previous version. Please run `lerna init` to update.");
    }

    if (process.env.NPM_DIST_TAG !== undefined) {
      throw new ValidationWarning("`NPM_DIST_TAG=[tagname] lerna publish` is deprecated, please use `lerna publish --tag [tagname]` instead.");
    }

    if (process.env.FORCE_VERSION !== undefined) {
      throw new ValidationWarning("`FORCE_VERSION=[package/*] lerna updated/publish` is deprecated, please use `lerna updated/publish --force-publish [package/*]` instead.");
    }

    if (this.options.onlyExplicitUpdates) {
      throw new ValidationWarning("`--only-explicit-updates` has been removed. This flag was only ever added for Babel and we never should have exposed it to everyone.");
    }
    /* eslint-enable max-len */
  }

  runPreparations() {
    const { scope, ignore, registry, since } = this.options;

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
      this.repository.buildPackageGraph();
      this.packages = this.repository.packages;
      this.packageGraph = this.repository.packageGraph;
      this.filteredPackages = PackageUtilities.filterPackages(this.packages, { scope, ignore });

      // The UpdatedPackagesCollector requires that filteredPackages be present prior to checking for
      // updates. That's okay because it further filters based on what's already been filtered.
      if (typeof since === "string") {
        const updated = new UpdatedPackagesCollector(this).getUpdates().map((update) => update.package.name);
        this.filteredPackages = this.filteredPackages.filter((pkg) => updated.indexOf(pkg.name) > -1);
      }

      if (this.options.includeFilteredDependencies) {
        this.filteredPackages = PackageUtilities.addDependencies(this.filteredPackages, this.packageGraph);
      }
    } catch (err) {
      log.error("EPACKAGES", "Errored while collecting packages and package graph", err);
      throw err;
    }
  }

  runCommand(callback) {
    this._attempt("initialize", () => {
      this._attempt("execute", () => {
        this._complete(null, 0, callback);
      }, callback);
    }, callback);
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
            log.error(method, "callback with error\n", err);
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
        log.error(method, "caught error\n", err);
      }
      this._complete(err, 1, callback);
    }
  }

  _complete(err, code, callback) {
    if (
      err &&
      err.name !== "ValidationWarning" &&
      err.name !== "ValidationError"
    ) {
      writeLogFile(this.repository.rootPath);
    }

    const finish = function() {
      if (callback) {
        callback(err, code);
      }

      if (process.env.NODE_ENV !== "lerna-test") {
        // TODO: don't call process.exit()
        // eslint-disable-next-line no-process-exit
        process.exit(code);
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

  _logPackageError(method, err) {
    log.error(method, dedent`
      Error occured with '${err.pkg.name}' while running '${err.cmd}'
    `);

    const pkgPrefix = `${err.cmd} [${err.pkg.name}]`;
    log.error(pkgPrefix, `Output from stdout:`);
    log.pause();
    console.error(err.stdout);

    log.resume();
    log.error(pkgPrefix, `Output from stderr:`);
    log.pause();
    console.error(err.stderr);

    // Below is just to ensure something sensible is printed after the long
    // stream of logs
    log.resume();
    log.error(method, dedent`
      Error occured with '${err.pkg.name}' while running '${err.cmd}'
    `);
  }
}

export function commandNameFromClassName(className) {
  return className.replace(/Command$/, "").toLowerCase();
}
