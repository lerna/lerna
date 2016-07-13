import FileSystemUtilities from "./FileSystemUtilities";
import PackageUtilities from "./PackageUtilities";
import ExitHandler from "./ExitHandler";
import progressBar from "./progressBar";
import Repository from "./Repository";
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
    if (this.concurrency < 1) {
      this.logger.warning("command must be run with at least one thread.");
      this._complete(null, 1);
      return;
    }

    if (!FileSystemUtilities.existsSync(this.repository.packagesLocation)) {
      this.logger.warning("`packages/` directory does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!FileSystemUtilities.existsSync(this.repository.packageJsonLocation)) {
      this.logger.warning("`package.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (!FileSystemUtilities.existsSync(this.repository.lernaJsonLocation)) {
      this.logger.warning("`lerna.json` does not exist, have you run `lerna init`?");
      this._complete(null, 1);
      return;
    }

    if (this.flags.independent && !this.repository.isIndependent()) {
      this.logger.warning(
        "You ran lerna with `--independent` or `-i`, but the repository is not set to independent mode. " +
        "To use independent mode you need to set your `lerna.json` \"version\" to \"independent\". " +
        "Then you won't need to pass the `--independent` or `-i` flags."
      );
      this._complete(null, 1);
      return;
    }

    if (
      process.env.NODE_ENV !== "test" &&
      this.lernaVersion !== this.repository.lernaVersion
    ) {
      this.logger.warning(
        `Lerna version mismatch: The current version of lerna is ${this.lernaVersion}, ` +
        `but the Lerna version in \`lerna.json\` is ${this.repository.lernaVersion}. ` +
        `You can either run \`lerna init\` again or install \`lerna@${this.repository.lernaVersion}\`.`
      );
      this._complete(null, 1);
      return;
    }

    if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      this.logger.warning("You have a `VERSION` file in your repository, this is leftover from a previous ");
      this._complete(null, 1);
      return;
    }

    if (process.env.NPM_DIST_TAG !== undefined) {
      this.logger.warning("`NPM_DIST_TAG=[tagname] lerna publish` is deprecated, please use `lerna publish --tag [tagname]` instead.");
      this._complete(null, 1);
      return;
    }

    if (process.env.FORCE_VERSION !== undefined) {
      this.logger.warning("`FORCE_VERSION=[package/*] lerna updated/publish` is deprecated, please use `lerna updated/publish --force-publish [package/*]` instead.");
      this._complete(null, 1);
      return;
    }
  }

  runPreparations() {
    try {
      this.packages = PackageUtilities.getPackages(this.repository.packagesLocation);
      this.packageGraph = PackageUtilities.getPackageGraph(this.packages);
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
      this.logger.debug(`Attempting running ${methodName}`);

      this[method]((err, completed) => {
        if (err) {
          this.logger.error(`Errored while running ${methodName}`, err);
          this._complete(err, 1, callback);
        } else if (!completed) {
          this.logger.debug(`Exited early while running ${methodName}`);
          this._complete(null, 1, callback);
        } else {
          this.logger.debug(`Successfully ran ${methodName}`);
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

    if (callback) {
      callback(err, code);
    }

    if (process.env.NODE_ENV !== "test") {
      process.exit(code);
    }
  }

  initialize() {
    throw new Error("command.initialize() needs to be implemented.");
  }

  execute() {
    throw new Error("command.execute() needs to be implemented.");
  }
}
