import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import ConfigUtilities from "./ConfigUtilities";
import NpmUtilities from "./NpmUtilities";
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
    this.concurrency = (!flags || flags.concurrency === undefined) ? DEFAULT_CONCURRENCY : Math.max(1, +flags.concurrency || DEFAULT_CONCURRENCY);
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
    if (!NpmUtilities.getWhoIAm()) {
      this.logger.warn("You're not logged in; you may not be able to perform some commands.");
    }

    const lernaRegistry = ConfigUtilities.read(this.repository.rootPath).registry;
    const npmRegistry = NpmUtilities.getConfig('registry');
    if (lernaRegistry) {
      if (npmRegistry !== lernaRegistry) {
        this.logger.warn(
          `Your lerna.json specifies that you should use the registry ` +
          `${lernaRegistry}.\nTo change npm to use ${lernaRegistry} ` +
          `instead, run \`npm config set registry ${lernaRegistry}\`.`
        );
      }
    } else {
      if (npmRegistry !== 'http://registry.npmjs.com/') {
        this.logger.warn(
          `You have no configured registry, and your npm is not pointed at ` +
          `the public registry, so your packages won't be on npmjs.com.\n` +
          `To suppress this message, add a "registry" key to lerna.json with ` +
          `the result of \`npm config get registry\`.`
        );
      }
    }

    if (this.concurrency < 1) {
      this.logger.warn("command must be run with at least one thread.");
      this._complete(null, 1);
      return;
    }

    if (!FileSystemUtilities.existsSync(this.repository.packageJsonLocation)) {
      this.logger.warn("`package.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!FileSystemUtilities.existsSync(this.repository.lernaJsonLocation)) {
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
      this.lernaVersion !== this.repository.lernaVersion
    ) {
      this.logger.warn(
        `Lerna version mismatch: The current version of lerna is ${this.lernaVersion}, ` +
        `but the Lerna version in \`lerna.json\` is ${this.repository.lernaVersion}. ` +
        `You can either run \`lerna init\` again or install \`lerna@${this.repository.lernaVersion}\`.`
      );
      this._complete(null, 1);
      return;
    }

    if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      this.logger.warn("You have a `VERSION` file in your repository, this is leftover from a previous ");
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
  }

  runPreparations() {
    const scope = this.flags.scope || (this.configFlags && this.configFlags.scope);
    const ignore = this.flags.ignore || (this.configFlags && this.configFlags.ignore);

    if (scope) {
      this.logger.info(`Scoping to packages that match '${scope}'`);
    }
    if (ignore) {
      this.logger.info(`Ignoring packages that match '${ignore}'`);
    }
    try {
      this.repository.buildPackageGraph();
      this.packages = this.repository.packages;
      this.filteredPackages = PackageUtilities.filterPackages(this.packages, {scope, ignore});
      this.packageGraph = this.repository.packageGraph;
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
      exitHandler.writeLogs();
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
      logger.info(
        `Waiting for ${childProcessCount} child ` +
        `process${childProcessCount === 1 ? "" : "es"} to exit. ` +
        "CTRL-C to exit immediately."
      );
      ChildProcessUtilities.onAllExited(finish);
    } else {
      finish();
    }
  }

  initialize() {
    throw new Error("command.initialize() needs to be implemented.");
  }

  execute() {
    throw new Error("command.execute() needs to be implemented.");
  }
}
