import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";
import path from "path";
import chokidar from "chokidar";
import chalk from "chalk";

export default class WatchCommand extends Command {
  initialize(callback) {
    const [glob, script, ...args] = this.input;
    this.glob = glob;
    this.script = script;
    this.args = args;

    if (!this.script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    if (!this.glob) {
      callback(new Error("You must specify glob of files to watch."));
      return;
    }

    this.packagesToWatch = this.packages
      .filter((pkg) => pkg.scripts && pkg.scripts[this.script]);

    if (!this.packagesToWatch.length) {
      callback(new Error(`No packages found with the npm script '${this.script}'`));
      return;
    }

    if (this.flags.scope) {
      this.logger.info(`Scoping to packages that match '${this.flags.scope}'`);
      try {
        this.packagesToWatch = PackageUtilities.filterPackages(this.packagesToWatch, this.flags.scope);
      } catch (err) {
        callback(err);
        return;
      }
    } else if (this.flags.ignore) {
      this.logger.info(`Ignoring packages that match '${this.flags.ignore}'`);
      try {
        this.packagesToWatch = PackageUtilities.filterPackages(this.packagesToWatch, this.flags.ignore, true);
      } catch (err) {
        callback(err);
        return;
      }
    }

    callback(null, true);
  }

  execute() {
    this.logger.info(`Watching for changes in package files that match '${this.glob}'`);
    const globPath = (pkg) => path.join(this.repository.packagesLocation, pkg.name, this.glob);
    // watch all package files matching passed glob
    chokidar.watch(this.packagesToWatch.map(globPath)).on("change", (src) => {
      const [pkg] = path.relative(this.repository.packagesLocation, src).split(path.sep);
      const packageLocation = path.join(this.repository.packagesLocation, pkg);
      const srcFile = path.relative(packageLocation, src);
      console.log(`${chalk.cyan(`${pkg}/${srcFile}`)} changed, running ${chalk.yellow(this.script)} script`);
      NpmUtilities.runScriptInDir(this.script, [srcFile].concat(this.args), packageLocation, (err, stdout) => {
        this.logger.info(stdout);
        if (err) {
          this.logger.error(err);
        }
      });
    });
  }
}
