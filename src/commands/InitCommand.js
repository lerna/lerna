import FileSystemUtilities from "../FileSystemUtilities";
import Command from "../Command";

export default class InitCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback();
  }

  execute() {
    this.ensurePackagesDirectory();
    this.ensurePackageJSON();
    if (!this.flags.independent) {
      this.ensureVersion();
    }
  }

  ensurePackagesDirectory() {
    const packagesLocation = this.repository.packagesLocation;
    if (!FileSystemUtilities.existsSync(packagesLocation)) {
      this.logger.info("Creating packages folder.");
      FileSystemUtilities.mkdirSync(packagesLocation);
    }
  }

  ensurePackageJSON() {
    const packagesLocation = this.repository.packageJsonLocation;

    if (!FileSystemUtilities.existsSync(packagesLocation)) {
      this.logger.info("Creating package.json.");
      FileSystemUtilities.writeFileSync(packagesLocation, JSON.stringify({
        private: true,
        dependencies: {
          lerna: "^" + this.lernaVersion,
        }
      }, null, "  "));
    }
  }

  ensureVersion() {
    const versionLocation = this.repository.versionLocation;
    if (!FileSystemUtilities.existsSync(versionLocation)) {
      this.logger.info("Creating VERSION file.");
      FileSystemUtilities.writeFileSync(versionLocation, "0.0.0");
    }
  }
}
