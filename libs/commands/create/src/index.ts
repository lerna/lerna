import { Command, npmConf, ValidationError } from "@lerna/core";
import { workspaceRoot } from "@nrwl/devkit";
import npa from "npm-package-arg";
import { FsTree } from "nx/src/generators/tree";
import { handleErrors } from "nx/src/utils/params";
import path from "path";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new CreateCommand(argv);
};

class CreateCommand extends Command {
  generatorOptions = {};

  initialize() {}

  async execute() {
    const isVerbose = this.argv["verbose"];
    const isDryRun = this.argv["dryRun"];

    return await handleErrors(isVerbose, async () => {
      const tree = new FsTree(workspaceRoot, isVerbose);
      const generatorImplementation = generatorFactory(this.logger);
      const task = await generatorImplementation(tree, this.generatorOptions);
      const changes = tree.listChanges();

      const chalk = require("chalk");

      function printChanges(fileChanges, indent = "") {
        fileChanges.forEach((f) => {
          if (f.type === "CREATE") {
            console.log(`${indent}${chalk.green("CREATE")} ${f.path}`);
          } else if (f.type === "UPDATE") {
            console.log(`${indent}${chalk.white("UPDATE")} ${f.path}`);
            console.log("\n");
          } else if (f.type === "DELETE") {
            console.log(`${indent}${chalk.yellow("DELETE")} ${f.path}`);
          }
        });
      }

      if (isDryRun) {
        this.logger.info("create", `The generator wants to make the following changes to the file system`);
      } else {
        this.logger.info("create", `The generator is making the following changes to the file system`);
      }

      printChanges(changes, "  ");

      if (!isDryRun) {
        flushChanges(workspaceRoot, changes);
        if (task) {
          await task();
        }
      } else {
        this.logger.warn("create", `The "dryRun" flag means no changes were made.`);
      }
    });
  }
}

module.exports.CreateCommand = CreateCommand;
