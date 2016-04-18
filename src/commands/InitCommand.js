import FileSystemUtilities from "../FileSystemUtilities";
import Command from "../Command";

export default class InitCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    this.ensurePackagesDirectory();
    this.ensurePackageJSON();
    this.ensureVersion();
    this.logger.success("Successfully created Lerna files");
    callback(null, true);
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
    if (!this.flags.independent) {
      const versionLocation = this.repository.versionLocation;
      if (!FileSystemUtilities.existsSync(versionLocation)) {
        this.logger.info("Creating VERSION file.");
        FileSystemUtilities.writeFileSync(versionLocation, "0.0.0");
      }
    }
  }
}
