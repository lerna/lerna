import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import FileSystemUtilities from "../FileSystemUtilities";
import async from "async";
import path from "path";
import userHome from "user-home";

export default class ExportCommand extends Command {
  initialize(callback) {
    this.dry = this.flags.dryRun;

    this.pkg = this.input[0];
    this.to = this.input[1] || userHome;

    if (this.dry) {
      this.logger.info("The following directories would be moved");
    }

    callback(null, true);
  }

  execute(callback) {
    if (!this.to) {
      // we actually know that this is an error earlier, during initialization,
      // but calling the initialization errback with an error doesn't halt
      // execution and print a nice error like the execute errback.
      return callback(new Error("no directory found to export to; please provide a second argument"));
    }

    if (this.pkg) {
      const pkg = this.packageGraph.get(this.pkg);

      if (!pkg) {
        if (this.to) {
          return callback(`no such package to export ${this.pkg}`);
        } else {
          // they're not exporting a single package to their home directory,
          // they're exporting everything to a provided directory!
          this.to = this.pkg;
          this.pkg = undefined; // http://jsperf.com/delete-vs-undefined-vs-null/16
        }
      }

      this.runCommandInPackage(pkg.package, callback);
    } else {
      async.parallelLimit(this.filteredPackages.map((pkg) => (cb) => {
        this.runCommandInPackage(pkg, cb);
      }), this.concurrency, callback);
    }
  }

  runCommandInPackage(pkg, callback) {
    const to = path.join(this.to, path.basename(pkg._location));

    if (this.dry) {
      this.logger.info(`  - ${pkg._location} -> ${to}`);
      return callback(null, true);
    } else {
      const branchName = `export-${pkg.name}`;
      ChildProcessUtilities.execSync(`git subtree split -P ${pkg._location.replace(process.cwd() + "/", "")} -b ${branchName}`);
      FileSystemUtilities.mkdirSync(to);
      ChildProcessUtilities.execSync("git init", {cwd: to});
      ChildProcessUtilities.execSync(`git pull ${process.cwd()} ${branchName}`, {cwd: to});
      ChildProcessUtilities.execSync(`git rm -r ${pkg._location}`);
      return callback(null, true);
    }
  }
}
