import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";

export function handler(argv) {
  return new RunCommand([argv.script, ...argv.args], argv).run();
}

export const command = "run <script> [args..]";

export const describe = "Run an npm script in each package that contains that script.";

export const builder = {
  "stream": {
    describe: "Stream output with lines prefixed by package."
  }
};

export default class RunCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);

    if (!this.script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    if (this.script === "test" || this.script === "env") {
      this.packagesWithScript = this.filteredPackages;
    } else {
      this.packagesWithScript = this.filteredPackages
        .filter((pkg) => pkg.scripts && pkg.scripts[this.script]);
    }

    if (!this.packagesWithScript.length) {
      callback(new Error(`No packages found with the npm script '${this.script}'`));
      return;
    }

    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.packagesWithScript, { logger: this.logger })
      : [ this.packagesWithScript ];

    callback(null, true);
  }

  execute(callback) {
    this.runScriptInPackages((err) => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully ran npm script '${this.script}' in packages:`);
        this.logger.success(this.packagesWithScript.map((pkg) => `- ${pkg.name}`).join("\n"));
        callback(null, true);
      }
    });
  }

  runScriptInPackages(callback) {
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runScriptInPackage(pkg, done);
    }, this.concurrency, callback);
  }

  runScriptInPackage(pkg, callback) {
    if (this.getOptions().stream) {
      this.runScriptInPackageStreaming(pkg, callback);
    } else {
      this.runScriptInPackageCapturing(pkg, callback);
    }
  }

  runScriptInPackageStreaming(pkg, callback) {
    NpmUtilities.runScriptInPackageStreaming(this.script, this.args, pkg, callback);
  }

  runScriptInPackageCapturing(pkg, callback) {
    NpmUtilities.runScriptInDir(this.script, this.args, pkg.location, (err, stdout) => {
      if (err) {
        this.logger.error(`Errored while running npm script '${this.script}' in '${pkg.name}'`);
      } else {
        this.logger.info(stdout);
      }
      callback(err);
    });
  }
}
