import FileSystemUtilities from "./FileSystemUtilities";
import PackageUtilities from "./PackageUtilities";
import progressBar from "./progressBar";
import Repository from "./Repository";
import logger from "./logger";
import exit from "./exit";

export default class Command {
  constructor(input, flags) {
    this.input = input;
    this.flags = flags;

    this.lernaVersion = require("../package.json").version;
    this.repository = new Repository();
    this.progressBar = progressBar;
    this.logger = logger;
    this.exit = exit;
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
      this.exit(1);
    }

    if (!FileSystemUtilities.existsSync(this.repository.packageJsonLocation)) {
      this.logger.error("`package.json` does not exist, have you run `lerna init`?");
      this.exit(1);
    }

    if (!this.flags.independent && !FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      this.logger.error("`VERSION` does not exist, have you run `lerna init`? Or maybe you meant to run this with `--independent` or `-i`?");
      this.exit(1);
    }

    this.packages = PackageUtilities.getPackages(this.repository.packagesLocation);
    this.packageGraph = PackageUtilities.getPackageGraph(this.packages);
  }

  runCommand() {
    this.initialize(() => {
      this.execute();
    });
  }

  initialize() {
    throw new Error("command.initialize() needs to be implemented.");
  }

  execute() {
    throw new Error("command.execute() needs to be implemented.");
  }
}
