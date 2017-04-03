import UpdatedPackagesCollector from "./UpdatedPackagesCollector";
import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import GitUtilities from "./GitUtilities";
import ExitHandler from "./ExitHandler";
import progressBar from "./progressBar";
import Repository from "./Repository";
import PackageUtilities from "./PackageUtilities";
import logger from "./logger";

const DEFAULT_CONCURRENCY = 4;

export default class Command {
  constructor(input, flags) {
    this.input = input;
    this.flags = flags;

    this.lernaVersion = require("../package.json").version;
    this.logger = logger;
    this.repository = new Repository();
    this.progressBar = progressBar;
  }

  get concurrency() {
    if (!this._concurrency) {
      const { concurrency } = this.getOptions();
      this._concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    }

    return this._concurrency;
  }

  get toposort() {
    if (!this._toposort) {
      const { sort } = this.getOptions();
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

  // Override this to inherit config from another command.
  // For example `updated` inherits config from `publish`.
  get otherCommandConfigs() {
    return [];
  }

  getOptions(...objects) {

    // Command config object is either "commands" or "command".
    const {commands, command} = this.repository.lernaJson;

    // Items lower down override items higher up.
    return Object.assign(
      {},

      // Deprecated legacy options in `lerna.json`.
      this._legacyOptions(),

      // Global options from `lerna.json`.
      this.repository.lernaJson,

      // Option overrides for commands.
      // Inherited options from `otherCommandConfigs` come before the current
      // command's configuration.
      ...[...this.otherCommandConfigs, this.name]
        .map((name) => (commands || command || {})[name]),

      // For example, the item from the `packages` array in config.
      ...objects,

      // CLI flags always override everything.
      this.flags
    );
  }

  run() {
    this.logger.info("Lerna v" + this.lernaVersion);

    if (this.repository.isIndependent()) {
      this.logger.info("Independent Versioning Mode");
    }

    this.runValidations();
    this.runPreparations();
    this.runCommand();
  }

  runValidations() {
    if (!GitUtilities.isInitialized()) {
      this.logger.warn("This is not a git repository, did you already run `git init` or `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!this.repository.packageJson) {
      this.logger.warn("`package.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!this.repository.initVersion) {
      this.logger.warn("`lerna.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (this.flags.independent && !this.repository.isIndependent()) {
      this.logger.warn(
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
      this.logger.warn(
        `Lerna major version mismatch: The current version of lerna is ${this.lernaVersion}, ` +
        `but the Lerna version in \`lerna.json\` is ${this.repository.initVersion}. ` +
        `You can either run \`lerna init\` again or install \`lerna@${this.repository.initVersion}\`.`
      );
      this._complete(null, 1);
      return;
    }

    if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      this.logger.warn("You have a `VERSION` file in your repository, this is leftover from a previous version. Please run `lerna init` to update.");
      this._complete(null, 1);
      return;
    }

    if (process.env.NPM_DIST_TAG !== undefined) {
      this.logger.warn("`NPM_DIST_TAG=[tagname] lerna publish` is deprecated, please use `lerna publish --tag [tagname]` instead.");
      this._complete(null, 1);
      return;
    }

    if (process.env.FORCE_VERSION !== undefined) {
      this.logger.warn("`FORCE_VERSION=[package/*] lerna updated/publish` is deprecated, please use `lerna updated/publish --force-publish [package/*]` instead.");
      this._complete(null, 1);
      return;
    }

    if (this.flags.onlyExplicitUpdates) {
      this.logger.warn("`--only-explicit-updates` has been removed. This flag was only ever added for Babel and we never should have exposed it to everyone.");
      this._complete(null, 1);
      return;
    }
  }

  runPreparations() {
    const {scope, ignore, registry} = this.getOptions();

    if (scope) {
      this.logger.info(`Scoping to packages that match '${scope}'`);
    }
    if (ignore) {
      this.logger.info(`Ignoring packages that match '${ignore}'`);
    }
    if (registry) {
      this.npmRegistry = registry;
    }
    try {
      this.repository.buildPackageGraph();
      this.packages = this.repository.packages;
      this.packageGraph = this.repository.packageGraph;
      this.filteredPackages = PackageUtilities.filterPackages(this.packages, {scope, ignore});
      if (this.getOptions().includeFilteredDependencies) {
        this.filteredPackages = PackageUtilities.addDependencies(this.filteredPackages, this.packageGraph);
      }
      if (this.flags.onlyUpdated) {
        const updatedPackagesCollector = new UpdatedPackagesCollector(this);
        this.filteredPackages = updatedPackagesCollector.getUpdates()
          .map((update) => update.package)
          .filter((pkg) => this.filteredPackages.some((p) => p.name === pkg.name))
        ;
      }
      console.log(this.flags);
    } catch (err) {
      this.logger.error("Errored while collecting packages and package graph", err);
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
    const methodName = `${this.constructor.name}.${method}`;

    try {
      this.logger.verbose(`Attempting running ${methodName}`);

      this[method]((err, completed) => {
        if (err) {
          this.logger.error(`Errored while running ${methodName}`, err);
          this._complete(err, 1, callback);
        } else if (!completed) {
          this.logger.verbose(`Exited early while running ${methodName}`);
          this._complete(null, 1, callback);
        } else {
          this.logger.verbose(`Successfully ran ${methodName}`);
          next();
        }
      });
    } catch (err) {
      this.logger.error(`Errored while running ${methodName}`, err);
      this._complete(err, 1, callback);
    }
  }

  _complete(err, code, callback) {
    if (code !== 0) {
      const exitHandler = new ExitHandler();
      exitHandler.writeLogs(this.logger);
    }

    const finish = function() {
      if (callback) {
        callback(err, code);
      }

      if (process.env.NODE_ENV !== "lerna-test") {
        process.exit(code);
      }
    };

    const childProcessCount = ChildProcessUtilities.getChildProcessCount();
    if (childProcessCount > 0) {
      this.logger.info(
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
        this.logger.warn(`\`${command}Config.ignore\` is deprecated.  Use \`commands.${command}.ignore\`.`);
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

export function exposeCommands(commands) {
  return commands.reduce((obj, cls) => {
    const commandName = commandNameFromClassName(cls.name);
    if (!cls.name.match(/Command$/)) {
      throw new Error(`Invalid command class name "${cls.name}".  Must end with "Command".`);
    }
    if (obj[commandName]) {
      throw new Error(`Duplicate command: "${commandName}"`);
    }
    if (!Command.isPrototypeOf(cls)) {
      throw new Error(`Command does not extend Command: "${cls.name}"`);
    }
    obj[commandName] = cls;
    return obj;
  }, {});
}
