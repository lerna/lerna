import FileSystemUtilities from "./FileSystemUtilities";
import PackageUtilities from "./PackageUtilities";
import ExitHandler from "./ExitHandler";
import progressBar from "./progressBar";
import Repository from "./Repository";
import logger from "./logger";

export default class Command {
  constructor(input, flags) {
    this.input = input;
    this.flags = flags;

    this.lernaVersion = require("../package.json").version;
    this.repository = new Repository();
    this.progressBar = progressBar;
    this.logger = logger;
  }

  run() {
    this.runPreparations();
    this.runCommand();
  }

  runPreparations() {
    this.logger.info("Lerna v" + this.lernaVersion);

    if (this.flags.independent) {
      this.logger.info("Independent Versioning Mode");
    }

    if (this.flags.canary) {
      this.logger.info("Publishing canary build");
    }

    if (!FileSystemUtilities.existsSync(this.repository.packagesLocation)) {
      this.logger.error("`packages/` directory does not exist, have you run `lerna init`?");
      this._complete(1);
      return;
    }

    if (!FileSystemUtilities.existsSync(this.repository.packageJsonLocation)) {
      this.logger.error("`package.json` does not exist, have you run `lerna init`?");
      this._complete(1);
      return;
    }

    if (!this.flags.independent && !FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      this.logger.error("`VERSION` does not exist, have you run `lerna init`? Or maybe you meant to run this with `--independent` or `-i`?");
      this._complete(1);
      return;
    }

    try {
      this.packages = PackageUtilities.getPackages(this.repository.packagesLocation);
      this.packageGraph = PackageUtilities.getPackageGraph(this.packages);
    } catch (err) {
      this.logger.error("Errored while collecting packages and package graph", err);
      this._complete(1);
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
