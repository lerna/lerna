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

    this.nestedPackage = process.env.LERNA_SCRIPT_NESTED_PACKAGE;

    this.batchedPackages
      = this.nestedPackage
      ? [[ this.repository.packages.filter(({ name }) => (name === this.nestedPackage)).pop() ]]
      : this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages, {logger: this.logger})
      : [ this.filteredPackages ];

    callback(null, true);
  }

  execute(callback) {
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runLernaLifecycleScriptInPackage(pkg, done);
    }, this.concurrency, (err) => {
      if (err) {
        callback(err);
      } else {
        if (!this.nestedPackage) {
          this.logger.success(`Successfully ran lerna script '${this.script}' in packages:`);
          this.logger.success(this.filteredPackages.map((pkg) => `- ${pkg.name}`).join("\n"));
        }
        callback(null, true);
      }
    });
  }

  runLernaLifecycleScriptInPackage(pkg, callback) {
    this.runLernaScriptInPackage({ pkg, prefix: "pre" }, (precode) => {
      if (precode) callback(precode);
      else this.runLernaScriptInPackage({ pkg, prefix: "" }, (code) => {
        if (code) callback(code);
        else this.runLernaScriptInPackage({ pkg, prefix: "post" }, (postcode) => {
          callback(postcode);
        });
      });
    });
  }

  runLernaScriptInPackage({ pkg, prefix }, callback) {
    const script = `${prefix}${this.script}`;
    const rawCommand = this.repository.scripts[script];
    if (!rawCommand) {
      callback(prefix ? null : new Error(`No lerna scripts found with '${script}'`));
    } else {
      const command = prefix ? rawCommand : [rawCommand, ...this.args].join(" ");
      this.runCommandInPackage({ pkg, script, command }, callback);
    }
  }

  runCommandInPackage({ pkg, script, command }, callback) {
    const stream = this.getOptions().stream;
    const prefix = stream ? `${pkg.name}: ` : "";
    const opts = {
      cwd: pkg.location,
      env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: pkg.name })
    };
    const logInfo = (stdout) => {
      this.logger.info(prefix);
      this.logger.info(`${prefix}> ${pkg.name}@${pkg.version} ${script} ${pkg.location}`);
      this.logger.info(`${prefix}> ${command}`);
      this.logger.info(prefix);
      if (stdout)
        this.logger.info(stdout.split("\n").map((line) => line).join("\n"));
    };
    const cb = (code, stdout) => {
      if (!stream)
        logInfo(stdout);
      if (code)
        this.logger.error(`Errored while running command '${command}' in '${pkg.name}'`);
      callback(code);
    };
    if (!stream) {
      ChildProcessUtilities.exec(command, opts, cb);
    } else {
      logInfo();
      ChildProcessUtilities.execStreaming(command, opts, prefix, cb);
    }
  }

}
