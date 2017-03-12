import ChildProcessUtilities from "../ChildProcessUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";

export default class ScriptCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);
    
    if (!this.script) {
      callback(new Error("You must specify which lerna script to run."));
      return;
    }

    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages, {logger: this.logger})
      : [ this.filteredPackages ];

    callback(null, true);
  }

  execute(callback) {
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runLernaLifecycleScriptInPackage(pkg, done);
    }, this.concurrency, callback);
  }

  runLernaLifecycleScriptInPackage(pkg, callback) {
    this.runLernaScriptInPackage({ pkg, prefix: "pre" }, (precode) => {
      if (precode) callback(precode);
      else this.runLernaScriptInPackage({ pkg }, (code) => {
        if (code) callback(code);
        else this.runLernaScriptInPackage({ pkg, prefix: "post" }, (postcode) => {
          callback(postcode);
        });
      });
    });
  }

  runLernaScriptInPackage({ pkg, prefix = "" }, callback) {
    const script = `${prefix}${this.script}`;
    const input = this.repository.scripts[script];
    if (!input) {
      callback(prefix ? null : new Error(`No lerna scripts found with '${script}'`));
    } else {
      const args = input.split(" ").concat(prefix ? [] : this.args);
      const command = args.shift();
      this.runCommandInPackage({ pkg, command, args }, callback);
    }
  }

  runCommandInPackage({ pkg, command, args }, callback) {
    ChildProcessUtilities.spawn(command, args, {
      cwd: pkg.location,
      env: process.env
    }, (code) => {
      if (code) {
        this.logger.error(`Errored while running command '${command}' ` +
                          `with arguments '${args.join(" ")}' in '${pkg.name}'`);
      }
      callback(code);
    });
  }

}
