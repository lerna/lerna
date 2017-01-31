import Command from "../Command";
import ConfigUtilities from "../ConfigUtilities";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";
import NpmUtilities from "../NpmUtilities";
import path from "path";

export default class CreateCommand extends Command {
  initialize(callback) {
    this.pkgName = this.input[0];

    callback(null, true);
  }

  execute(callback) {
    const author = NpmUtilities.getWhoIAm();
    const name = this.pkgName;
    const config = ConfigUtilities.readSync(this.repository.rootPath);
    const {registry, packages} = config;
    const pkgRoot = path.join(".", packages ? path.dirname(packages) : "packages", this.pkgName);
    const packageJsonLocation = path.join(pkgRoot, "package.json");
    const message = `Created package ${this.pkgName}`;
    const manifest = {
      name,
      author,
      version: "1.0.0",
      publishConfig: registry ? { registry } : undefined
    };

    FileSystemUtilities.mkdirp(pkgRoot, () => {
      FileSystemUtilities.writeFileSync(packageJsonLocation, JSON.stringify(manifest));
      GitUtilities.addFile(packageJsonLocation);
      GitUtilities.commit(message);
      this.logger.info(message);
      callback(null, true);
    });
  }
}
