import GitUtilities from "./GitUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import path from "path";

export default class Repository {
  constructor() {
    this.rootPath = GitUtilities.getTopLevelDirectory();

    this.lernaJsonLocation = path.join(this.rootPath, "lerna.json");
    this.packageJsonLocation = path.join(this.rootPath, "package.json");
    this.versionLocation = path.join(this.rootPath, "VERSION");

    if (FileSystemUtilities.existsSync(this.lernaJsonLocation)) {
      this.lernaJson = JSON.parse(FileSystemUtilities.readFileSync(this.lernaJsonLocation));
    }

    if (FileSystemUtilities.existsSync(this.packageJsonLocation)) {
      this.packageJson = JSON.parse(FileSystemUtilities.readFileSync(this.packageJsonLocation));
    }

    this.packagesLocation = path.join(this.rootPath, "packages");
  }

  getVersion() {
    return FileSystemUtilities.readFileSync(this.versionLocation).toString().trim();
  }
}
