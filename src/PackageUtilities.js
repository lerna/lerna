import FileSystemUtilities from "./FileSystemUtilities";
import PackageGraph from "./PackageGraph";
import Package from "./Package";
import path from "path";

export default class PackageUtilities {
  static getGlobalVersion(versionPath) {
    if (FileSystemUtilities.existsSync(versionPath)) {
      return FileSystemUtilities.readFileSync(versionPath, "utf8").trim();
    }
  }

  static getPackagesPath(rootPath) {
    return path.join(rootPath, "packages");
  }

  static getPackagePath(packagesPath, name) {
    return path.join(packagesPath, name);
  }

  static getPackageConfigPath(packagesPath, name) {
    return path.join(PackageUtilities.getPackagePath(packagesPath, name), "package.json");
  }

  static getPackageConfig(packagesPath, name) {
    return require(PackageUtilities.getPackageConfigPath(packagesPath, name));
  }

  static getPackages(packagesPath) {
    const packages = [];

    FileSystemUtilities.readdirSync(packagesPath).forEach(packageDirectory => {
      if (packageDirectory[0] === ".") {
        return;
      }

      const packagePath = PackageUtilities.getPackagePath(packagesPath, packageDirectory);
      const packageConfigPath = PackageUtilities.getPackageConfigPath(packagesPath, packageDirectory);

      if (!FileSystemUtilities.existsSync(packageConfigPath)) {
        return;
      }

      const packageJson = require(packageConfigPath);
      const pkg = new Package(packageJson, packagePath);

      packages.push(pkg);
    });

    return packages;
  }

  static getPackageGraph(packages) {
    return new PackageGraph(packages);
  }
}
