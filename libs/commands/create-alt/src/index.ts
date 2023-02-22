// @ts-nocheck
import { Command } from "@lerna/core";
import { createProjectGraphAsync, readNxJson, workspaceRoot, Workspaces } from "@nrwl/devkit";
import { flushChanges, FsTree } from "nx/src/generators/tree";
import { readProjectsConfigurationFromProjectGraph } from "nx/src/project-graph/project-graph";
import { handleErrors } from "nx/src/utils/params";
import { generatorFactory } from "./lib/generators/default/generator";
import { combineOptionsForGenerator } from "./lib/utils";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new CreateCommand(argv);
};

class CreateCommand extends Command {
  initialize() {}

  async execute() {
    const ws = new Workspaces(workspaceRoot);

    // TODO: Figure out why daemon is causing it to hang
    const nxDaemon = process.env.NX_DAEMON;
    process.env.NX_DAEMON = "false";
    const projectGraph = await createProjectGraphAsync();
    process.env.NX_DAEMON = nxDaemon;

    const projectsConfiguration = readProjectsConfigurationFromProjectGraph(projectGraph);
    const isVerbose = this.argv["verbose"];

    return await handleErrors(isVerbose, async () => {
      this.logger.info(`lerna doing schtuff...`);

      const cwd = process.cwd();

      const tree = new FsTree(workspaceRoot, isVerbose);

      const nxJsonConfiguration = readNxJson(tree);
      const workspaceConfiguration = {
        ...nxJsonConfiguration,
        ...projectsConfiguration,
      };

      const generatorImplementation = generatorFactory(this.logger);

      const task = await generatorImplementation(tree, this.argv);
      const changes = tree.listChanges();

      const chalk = require("chalk");

      function printChanges(fileChanges, indent = "") {
        fileChanges.forEach((f) => {
          if (f.type === "CREATE") {
            console.log(`${indent}${chalk.green("CREATE")} ${f.path}`);
          } else if (f.type === "UPDATE") {
            console.log(`${indent}${chalk.white("UPDATE")} ${f.path}`);
            // console.log(
            //   diff(host.fsReadFile(f.path).toString(), f.content.toString(), {
            //     omitAnnotationLines: true,
            //     contextLines: 1,
            //     expand: false,
            //     aColor: chalk.red,
            //     bColor: chalk.green,
            //     patchColor: (s) => "",
            //   })
            // );
            console.log("\n");
          } else if (f.type === "DELETE") {
            console.log(`${indent}${chalk.yellow("DELETE")} ${f.path}`);
          }
        });
      }

      printChanges(changes);
      if (!this.argv.dryRun) {
        flushChanges(workspaceRoot, changes);
        if (task) {
          await task();
        }
      } else {
        this.logger.warn("version", `The "dryRun" flag means no changes were made.`);
      }
    });
  }
}

module.exports.CreateCommand = CreateCommand;
