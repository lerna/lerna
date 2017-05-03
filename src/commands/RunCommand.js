import async from "async";

import Command from "../Command";
import NpmUtilities from "../NpmUtilities";
import output from "../utils/output";
import PackageUtilities from "../PackageUtilities";
import UpdatedPackagesCollector from "../UpdatedPackagesCollector";

export function handler(argv) {
  return new RunCommand([argv.script, ...argv.args], argv).run();
}

export const command = "run <script> [args..]";

export const describe = "Run an npm script in each package that contains that script.";

export const builder = {
  "stream": {
    group: "Command Options:",
    describe: "Stream output with lines prefixed by package.",
    type: "boolean",
  },
  "only-updated": {
    "describe": "When executing scripts/commands, only run the script/command on packages which "
    + "have been updated since the last release"
  },
  "parallel": {
    group: "Command Options:",
    describe: "Run script in all packages with unlimited concurrency, streaming prefixed output",
    type: "boolean",
  },
};

export default class RunCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);

    if (!this.script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    let filteredPackages = this.filteredPackages;
    if (this.flags.onlyUpdated) {
      const updatedPackagesCollector = new UpdatedPackagesCollector(this);
      const packageUpdates = updatedPackagesCollector.getUpdates();
      filteredPackages = PackageUtilities.filterPackagesThatAreNotUpdated(
        filteredPackages,
        packageUpdates
      );
    }

    if (this.script === "test" || this.script === "env") {
      this.packagesWithScript = filteredPackages;
    } else {
      this.packagesWithScript = filteredPackages
        .filter((pkg) => pkg.scripts && pkg.scripts[this.script]);
    }

    if (!this.packagesWithScript.length) {
      callback(new Error(`No packages found with the npm script '${this.script}'`));
      return;
    }

    if (this.options.parallel || this.options.stream) {
      // don't interrupt streaming stdio
      this.logger.disableProgress();
    }

    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.packagesWithScript)
      : [this.packagesWithScript];

    callback(null, true);
  }

  execute(callback) {
    const finish = (err) => {
      if (err) {
        callback(err);
      } else {
        this.logger.success("run", `Ran npm script '${this.script}' in packages:`);
        this.logger.success("", this.packagesWithScript.map((pkg) => `- ${pkg.name}`).join("\n"));
        callback(null, true);
      }
    };

    if (this.options.parallel) {
      this.runScriptInPackagesParallel(finish);
    } else {
      this.runScriptInPackagesBatched(finish);
    }
  }

  runScriptInPackagesBatched(callback) {
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runScriptInPackage(pkg, done);
    }, this.concurrency, callback);
  }

  runScriptInPackage(pkg, callback) {
    if (this.options.stream) {
      this.runScriptInPackageStreaming(pkg, callback);
    } else {
      this.runScriptInPackageCapturing(pkg, callback);
    }
  }

  runScriptInPackagesParallel(callback) {
    this.logger.info(
      "run",
      "in %d package(s): npm run %s",
      this.packagesWithScript.length,
      [this.script].concat(this.args).join(" ")
    );

    async.parallel(this.packagesWithScript.map((pkg) => (done) => {
      this.runScriptInPackageStreaming(pkg, done);
    }), callback);
  }

  runScriptInPackageStreaming(pkg, callback) {
    NpmUtilities.runScriptInPackageStreaming(this.script, this.args, pkg, callback);
  }

  runScriptInPackageCapturing(pkg, callback) {
    NpmUtilities.runScriptInDir(this.script, this.args, pkg.location, (err, stdout) => {
      if (err) {
        this.logger.error(this.script, `Errored while running script in '${pkg.name}'`);
      } else {
        output(stdout);
      }
      callback(err);
    });
  }
}
