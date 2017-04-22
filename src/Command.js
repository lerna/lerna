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
    default: DEFAULT_CONCURRENCY,
  },
  "scope": {
    describe: dedent`
      Restricts the scope to package names matching the given glob.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: true,
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
      Include all transitive dependencies when running a command, regardless of --scope or --ignore.
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
    default: true,
  },
};

export default class Command {
  constructor(input, flags, cwd) {
    log.pause();
    log.heading = "lerna";

    if (flags.loglevel) {
      log.level = flags.loglevel;
    }

    this.input = input;
    this.flags = flags;

    log.verbose("input", input);
    log.verbose("flags", filterFlags(flags));

    this.lernaVersion = require("../package.json").version;
    this.repository = new Repository(cwd);
    this.logger = log.newGroup(this.name);

    log.resume();
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
    }

    return this._execOpts;
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
        this.flags,
        // Namespaced command options from `lerna.json`
        ...lernaCommandOverrides,
        // Global options from `lerna.json`
        this.repository.lernaJson,
        // Deprecated legacy options in `lerna.json`
        this._legacyOptions()
      );
    }

    return this._options;
  }

  run() {
    log.info("version", this.lernaVersion);

    if (this.repository.isIndependent()) {
      log.info("versioning", "independent");
    }

    this.runValidations();
    this.runPreparations();
    this.runCommand();
  }

  runValidations() {
    if (!GitUtilities.isInitialized(this.repository.rootPath)) {
      log.error("ENOGIT", "This is not a git repository, did you already run `git init` or `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!this.repository.packageJson) {
      log.error("ENOPKG", "`package.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!this.repository.initVersion) {
      log.error("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (this.options.independent && !this.repository.isIndependent()) {
      log.error(
        "EVERSIONMODE",
        "You ran lerna with `--independent` or `-i`, but the repository is not set to independent mode. " +
        "To use independent mode you need to set your `lerna.json` \"version\" to \"independent\". " +
        "Then you won't need to pass the `--independent` or `-i` flags."
      );
      this._complete(null, 1);
      return;
    }

    if (
      process.env.NODE_ENV !== "lerna-test" &&
      !this.repository.isCompatibleLerna(this.lernaVersion)
    ) {
      log.error(
        "EMISMATCH",
        `Lerna major version mismatch: The current version of lerna is ${this.lernaVersion}, ` +
        `but the Lerna version in \`lerna.json\` is ${this.repository.initVersion}. ` +
        `You can either run \`lerna init\` again or install \`lerna@${this.repository.initVersion}\`.`
      );
      this._complete(null, 1);
      return;
    }

    /* eslint-disable max-len */
    // TODO: remove these warnings eventually
    if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      log.warn("You have a `VERSION` file in your repository, this is leftover from a previous version. Please run `lerna init` to update.");
      this._complete(null, 1);
      return;
    }

    if (process.env.NPM_DIST_TAG !== undefined) {
      log.warn("`NPM_DIST_TAG=[tagname] lerna publish` is deprecated, please use `lerna publish --tag [tagname]` instead.");
      this._complete(null, 1);
      return;
    }

    if (process.env.FORCE_VERSION !== undefined) {
      log.warn("`FORCE_VERSION=[package/*] lerna updated/publish` is deprecated, please use `lerna updated/publish --force-publish [package/*]` instead.");
      this._complete(null, 1);
      return;
    }

    if (this.options.onlyExplicitUpdates) {
      log.warn("`--only-explicit-updates` has been removed. This flag was only ever added for Babel and we never should have exposed it to everyone.");
      this._complete(null, 1);
      return;
    }
    /* eslint-enable max-len */
  }

  runPreparations() {
    const { scope, ignore, registry } = this.options;

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

      if (this.options.includeFilteredDependencies) {
        this.filteredPackages = PackageUtilities.addDependencies(this.filteredPackages, this.packageGraph);
      }
    } catch (err) {
      log.error("EPACKAGES", "Errored while collecting packages and package graph", err);
      this._complete(null, 1);
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

      this[method]((err, completed) => {
        if (err) {
          log.error(method, "callback with error\n", err);
          this._complete(err, 1, callback);
        } else if (!completed) {
          log.verbose(method, "exited early");
          this._complete(null, 1, callback);
        } else {
          log.verbose(method, "success");
          next();
        }
      });
    } catch (err) {
      log.error(method, "caught error\n", err);
      this._complete(err, 1, callback);
    }
  }

  _complete(err, code, callback) {
    if (code !== 0) {
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
}

export function commandNameFromClassName(className) {
  return className.replace(/Command$/, "").toLowerCase();
}
